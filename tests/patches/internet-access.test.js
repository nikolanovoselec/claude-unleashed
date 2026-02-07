import { describe, it, expect } from 'vitest';
import patch from '../../lib/patches/internet-access.patch.js';

describe('internet-access patch', () => {
  // Old pattern: inline function calls
  it('canApply returns true for call pattern', () => {
    expect(patch.canApply('y.hasInternetAccess()')).toBe(true);
  });

  it('replaces hasInternetAccess() call with false', () => {
    expect(patch.apply('if(y.hasInternetAccess()){}')).toBe('if(false){}');
  });

  it('handles multiple call occurrences', () => {
    expect(patch.apply('y.hasInternetAccess();z.hasInternetAccess()')).toBe('false;false');
  });

  // New pattern: property assignment in object literal
  it('canApply returns true for property assignment', () => {
    expect(patch.canApply('hasInternetAccess:dZq,isCI:P1(!1)')).toBe(true);
  });

  it('replaces property assignment with arrow returning false', () => {
    const result = patch.apply('{hasInternetAccess:dZq,isCI:x}');
    expect(result).toBe('{hasInternetAccess:()=>false,isCI:x}');
  });

  // Common
  it('canApply returns false for non-matching source', () => {
    expect(patch.canApply('no match here')).toBe(false);
  });

  it('is marked as required', () => {
    expect(patch.required).toBe(true);
  });
});
