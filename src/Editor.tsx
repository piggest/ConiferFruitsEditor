import { useEffect, useState } from 'react';
import { BlockNoteView } from '@blocknote/mantine';
import { useCreateBlockNote } from '@blocknote/react';
import '@blocknote/mantine/style.css';
import './styles/global.css';
import { normalizeMd, splitFrontmatter, decodeLinkUris } from './mdConverter';
import Toolbar from './Toolbar';

type Props = { path: string };

// customCss の各宣言に !important を付与して BlockNote 既定スタイルより優先させる
function boostImportant(css: string): string {
  return css.replace(/([a-zA-Z-][\w-]*)\s*:\s*([^;{}]+?)(\s*!important)?\s*;/g, (_m, prop, val) => {
    return `${prop}: ${val.trim()} !important;`;
  });
}

export default function Editor({ path }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sha, setSha] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [frontmatter, setFrontmatter] = useState('');
  const [customCss, setCustomCss] = useState<string | null>(null);

  const editor = useCreateBlockNote();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        // MDコンテンツとカスケードCSSを並行取得する
        const [{ content, sha: fileSha }, css] = await Promise.all([
          window.api.github.fetchFile(path),
          window.api.github.resolveCss(path),
        ]);
        if (cancelled) return;
        const { frontmatter: fm, body } = splitFrontmatter(content);
        setFrontmatter(fm);
        const blocks = await editor.tryParseMarkdownToBlocks(body);
        editor.replaceBlocks(editor.document, blocks);
        setSha(fileSha);
        setCustomCss(css);
        setDirty(false);
        setLoading(false);
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message);
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [path, editor]);

  const handleChange = () => setDirty(true);

  const handleSave = async () => {
    if (!sha) return;
    setSaving(true);
    setError(null);
    try {
      const rawBody = await editor.blocksToMarkdownLossy(editor.document);
      const decodedBody = decodeLinkUris(rawBody);
      const md = normalizeMd(frontmatter + decodedBody);
      await window.api.github.putFile({
        path,
        content: md,
        sha,
        message: `docs: ${path} を更新`,
      });
      setDirty(false);
      // 新しいshaを取得するため再フェッチ
      const fresh = await window.api.github.fetchFile(path);
      setSha(fresh.sha);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>読み込み中: {path}</div>;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Toolbar editor={editor as any} />
      <div style={{ display: 'flex', padding: 12, borderBottom: '1px solid #ddd', gap: 12, alignItems: 'center', background: '#fff' }}>
        <strong style={{ flex: 1 }}>{path}{dirty && ' *'}</strong>
        <button onClick={handleSave} disabled={!dirty || saving}>
          {saving ? '保存中...' : '編集完了（保存）'}
        </button>
      </div>
      {error && <div style={{ padding: 12, color: 'red', background: '#fee' }}>エラー: {error}</div>}
      {/* BlockNote の既定スタイルはセレクタ特異度が高く、customCss を押しのける。
          em 基準を 16px に合わせた上で、customCss の全宣言に !important を付与してサイトと同じ見た目にする */}
      {customCss && (
        <style dangerouslySetInnerHTML={{ __html: `
          /* BlockNoteがコンテナ階層でfont-sizeを積み増しているため em が暴発する。
             コンテナは 16px に揃え、見出し要素そのものには customCss を優先させる */
          .theme-doc-markdown .bn-editor,
          .theme-doc-markdown .bn-block-outer,
          .theme-doc-markdown .bn-block,
          .theme-doc-markdown .bn-block-content { font-size: 16px !important; }
          /* BlockNote がブロック間に padding を入れていて縦が間延びする。
             customCss の margin に任せるため padding は潰す */
          .theme-doc-markdown .bn-block-outer,
          .theme-doc-markdown .bn-block {
            padding-top: 0 !important;
            padding-bottom: 0 !important;
          }
          /* BlockNote の見出しは inline 扱いで文字幅までしか広がらない。
             サイトと同じく親幅いっぱいに伸ばして border-bottom を揃える */
          .theme-doc-markdown .bn-editor h1,
          .theme-doc-markdown .bn-editor h2,
          .theme-doc-markdown .bn-editor h3,
          .theme-doc-markdown .bn-editor h4 {
            display: block !important;
            width: 100% !important;
          }
          ${boostImportant(customCss)}
        ` }} />
      )}
      <div className="theme-doc-markdown" style={{ flex: 1, overflow: 'auto' }}>
        <BlockNoteView editor={editor} onChange={handleChange} />
      </div>
    </div>
  );
}
