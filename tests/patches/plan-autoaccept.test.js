import { describe, it, expect } from 'vitest';
import patch from '../../lib/patches/plan-autoaccept.patch.js';

describe('plan-autoaccept patch', () => {
  it('canApply returns true when isBypassPermissionsModeAvailable is present', () => {
    expect(patch.canApply('some code isBypassPermissionsModeAvailable more code')).toBe(true);
  });

  it('canApply returns true with known anchor', () => {
    expect(patch.canApply('let M=Md(),R=M?oH(M):null')).toBe(true);
  });

  it('canApply returns false for unrelated source', () => {
    expect(patch.canApply('nothing relevant here')).toBe(false);
  });

  it('applies via known pattern strategy', () => {
    const source = 'prefix;let M=Md(),R=M?oH(M):null;suffix';
    const result = patch.apply(source);
    expect(result).toContain('let M=Md(),R=M?oH(M):null');
    expect(result.length).toBeGreaterThan(source.length);
  });

  it('returns unchanged when no strategy matches', () => {
    // Has no isBypassPermissionsModeAvailable and no known anchor
    const source = 'unrelated code without any matching patterns';
    const result = patch.apply(source);
    expect(result).toBe(source);
  });

  it('is marked as optional', () => {
    expect(patch.required).toBe(false);
  });

  describe('semantic patch strategy', () => {
    it('applies semantic patch when isBypassPermissionsModeAvailable and required patterns found', () => {
      // Construct a minimal minified source that contains all patterns trySemanticPatch needs:
      // 1. k5.useEffect( — React alias
      // 2. G.toolPermissionContext — context accessor
      // 3. N("yes-bypass-permissions") — submit function
      // 4. isBypassPermissionsModeAvailable — the anchor
      // 5. KNOWN_ANCHOR for injection point
      const source = [
        'var stuff=true',
        'k5.useEffect(()=>{},[x])',
        'G.toolPermissionContext.isBypassPermissionsModeAvailable',
        'if(cond){N("yes-bypass-permissions")}',
        'let M=Md(),R=M?oH(M):null',
        'more code here',
      ].join(';');

      const result = patch.apply(source);
      // The semantic strategy should inject a useEffect call with the derived aliases
      expect(result).toContain('k5.useEffect(');
      expect(result).toContain('G.toolPermissionContext.isBypassPermissionsModeAvailable');
      expect(result).toContain('N("yes-bypass-permissions")');
      // Should be longer due to injected patch
      expect(result.length).toBeGreaterThan(source.length);
    });

    it('falls back to known anchor when semantic extraction fails but KNOWN_ANCHOR exists', () => {
      // Has isBypassPermissionsModeAvailable (so canApply is true and semantic strategy is attempted)
      // but missing useEffect pattern — so trySemanticPatch returns null.
      // Has KNOWN_ANCHOR — so falls back to known pattern strategy.
      const source = [
        'var isBypassPermissionsModeAvailable=false',
        'let M=Md(),R=M?oH(M):null',
        'suffix',
      ].join(';');

      const result = patch.apply(source);
      // Should have injected the hardcoded KNOWN_PATCH after KNOWN_ANCHOR
      expect(result).toContain('let M=Md(),R=M?oH(M):null;');
      expect(result.length).toBeGreaterThan(source.length);
      // Verify it used the hardcoded patch (contains k5.useEffect from KNOWN_PATCH)
      expect(result).toContain('k5.useEffect(');
    });

    it('returns unchanged source when no strategy matches', () => {
      // Has isBypassPermissionsModeAvailable (canApply returns true)
      // but no useEffect, no toolPermissionContext, no submit fn, and no KNOWN_ANCHOR
      // trySemanticPatch returns null, and known anchor check also fails
      const source = 'function test(){return isBypassPermissionsModeAvailable}';
      const result = patch.apply(source);
      expect(result).toBe(source);
    });
  });
});
