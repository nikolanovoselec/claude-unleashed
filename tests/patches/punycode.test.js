import { describe, it, expect } from 'vitest';
import patch from '../../lib/patches/punycode.patch.js';

describe('punycode patch', () => {
  it('replaces require("punycode") with require("punycode/")', () => {
    expect(patch.apply('require("punycode")')).toBe('require("punycode/")');
  });

  it('replaces from "punycode" with from "punycode/"', () => {
    expect(patch.apply('from "punycode"')).toBe('from "punycode/"');
  });

  it('replaces import "punycode" with import "punycode/"', () => {
    expect(patch.apply('import "punycode"')).toBe('import "punycode/"');
  });

  it('does NOT replace unrelated "punycode" strings', () => {
    const source = 'const name = "punycode"';
    expect(patch.apply(source)).toBe(source);
  });

  it('is marked as optional', () => {
    expect(patch.required).toBe(false);
  });

  it('canApply returns true for matching source', () => {
    expect(patch.canApply('require("punycode")')).toBe(true);
  });

  it('canApply returns false for non-matching source', () => {
    expect(patch.canApply('nothing here')).toBe(false);
  });
});
