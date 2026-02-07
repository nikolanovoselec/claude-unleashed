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

    expect(execSync).toHaveBeenCalledWith('npm install --no-update-notifier', expect.anything());
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  it('uses --tag stable when channel is stable', async () => {
    vi.mocked(execSync).mockReturnValue(Buffer.from('2.0.50\n'));
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
      dependencies: { '@anthropic-ai/claude-code': '2.0.50' }
    }));

    const { checkForUpdates } = await import('../lib/updater.js');
    await checkForUpdates({ packageJsonPath: '/fake/package.json', nodeModulesDir: '/fake', silent: true, channel: 'stable' });

    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining('--tag stable'),
      expect.anything()
    );
  });

  it('npm view pipes all stdio to suppress stderr leaks', async () => {
    vi.mocked(execSync).mockReturnValue(Buffer.from('2.0.50\n'));
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
      dependencies: { '@anthropic-ai/claude-code': '2.0.50' }
    }));

    const { checkForUpdates } = await import('../lib/updater.js');
    await checkForUpdates({ packageJsonPath: '/fake/package.json', nodeModulesDir: '/fake', silent: true });

    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining('npm view'),
      expect.objectContaining({ stdio: ['pipe', 'pipe', 'pipe'] })
    );
  });

  it('npm install includes --no-update-notifier flag', async () => {
    vi.mocked(execSync).mockReturnValue(Buffer.from('2.0.99\n'));
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
      dependencies: { '@anthropic-ai/claude-code': '2.0.50' }
    }));
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});
    vi.mocked(fs.renameSync).mockImplementation(() => {});

    const { checkForUpdates } = await import('../lib/updater.js');
    await checkForUpdates({ packageJsonPath: '/fake/package.json', nodeModulesDir: '/fake', silent: true });

    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining('npm install --no-update-notifier'),
      expect.anything()
    );
  });

  it('uses --tag latest when channel is not specified', async () => {
    vi.mocked(execSync).mockReturnValue(Buffer.from('2.0.50\n'));
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
      dependencies: { '@anthropic-ai/claude-code': '2.0.50' }
    }));

    const { checkForUpdates } = await import('../lib/updater.js');
    await checkForUpdates({ packageJsonPath: '/fake/package.json', nodeModulesDir: '/fake', silent: true });

    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining('--tag latest'),
      expect.anything()
    );
  });

  it('installs pinned version when pinnedVersion is set', async () => {
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
      dependencies: { '@anthropic-ai/claude-code': '2.0.50' }
    }));
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});
    vi.mocked(fs.renameSync).mockImplementation(() => {});
    vi.mocked(execSync).mockReturnValue(Buffer.from(''));

    const { checkForUpdates } = await import('../lib/updater.js');
    await checkForUpdates({ packageJsonPath: '/fake/package.json', nodeModulesDir: '/fake', silent: true, pinnedVersion: '2.1.25' });

    // Should write the pinned version to package.json
    const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0];
    const written = JSON.parse(writeCall[1]);
    expect(written.dependencies['@anthropic-ai/claude-code']).toBe('2.1.25');
  });

  it('skips npm view when pinnedVersion is set', async () => {
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
      dependencies: { '@anthropic-ai/claude-code': '2.0.50' }
    }));
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});
    vi.mocked(fs.renameSync).mockImplementation(() => {});
    vi.mocked(execSync).mockReturnValue(Buffer.from(''));

    const { checkForUpdates } = await import('../lib/updater.js');
    await checkForUpdates({ packageJsonPath: '/fake/package.json', nodeModulesDir: '/fake', silent: true, pinnedVersion: '2.1.25' });

    // execSync should NOT have been called with npm view
    const execCalls = vi.mocked(execSync).mock.calls.map(c => c[0]);
    expect(execCalls.some(c => c.includes('npm view'))).toBe(false);
  });

  it('rejects invalid pinned version format', async () => {
    const { checkForUpdates } = await import('../lib/updater.js');
    await expect(checkForUpdates({
      packageJsonPath: '/fake/package.json',
      nodeModulesDir: '/fake',
      silent: true,
      pinnedVersion: 'not-a-version'
    })).rejects.toThrow(/Invalid pinned version/);
  });
});
