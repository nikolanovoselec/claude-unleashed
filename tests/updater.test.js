import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import { execSync } from 'child_process';

vi.mock('fs');
vi.mock('child_process');

describe('updater', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.mocked(fs.readFileSync).mockReset();
    vi.mocked(fs.writeFileSync).mockReset();
    vi.mocked(fs.renameSync).mockReset();
    vi.mocked(execSync).mockReset();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('updates when version differs', async () => {
    vi.mocked(execSync).mockReturnValue(Buffer.from('2.0.99\n'));
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
      dependencies: { '@anthropic-ai/claude-code': '2.0.50' }
    }));
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});
    vi.mocked(fs.renameSync).mockImplementation(() => {});

    const { checkForUpdates } = await import('../lib/updater.js');
    await checkForUpdates({ packageJsonPath: '/fake/package.json', nodeModulesDir: '/fake', silent: true });

    expect(fs.writeFileSync).toHaveBeenCalled();
    expect(fs.renameSync).toHaveBeenCalled();
  });

  it('skips when version matches', async () => {
    vi.mocked(execSync).mockReturnValue(Buffer.from('2.0.50\n'));
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
      dependencies: { '@anthropic-ai/claude-code': '2.0.50' }
    }));

    const { checkForUpdates } = await import('../lib/updater.js');
    await checkForUpdates({ packageJsonPath: '/fake/package.json', nodeModulesDir: '/fake', silent: true });

    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  it('uses atomic package.json write', async () => {
    vi.mocked(execSync).mockReturnValue(Buffer.from('2.0.99\n'));
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
      dependencies: { '@anthropic-ai/claude-code': '2.0.50' }
    }));
    const writtenPaths = [];
    vi.mocked(fs.writeFileSync).mockImplementation((p) => { writtenPaths.push(String(p)); });
    vi.mocked(fs.renameSync).mockImplementation(() => {});

    const { checkForUpdates } = await import('../lib/updater.js');
    await checkForUpdates({ packageJsonPath: '/fake/package.json', nodeModulesDir: '/fake', silent: true });

    expect(writtenPaths.some(p => p.endsWith('.tmp'))).toBe(true);
    expect(fs.renameSync).toHaveBeenCalled();
  });

  it('surfaces errors to stderr', async () => {
    vi.mocked(execSync).mockImplementation(() => { throw new Error('network error'); });
    vi.mocked(fs.readFileSync).mockReturnValue('{}');

    const { checkForUpdates } = await import('../lib/updater.js');
    await expect(checkForUpdates({ packageJsonPath: '/fake/package.json', nodeModulesDir: '/fake', silent: true }))
      .rejects.toThrow(/Update check failed/);

    expect(process.stderr.write).toHaveBeenCalledWith(expect.stringContaining('network error'));
  });

  it('handles "latest" tag by running npm install', async () => {
    vi.mocked(execSync).mockReturnValue(Buffer.from('2.0.99\n'));
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
      dependencies: { '@anthropic-ai/claude-code': 'latest' }
    }));

    const { checkForUpdates } = await import('../lib/updater.js');
    await checkForUpdates({ packageJsonPath: '/fake/package.json', nodeModulesDir: '/fake', silent: true });

    expect(execSync).toHaveBeenCalledWith('npm install', expect.anything());
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });
});
