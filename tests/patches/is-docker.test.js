import { describe, it, expect } from 'vitest';
import patch from '../../lib/patches/is-docker.patch.js';

describe('is-docker patch', () => {
  it('canApply returns true for matching source', () => {
    expect(patch.canApply('x3.getIsDocker()')).toBe(true);
  });

  it('canApply returns false for non-matching source', () => {
    expect(patch.canApply('no match here')).toBe(false);
  });

  it('replaces getIsDocker() with true', () => {
    const result = patch.apply('if(x3.getIsDocker()){}');
    expect(result).toBe('if(true){}');
  });

  it('handles multiple occurrences', () => {
    const result = patch.apply('x3.getIsDocker();y.getIsDocker()');
    expect(result).toBe('true;true');
  });

  it('handles various prefixes', () => {
    const result = patch.apply('abc123.getIsDocker()');
    expect(result).toBe('true');
  });

  it('is marked as required', () => {
    expect(patch.required).toBe(true);
  });
});
