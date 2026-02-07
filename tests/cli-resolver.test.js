import { vi, describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';

vi.mock('fs');

describe('cli-resolver', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.mocked(fs.existsSync).mockReset();
    vi.mocked(fs.copyFileSync).mockReset();
  });

  it('finds .js CLI path', async () => {
    vi.mocked(fs.existsSync).mockImplementation((p) => {
      if (typeof p === 'string' && p.endsWith('cli.js')) return true;
      if (typeof p === 'string' && p.endsWith('node_modules')) return true;
      return false;
    });
    const { resolveCliPaths } = await import('../lib/cli-resolver.js');
    const result = resolveCliPaths();
    expect(result.originalCliPath).toMatch(/cli\.js$/);
  });

  it('finds .mjs CLI path when .js missing', async () => {
    vi.mocked(fs.existsSync).mockImplementation((p) => {
      if (typeof p === 'string' && p.endsWith('cli.js')) return false;
      if (typeof p === 'string' && p.endsWith('cli.mjs')) return true;
      if (typeof p === 'string' && p.endsWith('node_modules')) return true;
      return false;
    });
    const { resolveCliPaths } = await import('../lib/cli-resolver.js');
    const result = resolveCliPaths();
    expect(result.originalCliPath).toMatch(/cli\.mjs$/);
  });

  it('throws FatalError when neither .js nor .mjs exists', async () => {
    vi.mocked(fs.existsSync).mockImplementation((p) => {
      if (typeof p === 'string' && p.endsWith('cli.js')) return false;
      if (typeof p === 'string' && p.endsWith('cli.mjs')) return false;
      if (typeof p === 'string' && p.endsWith('node_modules')) return true;
      return false;
    });
    const { resolveCliPaths } = await import('../lib/cli-resolver.js');
    expect(() => resolveCliPaths()).toThrow(/Claude CLI not found/);
  });

  it('migrates consent from old to new location', async () => {
    const copyCalls = [];
    vi.mocked(fs.existsSync).mockImplementation((p) => {
      if (typeof p === 'string' && p.endsWith('cli.js')) return true;
      if (typeof p === 'string' && p.endsWith('node_modules')) return true;
      if (typeof p === 'string' && p.includes('.claude_unleashed_consent')) return false;
      if (typeof p === 'string' && p.includes('.claude-yolo-consent')) return true;
      return false;
    });
    vi.mocked(fs.copyFileSync).mockImplementation((src, dst) => { copyCalls.push({ src, dst }); });
    const { resolveCliPaths } = await import('../lib/cli-resolver.js');
    resolveCliPaths();
    expect(copyCalls.length).toBeGreaterThan(0);
  });

  it('skips consent migration when new location already exists', async () => {
    vi.mocked(fs.existsSync).mockImplementation((p) => {
      if (typeof p === 'string' && p.endsWith('cli.js')) return true;
      if (typeof p === 'string' && p.endsWith('node_modules')) return true;
      if (typeof p === 'string' && p.includes('.claude_unleashed_consent')) return true;
      return false;
    });
    vi.mocked(fs.copyFileSync).mockImplementation(() => {});
    const { resolveCliPaths } = await import('../lib/cli-resolver.js');
    resolveCliPaths();
    expect(fs.copyFileSync).not.toHaveBeenCalled();
  });
});
