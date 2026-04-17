import { describe, it, expect } from 'vitest';
import { normalizeMd } from '../src/mdConverter';

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
