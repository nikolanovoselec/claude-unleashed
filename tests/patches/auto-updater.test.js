import { describe, it, expect } from 'vitest';
import patch from '../../lib/patches/auto-updater.patch.js';

// Simulated minified source matching the real CLI pattern
const MOCK_SOURCE = [
  'function Oc(){return WP1()!==null}',
  'function WP1(){',
  'if(_6(process.env.DISABLE_AUTOUPDATER))return"DISABLE_AUTOUPDATER set";',
  'if(process.env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC)return"CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC set";',
  'let A=M6();',
  'if(A.autoUpdates===!1&&(A.installMethod!=="native"||A.autoUpdatesProtectedForNative!==!0))return"config";',
  'return null}',
].join('');

describe('auto-updater patch', () => {
  it('is marked as non-required', () => {
    expect(patch.required).toBe(false);
  });

  it('canApply returns true for matching source', () => {
    expect(patch.canApply(MOCK_SOURCE)).toBe(true);
  });

  it('canApply returns false for non-matching source', () => {
    expect(patch.canApply('no match here')).toBe(false);
  });

  it('injects DISABLE_INSTALLATION_CHECKS check before DISABLE_AUTOUPDATER', () => {
    const result = patch.apply(MOCK_SOURCE);
    expect(result).toContain('process.env.DISABLE_INSTALLATION_CHECKS))return"DISABLE_INSTALLATION_CHECKS set"');
  });

  it('preserves the original DISABLE_AUTOUPDATER check', () => {
    const result = patch.apply(MOCK_SOURCE);
    expect(result).toContain('process.env.DISABLE_AUTOUPDATER))return"DISABLE_AUTOUPDATER set"');
  });

  it('places DISABLE_INSTALLATION_CHECKS before DISABLE_AUTOUPDATER', () => {
    const result = patch.apply(MOCK_SOURCE);
    const installIdx = result.indexOf('DISABLE_INSTALLATION_CHECKS');
    const autoIdx = result.indexOf('DISABLE_AUTOUPDATER');
    expect(installIdx).toBeLessThan(autoIdx);
  });

  it('preserves surrounding code unchanged', () => {
    const result = patch.apply(MOCK_SOURCE);
    // The Oc function should be untouched
    expect(result).toContain('function Oc(){return WP1()!==null}');
    // The rest of WP1 should be preserved
    expect(result).toContain('CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC');
    expect(result).toContain('return null}');
  });

  it('verify returns true when patch changes source', () => {
    const result = patch.apply(MOCK_SOURCE);
    expect(patch.verify(MOCK_SOURCE, result)).toBe(true);
  });

  it('works with different minified function names', () => {
    // Function names change between versions, but the string literals don't
    const altSource = 'function Xz(){if(_6(process.env.DISABLE_AUTOUPDATER))return"DISABLE_AUTOUPDATER set";return null}';
    expect(patch.canApply(altSource)).toBe(true);
    const result = patch.apply(altSource);
    expect(result).toContain('DISABLE_INSTALLATION_CHECKS');
    expect(result).toContain('DISABLE_AUTOUPDATER');
  });
});
