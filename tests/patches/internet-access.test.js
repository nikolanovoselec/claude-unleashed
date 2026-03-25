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

  // Robustness: $-prefixed minified identifiers
  it('handles $-prefixed identifiers in property values', () => {
    const result = patch.apply('{hasInternetAccess:$PK,isCI:r6(!1)}');
    expect(result).toBe('{hasInternetAccess:()=>false,isCI:r6(!1)}');
  });

  it('handles $-prefixed identifiers in call receivers', () => {
    expect(patch.apply('if($x.hasInternetAccess()){}')).toBe('if(false){}');
  });

  // Robustness: arrow function values
  it('handles arrow function property values', () => {
    const result = patch.apply('{hasInternetAccess:()=>checkNet(),isCI:x}');
    expect(result).toBe('{hasInternetAccess:()=>false,isCI:x}');
  });

  // Robustness: function call values
  it('handles function call property values', () => {
    const result = patch.apply('{hasInternetAccess:doCheck(a,b),isCI:x}');
    expect(result).toBe('{hasInternetAccess:()=>false,isCI:x}');
  });

  // Robustness: chained method receiver
  it('handles chained receiver in method calls', () => {
    expect(patch.apply('a.b.hasInternetAccess()')).toBe('false');
  });

  // Robustness: property at end of object (before })
  it('handles property as last in object literal', () => {
    const result = patch.apply('{isCI:x,hasInternetAccess:$PK}');
    expect(result).toBe('{isCI:x,hasInternetAccess:()=>false}');
  });

  // Common
  it('canApply returns false for non-matching source', () => {
    expect(patch.canApply('no match here')).toBe(false);
  });

  it('is marked as required', () => {
    expect(patch.required).toBe(true);
  });
});
