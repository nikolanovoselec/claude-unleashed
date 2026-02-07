import { describe, it, expect } from 'vitest';
import patch from '../../lib/patches/internet-access.patch.js';

describe('internet-access patch', () => {
  it('canApply returns true for matching source', () => {
    expect(patch.canApply('y.hasInternetAccess()')).toBe(true);
  });

  it('canApply returns false for non-matching source', () => {
    expect(patch.canApply('no match here')).toBe(false);
  });

  it('replaces hasInternetAccess() with false', () => {
    const result = patch.apply('if(y.hasInternetAccess()){}');
    expect(result).toBe('if(false){}');
  });

  it('handles multiple occurrences', () => {
    const result = patch.apply('y.hasInternetAccess();z.hasInternetAccess()');
    expect(result).toBe('false;false');
  });

  it('is marked as required', () => {
    expect(patch.required).toBe(true);
  });
});
