import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';

vi.mock('fs');

describe('argv', () => {
  let originalArgv;
  let originalEnv;

  beforeEach(() => {
    vi.resetModules();
    originalArgv = [...process.argv];
    originalEnv = { ...process.env };
    // By default, readFileSync throws (simulates missing config file).
    // This preserves behavior for all existing tests that don't mock fs explicitly.
    vi.mocked(fs.readFileSync).mockImplementation(() => {
      const err = new Error('ENOENT: no such file or directory');
      err.code = 'ENOENT';
      throw err;
    });
  });

  afterEach(() => {
    process.argv = originalArgv;
    process.env = originalEnv;
  });

  describe('parseArgs', () => {
    it('detects --silent flag', async () => {
      process.argv = ['node', 'script', '--silent'];
      const { parseArgs } = await import('../lib/argv.js');
      expect(parseArgs().isSilent).toBe(true);
    });

    it('detects --safe flag', async () => {
      process.argv = ['node', 'script', '--safe'];
      const { parseArgs } = await import('../lib/argv.js');
      expect(parseArgs().safeMode).toBe(true);
    });

    it('detects --no-yolo flag', async () => {
      process.argv = ['node', 'script', '--no-yolo'];
      const { parseArgs } = await import('../lib/argv.js');
      expect(parseArgs().safeMode).toBe(true);
    });

    it('detects --no-consent flag', async () => {
      process.argv = ['node', 'script', '--no-consent'];
      const { parseArgs } = await import('../lib/argv.js');
      expect(parseArgs().skipConsent).toBe(true);
    });

    it('detects --no-update flag', async () => {
      process.argv = ['node', 'script', '--no-update'];
      const { parseArgs } = await import('../lib/argv.js');
      expect(parseArgs().noUpdate).toBe(true);
    });

    it('detects CLAUDE_UNLEASHED_SILENT env var', async () => {
      process.argv = ['node', 'script'];
      process.env.CLAUDE_UNLEASHED_SILENT = '1';
      const { parseArgs } = await import('../lib/argv.js');
      expect(parseArgs().isSilent).toBe(true);
    });

    it('detects CLAUDE_UNLEASHED_SKIP_CONSENT env var', async () => {
      process.argv = ['node', 'script'];
      process.env.CLAUDE_UNLEASHED_SKIP_CONSENT = 'true';
      const { parseArgs } = await import('../lib/argv.js');
      expect(parseArgs().skipConsent).toBe(true);
    });

    it('detects CLAUDE_YOLO_SILENT env var (legacy)', async () => {
      process.argv = ['node', 'script'];
      process.env.CLAUDE_YOLO_SILENT = '1';
      const { parseArgs } = await import('../lib/argv.js');
      expect(parseArgs().isSilent).toBe(true);
    });

    it('detects CLAUDE_YOLO_SKIP_CONSENT env var (legacy)', async () => {
      process.argv = ['node', 'script'];
      process.env.CLAUDE_YOLO_SKIP_CONSENT = 'true';
      const { parseArgs } = await import('../lib/argv.js');
      expect(parseArgs().skipConsent).toBe(true);
    });

    it('detects CLAUDE_UNLEASHED_NO_UPDATE env var', async () => {
      process.argv = ['node', 'script'];
      process.env.CLAUDE_UNLEASHED_NO_UPDATE = '1';
      const { parseArgs } = await import('../lib/argv.js');
      expect(parseArgs().noUpdate).toBe(true);
    });

    it('detects --stable flag and sets channel to stable', async () => {
      process.argv = ['node', 'script', '--stable'];
      const { parseArgs } = await import('../lib/argv.js');
      expect(parseArgs().channel).toBe('stable');
    });

    it('detects CLAUDE_UNLEASHED_CHANNEL env var', async () => {
      process.argv = ['node', 'script'];
      process.env.CLAUDE_UNLEASHED_CHANNEL = 'stable';
      const { parseArgs } = await import('../lib/argv.js');
      expect(parseArgs().channel).toBe('stable');
    });

    it('defaults channel to latest when nothing is set', async () => {
      process.argv = ['node', 'script'];
      delete process.env.CLAUDE_UNLEASHED_CHANNEL;
      const { parseArgs } = await import('../lib/argv.js');
      expect(parseArgs().channel).toBe('latest');
    });

    it('detects --disable-installation-checks flag', async () => {
      process.argv = ['node', 'script', '--disable-installation-checks'];
      const { parseArgs } = await import('../lib/argv.js');
      expect(parseArgs().disableInstallChecks).toBe(true);
    });

    it('detects DISABLE_INSTALLATION_CHECKS env var', async () => {
      process.argv = ['node', 'script'];
      process.env.DISABLE_INSTALLATION_CHECKS = '1';
      const { parseArgs } = await import('../lib/argv.js');
      expect(parseArgs().disableInstallChecks).toBe(true);
    });

    it('disableInstallChecks is false when neither flag nor env var set', async () => {
      process.argv = ['node', 'script'];
      delete process.env.DISABLE_INSTALLATION_CHECKS;
      const { parseArgs } = await import('../lib/argv.js');
      expect(parseArgs().disableInstallChecks).toBe(false);
    });

    it('detects --pin-version flag', async () => {
      process.argv = ['node', 'script', '--pin-version=2.1.25'];
      const { parseArgs } = await import('../lib/argv.js');
      expect(parseArgs().pinnedVersion).toBe('2.1.25');
    });

    it('detects CLAUDE_UNLEASHED_VERSION env var', async () => {
      process.argv = ['node', 'script'];
      process.env.CLAUDE_UNLEASHED_VERSION = '2.0.50';
      const { parseArgs } = await import('../lib/argv.js');
      expect(parseArgs().pinnedVersion).toBe('2.0.50');
    });

    it('--pin-version flag takes priority over env var', async () => {
      process.argv = ['node', 'script', '--pin-version=2.1.25'];
      process.env.CLAUDE_UNLEASHED_VERSION = '2.0.50';
      const { parseArgs } = await import('../lib/argv.js');
      expect(parseArgs().pinnedVersion).toBe('2.1.25');
    });

    it('pinnedVersion is null when neither flag nor env var set', async () => {
      process.argv = ['node', 'script'];
      delete process.env.CLAUDE_UNLEASHED_VERSION;
      const { parseArgs } = await import('../lib/argv.js');
      expect(parseArgs().pinnedVersion).toBeNull();
    });
  });

  describe('readConfigChannel (via parseArgs)', () => {
    it('reads channel from config file', async () => {
      process.argv = ['node', 'script'];
      delete process.env.CLAUDE_UNLEASHED_CHANNEL;
      vi.mocked(fs.readFileSync).mockReturnValue('channel=stable\n');
      const { parseArgs } = await import('../lib/argv.js');
      expect(parseArgs().channel).toBe('stable');
    });

    it('returns latest for empty config file', async () => {
      process.argv = ['node', 'script'];
      delete process.env.CLAUDE_UNLEASHED_CHANNEL;
      vi.mocked(fs.readFileSync).mockReturnValue('');
      const { parseArgs } = await import('../lib/argv.js');
      expect(parseArgs().channel).toBe('latest');
    });

    it('returns latest for malformed config (no channel= line)', async () => {
      process.argv = ['node', 'script'];
      delete process.env.CLAUDE_UNLEASHED_CHANNEL;
      vi.mocked(fs.readFileSync).mockReturnValue('some_other_setting=value\n');
      const { parseArgs } = await import('../lib/argv.js');
      expect(parseArgs().channel).toBe('latest');
    });

    it('handles missing config file (ENOENT)', async () => {
      process.argv = ['node', 'script'];
      delete process.env.CLAUDE_UNLEASHED_CHANNEL;
      // Default mock already throws ENOENT
      const { parseArgs } = await import('../lib/argv.js');
      expect(parseArgs().channel).toBe('latest');
    });

    it('trims whitespace from channel value', async () => {
      process.argv = ['node', 'script'];
      delete process.env.CLAUDE_UNLEASHED_CHANNEL;
      vi.mocked(fs.readFileSync).mockReturnValue('channel= stable \n');
      const { parseArgs } = await import('../lib/argv.js');
      expect(parseArgs().channel).toBe('stable');
    });
  });

  describe('prepareUnleashedArgv', () => {
    it('adds --dangerously-skip-permissions', async () => {
      process.argv = ['node', 'script'];
      const { prepareUnleashedArgv } = await import('../lib/argv.js');
      prepareUnleashedArgv();
      expect(process.argv).toContain('--dangerously-skip-permissions');
    });

    it('strips custom flags', async () => {
      process.argv = ['node', 'script', '--silent', '--safe', '--no-yolo', '--no-consent', '--no-update', '--stable', '--disable-installation-checks'];
      const { prepareUnleashedArgv } = await import('../lib/argv.js');
      prepareUnleashedArgv();
      expect(process.argv).not.toContain('--silent');
      expect(process.argv).not.toContain('--safe');
      expect(process.argv).not.toContain('--no-yolo');
      expect(process.argv).not.toContain('--no-consent');
      expect(process.argv).not.toContain('--no-update');
      expect(process.argv).not.toContain('--stable');
      expect(process.argv).not.toContain('--disable-installation-checks');
    });

    it('strips --pin-version flag', async () => {
      process.argv = ['node', 'script', '--pin-version=2.1.25'];
      const { prepareUnleashedArgv } = await import('../lib/argv.js');
      prepareUnleashedArgv();
      expect(process.argv).not.toContain('--pin-version=2.1.25');
      expect(process.argv.some(a => a.startsWith('--pin-version'))).toBe(false);
    });

    it('does not duplicate --dangerously-skip-permissions', async () => {
      process.argv = ['node', 'script', '--dangerously-skip-permissions'];
      const { prepareUnleashedArgv } = await import('../lib/argv.js');
      prepareUnleashedArgv();
      const count = process.argv.filter(a => a === '--dangerously-skip-permissions').length;
      expect(count).toBe(1);
    });
  });

  describe('prepareSafeArgv', () => {
    it('strips custom flags without adding --dangerously-skip-permissions', async () => {
      process.argv = ['node', 'script', '--silent', '--safe'];
      const { prepareSafeArgv } = await import('../lib/argv.js');
      prepareSafeArgv();
      expect(process.argv).not.toContain('--silent');
      expect(process.argv).not.toContain('--safe');
      expect(process.argv).not.toContain('--dangerously-skip-permissions');
    });

    it('strips --stable flag', async () => {
      process.argv = ['node', 'script', '--stable'];
      const { prepareSafeArgv } = await import('../lib/argv.js');
      prepareSafeArgv();
      expect(process.argv).not.toContain('--stable');
    });
  });
});
