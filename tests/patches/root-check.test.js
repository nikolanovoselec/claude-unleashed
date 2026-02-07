import { describe, it, expect } from 'vitest';
import patch from '../../lib/patches/root-check.patch.js';

describe('root-check patch', () => {
  it('replaces process.getuid()===0', () => {
    expect(patch.apply('process.getuid()===0')).toBe('false');
  });

  it('replaces process.getuid?.()===0', () => {
    expect(patch.apply('process.getuid?.()===0')).toBe('false');
  });

  it('replaces x.getuid()===0', () => {
    expect(patch.apply('x.getuid()===0')).toBe('false');
  });

  it('replaces process.geteuid()===0', () => {
    expect(patch.apply('process.geteuid()===0')).toBe('false');
  });

  it('replaces process.geteuid?.()===0', () => {
    expect(patch.apply('process.geteuid?.()===0')).toBe('false');
  });

  it('canApply returns true when any pattern matches', () => {
    expect(patch.canApply('process.getuid()===0')).toBe(true);
  });

  it('canApply returns false for non-matching source', () => {
    expect(patch.canApply('no match')).toBe(false);
  });

  it('is marked as required', () => {
    expect(patch.required).toBe(true);
  });
});
