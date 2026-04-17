export function normalizeMd(input: string): string {
  const lf = input.replace(/\r\n/g, '\n');
  const trimmed = lf.replace(/\n+$/g, '');
  return trimmed + '\n';
}

export function splitFrontmatter(input: string): { frontmatter: string; body: string } {
  // Docusaurus/Jekyll形式のfrontmatter: '---'で始まり、'---'単独行で終わる
  const match = input.match(/^(---\r?\n[\s\S]*?\r?\n---\r?\n?)/);
  if (!match) return { frontmatter: '', body: input };
  return {
    frontmatter: match[1],
    body: input.slice(match[1].length),
  };
}

export function decodeLinkUris(md: string): string {
  // マークダウンリンク [text](url) 内のパーセントエンコードを復元（相対リンクのみ）
  return md.replace(/\[([^\]]*)\]\(([^)\s]+)(\s+"[^"]*")?\)/g, (full, text, url, title) => {
    // 絶対URL（スキームあり）とアンカーリンクはそのまま
    if (/^[a-z][a-z0-9+\-.]*:/i.test(url) || url.startsWith('#')) return full;
    try {
      const decoded = decodeURIComponent(url);
      return `[${text}](${decoded}${title ?? ''})`;
    } catch {
      return full;
    }
  });
}
