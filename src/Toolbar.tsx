import type { BlockNoteEditor } from '@blocknote/core';
import {
  RiArrowGoBackLine, RiArrowGoForwardLine,
  RiParagraph, RiH1, RiH2, RiH3,
  RiDoubleQuotesL, RiCodeBoxLine,
  RiBold, RiItalic, RiUnderline, RiStrikethrough, RiCodeLine,
  RiListUnordered, RiListOrdered, RiCheckboxLine,
  RiLink, RiTable2, RiSeparator,
} from 'react-icons/ri';

type Props = { editor: BlockNoteEditor };

export default function Toolbar({ editor }: Props) {
  // インラインスタイルの切り替え
  const toggleStyle = (style: 'bold' | 'italic' | 'underline' | 'strike' | 'code') => {
    const current = editor.getActiveStyles();
    editor.addStyles({ [style]: !current[style] } as any);
    editor.focus();
  };

  // ブロックタイプの変更
  const setBlock = (type: string, props?: any) => {
    const block = editor.getTextCursorPosition().block;
    editor.updateBlock(block, { type, props } as any);
    editor.focus();
  };

  // カーソル位置の後ろにブロックを挿入
  const insertAfter = (block: any) => {
    const current = editor.getTextCursorPosition().block;
    editor.insertBlocks([block], current, 'after');
    editor.focus();
  };

  // 元に戻す / やり直し（内部APIを使用）
  const undo = () => {
    (editor as any)._tiptapEditor?.commands.undo();
    editor.focus();
  };
  const redo = () => {
    (editor as any)._tiptapEditor?.commands.redo();
    editor.focus();
  };

  // リンク挿入（URLをプロンプトで取得）
  const insertLink = () => {
    const url = prompt('URLを入力');
    if (!url) return;
    editor.insertInlineContent([{ type: 'link', href: url, content: [{ type: 'text', text: url, styles: {} }] }]);
    editor.focus();
  };

  // ボタンの共通スタイル
  const btnStyle: React.CSSProperties = {
    width: 30,
    height: 30,
    padding: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    borderRadius: 4,
    fontSize: 16,
    color: '#333',
  };

  const hoverBg = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = '#e9e9e9';
  };
  const unhoverBg = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = 'transparent';
  };

  // ボタンコンポーネント
  const Btn = ({
    onClick,
    title,
    children,
  }: {
    onClick: () => void;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      style={btnStyle}
      title={title}
      onClick={onClick}
      onMouseEnter={hoverBg}
      onMouseLeave={unhoverBg}
    >
      {children}
    </button>
  );

  // グループ区切り線
  const Divider = () => (
    <span
      style={{
        width: 1,
        height: 20,
        background: '#ddd',
        margin: '0 6px',
        flexShrink: 0,
      }}
    />
  );

  return (
    <div
      style={{
        display: 'flex',
        padding: 6,
        borderBottom: '1px solid #ddd',
        background: '#f7f7f7',
        alignItems: 'center',
        gap: 2,
        flexWrap: 'wrap',
      }}
    >
      {/* Undo / Redo グループ */}
      <Btn title="元に戻す (Cmd+Z)" onClick={undo}>
        <RiArrowGoBackLine />
      </Btn>
      <Btn title="やり直し (Cmd+Shift+Z)" onClick={redo}>
        <RiArrowGoForwardLine />
      </Btn>

      <Divider />

      {/* ブロックタイプ グループ */}
      <Btn title="段落" onClick={() => setBlock('paragraph')}>
        <RiParagraph />
      </Btn>
      <Btn title="見出し1" onClick={() => setBlock('heading', { level: 1 })}>
        <RiH1 />
      </Btn>
      <Btn title="見出し2" onClick={() => setBlock('heading', { level: 2 })}>
        <RiH2 />
      </Btn>
      <Btn title="見出し3" onClick={() => setBlock('heading', { level: 3 })}>
        <RiH3 />
      </Btn>
      <Btn title="引用" onClick={() => setBlock('quote')}>
        <RiDoubleQuotesL />
      </Btn>
      <Btn title="コードブロック" onClick={() => setBlock('codeBlock')}>
        <RiCodeBoxLine />
      </Btn>

      <Divider />

      {/* インラインスタイル グループ */}
      <Btn title="太字 (Cmd+B)" onClick={() => toggleStyle('bold')}>
        <RiBold />
      </Btn>
      <Btn title="斜体 (Cmd+I)" onClick={() => toggleStyle('italic')}>
        <RiItalic />
      </Btn>
      <Btn title="下線 (Cmd+U)" onClick={() => toggleStyle('underline')}>
        <RiUnderline />
      </Btn>
      <Btn title="打ち消し線" onClick={() => toggleStyle('strike')}>
        <RiStrikethrough />
      </Btn>
      <Btn title="インラインコード" onClick={() => toggleStyle('code')}>
        <RiCodeLine />
      </Btn>

      <Divider />

      {/* リスト グループ */}
      <Btn title="箇条書き" onClick={() => setBlock('bulletListItem')}>
        <RiListUnordered />
      </Btn>
      <Btn title="番号付きリスト" onClick={() => setBlock('numberedListItem')}>
        <RiListOrdered />
      </Btn>
      <Btn title="チェックリスト" onClick={() => setBlock('checkListItem')}>
        <RiCheckboxLine />
      </Btn>

      <Divider />

      {/* 挿入 グループ */}
      <Btn title="リンク挿入" onClick={insertLink}>
        <RiLink />
      </Btn>
      <Btn
        title="表挿入"
        onClick={() =>
          insertAfter({
            type: 'table',
            content: {
              type: 'tableContent',
              rows: [
                { cells: ['', '', ''] },
                { cells: ['', '', ''] },
              ],
            },
          })
        }
      >
        <RiTable2 />
      </Btn>
      <Btn title="区切り線" onClick={() => insertAfter({ type: 'divider' })}>
        <RiSeparator />
      </Btn>
    </div>
  );
}
