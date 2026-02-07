import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { parseArgs, prepareYoloArgv, prepareSafeArgv } from '../lib/argv.js';

describe('argv', () => {
  let originalArgv;
  let originalEnv;

  beforeEach(() => {
    originalArgv = [...process.argv];
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.argv = originalArgv;
    process.env = originalEnv;
  });

  describe('parseArgs', () => {
    it('detects --silent flag', () => {
      process.argv = ['node', 'script', '--silent'];
      expect(parseArgs().isSilent).toBe(true);
    });

    it('detects --safe flag', () => {
      process.argv = ['node', 'script', '--safe'];
      expect(parseArgs().safeMode).toBe(true);
    });

    it('detects --no-yolo flag', () => {
      process.argv = ['node', 'script', '--no-yolo'];
      expect(parseArgs().safeMode).toBe(true);
    });

    it('detects --no-consent flag', () => {
      process.argv = ['node', 'script', '--no-consent'];
      expect(parseArgs().skipConsent).toBe(true);
    });

    it('detects --no-update flag', () => {
      process.argv = ['node', 'script', '--no-update'];
      expect(parseArgs().noUpdate).toBe(true);
    });

    it('detects CLAUDE_YOLO_SILENT env var', () => {
      process.argv = ['node', 'script'];
      process.env.CLAUDE_YOLO_SILENT = '1';
      expect(parseArgs().isSilent).toBe(true);
    });

    it('detects CLAUDE_YOLO_SKIP_CONSENT env var', () => {
      process.argv = ['node', 'script'];
      process.env.CLAUDE_YOLO_SKIP_CONSENT = 'true';
      expect(parseArgs().skipConsent).toBe(true);
    });

    it('detects CLAUDE_UNLEASHED_NO_UPDATE env var', () => {
      process.argv = ['node', 'script'];
      process.env.CLAUDE_UNLEASHED_NO_UPDATE = '1';
      expect(parseArgs().noUpdate).toBe(true);
    });
  });

  describe('prepareYoloArgv', () => {
    it('adds --dangerously-skip-permissions', () => {
      process.argv = ['node', 'script'];
      prepareYoloArgv();
      expect(process.argv).toContain('--dangerously-skip-permissions');
    });

    it('strips custom flags', () => {
      process.argv = ['node', 'script', '--silent', '--safe', '--no-yolo', '--no-consent', '--no-update'];
      prepareYoloArgv();
      expect(process.argv).not.toContain('--silent');
      expect(process.argv).not.toContain('--safe');
      expect(process.argv).not.toContain('--no-yolo');
      expect(process.argv).not.toContain('--no-consent');
      expect(process.argv).not.toContain('--no-update');
    });

    it('does not duplicate --dangerously-skip-permissions', () => {
      process.argv = ['node', 'script', '--dangerously-skip-permissions'];
      prepareYoloArgv();
      const count = process.argv.filter(a => a === '--dangerously-skip-permissions').length;
      expect(count).toBe(1);
    });
  });

  describe('prepareSafeArgv', () => {
    it('strips custom flags without adding --dangerously-skip-permissions', () => {
      process.argv = ['node', 'script', '--silent', '--safe'];
      prepareSafeArgv();
      expect(process.argv).not.toContain('--silent');
      expect(process.argv).not.toContain('--safe');
      expect(process.argv).not.toContain('--dangerously-skip-permissions');
    });
  });
});
