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
});
