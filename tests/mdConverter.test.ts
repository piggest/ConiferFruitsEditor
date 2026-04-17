import { describe, it, expect } from 'vitest';
import { normalizeMd, splitFrontmatter, decodeLinkUris } from '../src/mdConverter';

describe('normalizeMd', () => {
  it('strips CRLF to LF', () => {
    expect(normalizeMd('a\r\nb\r\n')).toBe('a\nb\n');
  });
  it('ensures trailing newline', () => {
    expect(normalizeMd('a\nb')).toBe('a\nb\n');
  });
  it('collapses duplicate trailing newlines to one', () => {
    expect(normalizeMd('a\n\n\n')).toBe('a\n');
  });
});

describe('splitFrontmatter', () => {
  it('splits frontmatter and body', () => {
    const input = '---\nslug: /\nsidebar_position: 1\n---\n\n# Hello\n';
    expect(splitFrontmatter(input)).toEqual({
      frontmatter: '---\nslug: /\nsidebar_position: 1\n---\n',
      body: '\n# Hello\n',
    });
  });

  it('returns empty frontmatter when none present', () => {
    expect(splitFrontmatter('# Hello\n')).toEqual({ frontmatter: '', body: '# Hello\n' });
  });

  it('handles CRLF frontmatter delimiters', () => {
    const input = '---\r\nslug: /\r\n---\r\n# Hi\r\n';
    expect(splitFrontmatter(input).frontmatter).toContain('slug: /');
  });
});

describe('decodeLinkUris', () => {
  it('decodes percent-encoded relative links', () => {
    const md = '- [インストール](./%E3%82%A4%E3%83%B3%E3%82%B9%E3%83%88%E3%83%BC%E3%83%AB.md)';
    expect(decodeLinkUris(md)).toBe('- [インストール](./インストール.md)');
  });

  it('preserves absolute URLs untouched', () => {
    const md = '[GitHub](https://github.com/%C3%A9)';
    expect(decodeLinkUris(md)).toBe('[GitHub](https://github.com/%C3%A9)');
  });

  it('preserves link titles', () => {
    const md = '[x](./%E4%B8%80 "title")';
    expect(decodeLinkUris(md)).toBe('[x](./一 "title")');
  });
});
