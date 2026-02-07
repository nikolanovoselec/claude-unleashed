import { vi, describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import crypto from 'crypto';

vi.mock('fs');

describe('patcher', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.mocked(fs.readFileSync).mockReset();
    vi.mocked(fs.writeFileSync).mockReset();
    vi.mocked(fs.renameSync).mockReset();
    vi.mocked(fs.existsSync).mockReset();
  });

  const mockSource = [
    'x3.getIsDocker()',
    'y.hasInternetAccess()',
    'process.getuid()===0',
  ].join(';');

  it('applies patches to source', async () => {
    vi.mocked(fs.readFileSync).mockReturnValue(mockSource);
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});
    vi.mocked(fs.renameSync).mockImplementation(() => {});

    const { applyPatches } = await import('../lib/patcher.js');
    const result = applyPatches({ originalCliPath: '/fake/cli.js', yoloCliPath: '/fake/cli-yolo.js' });

    expect(result.skippedViaCache).toBe(false);
    const okPatches = result.results.filter(r => r.status === 'OK');
    expect(okPatches.length).toBeGreaterThanOrEqual(3);
  });

  it('skips via hash cache', async () => {
    const hash = crypto.createHash('sha256').update(mockSource).digest('hex');
    vi.mocked(fs.readFileSync).mockImplementation((p) => {
      if (typeof p === 'string' && p.endsWith('.hash')) return hash;
      return mockSource;
    });
    vi.mocked(fs.existsSync).mockReturnValue(true);

    const { applyPatches } = await import('../lib/patcher.js');
    const result = applyPatches({ originalCliPath: '/fake/cli.js', yoloCliPath: '/fake/cli-yolo.js' });
    expect(result.skippedViaCache).toBe(true);
  });

  it('writes atomically via .tmp then rename', async () => {
    vi.mocked(fs.readFileSync).mockReturnValue(mockSource);
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const writtenPaths = [];
    vi.mocked(fs.writeFileSync).mockImplementation((p) => { writtenPaths.push(p); });
    vi.mocked(fs.renameSync).mockImplementation(() => {});

    const { applyPatches } = await import('../lib/patcher.js');
    applyPatches({ originalCliPath: '/fake/cli.js', yoloCliPath: '/fake/cli-yolo.js' });

    expect(writtenPaths.some(p => p.endsWith('.tmp'))).toBe(true);
    expect(fs.renameSync).toHaveBeenCalled();
  });

  it('throws FatalError when required patch fails', async () => {
    vi.mocked(fs.readFileSync).mockReturnValue('no matching patterns here');
    vi.mocked(fs.existsSync).mockReturnValue(false);

    const { applyPatches } = await import('../lib/patcher.js');
    expect(() => applyPatches({ originalCliPath: '/fake/cli.js', yoloCliPath: '/fake/cli-yolo.js' }))
      .toThrow(/Required patch/);
  });

  it('gracefully skips optional patches', async () => {
    // Source has required patterns but not optional ones
    const sourceWithRequired = 'x3.getIsDocker();y.hasInternetAccess();process.getuid()===0';
    vi.mocked(fs.readFileSync).mockReturnValue(sourceWithRequired);
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});
    vi.mocked(fs.renameSync).mockImplementation(() => {});

    const { applyPatches } = await import('../lib/patcher.js');
    const result = applyPatches({ originalCliPath: '/fake/cli.js', yoloCliPath: '/fake/cli-yolo.js' });
    const skipped = result.results.filter(r => r.status === 'SKIPPED');
    expect(skipped.length).toBeGreaterThan(0);
  });
});
