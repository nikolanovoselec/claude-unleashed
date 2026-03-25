import { describe, it, expect } from 'vitest';
import patch from '../../lib/patches/is-docker.patch.js';

describe('is-docker patch', () => {
  // Old pattern: inline function calls
  it('canApply returns true for call pattern', () => {
    expect(patch.canApply('x3.getIsDocker()')).toBe(true);
  });

  it('replaces getIsDocker() call with true', () => {
    expect(patch.apply('if(x3.getIsDocker()){}')).toBe('if(true){}');
  });

  it('handles multiple call occurrences', () => {
    expect(patch.apply('x3.getIsDocker();y.getIsDocker()')).toBe('true;true');
  });

  it('handles various call prefixes', () => {
    expect(patch.apply('abc123.getIsDocker()')).toBe('true');
  });

  // New pattern: property assignment in object literal
  it('canApply returns true for property assignment', () => {
    expect(patch.canApply('getIsDocker:jG9,getIsBubblewrapSandbox:MG9')).toBe(true);
  });

  it('replaces property assignment with arrow returning true', () => {
    const result = patch.apply('{getIsDocker:jG9,other:x}');
    expect(result).toBe('{getIsDocker:()=>true,other:x}');
  });

  // Robustness: $-prefixed minified identifiers
  it('handles $-prefixed identifiers in property values', () => {
    const result = patch.apply('{getIsDocker:$xuK,other:y}');
    expect(result).toBe('{getIsDocker:()=>true,other:y}');
  });

  it('handles $-prefixed identifiers in call receivers', () => {
    expect(patch.apply('if($env.getIsDocker()){}')).toBe('if(true){}');
  });

  // Robustness: arrow function values
  it('handles arrow function property values', () => {
    const result = patch.apply('{getIsDocker:()=>detectDocker(),other:x}');
    expect(result).toBe('{getIsDocker:()=>true,other:x}');
  });

  // Robustness: property at end of object (before })
  it('handles property as last in object literal', () => {
    const result = patch.apply('{other:x,getIsDocker:xuK}');
    expect(result).toBe('{other:x,getIsDocker:()=>true}');
  });

  // Common
  it('canApply returns false for non-matching source', () => {
    expect(patch.canApply('no match here')).toBe(false);
  });

  it('is marked as required', () => {
    expect(patch.required).toBe(true);
  });
});
