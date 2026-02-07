import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';

vi.mock('fs');
vi.mock('../lib/argv.js');
vi.mock('../lib/cli-resolver.js');
vi.mock('../lib/patcher.js');
vi.mock('../lib/updater.js');
vi.mock('../lib/consent.js');
vi.mock('../lib/mode.js');
vi.mock('../lib/debug.js', () => ({ default: vi.fn() }));
vi.mock('../lib/errors.js', () => ({
  FatalError: class FatalError extends Error {
    constructor(msg, opts) { super(msg); this.name = 'FatalError'; this.guidance = opts?.guidance; }
  },
  RecoverableError: class RecoverableError extends Error {
    constructor(msg) { super(msg); this.name = 'RecoverableError'; }
  },
  handleError: vi.fn(),
}));

describe('orchestrator (bin/claude-unleashed.js)', () => {
  let originalArgv;
  let originalEnv;
  let exitSpy;
  let errorSpy;

  beforeEach(() => {
    vi.resetModules();
    originalArgv = [...process.argv];
    originalEnv = { ...process.env };
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.argv = originalArgv;
    process.env = originalEnv;
    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });

  async function setupMocks(overrides = {}) {
    const argv = await import('../lib/argv.js');
    const cliResolver = await import('../lib/cli-resolver.js');
    const patcher = await import('../lib/patcher.js');
    const updater = await import('../lib/updater.js');
    const consent = await import('../lib/consent.js');
    const mode = await import('../lib/mode.js');

    vi.mocked(argv.parseArgs).mockReturnValue({
      isSilent: true,
      skipConsent: true,
      safeMode: false,
      noUpdate: true,
      channel: 'latest',
      pinnedVersion: null,
      disableInstallChecks: false,
      ...overrides,
    });

    vi.mocked(cliResolver.resolveCliPaths).mockReturnValue({
      originalCliPath: '/fake/cli.js',
      patchedCliPath: '/fake/cli-patched.js',
      nodeModulesDir: '/fake',
      packageJsonPath: '/fake/package.json',
      consentFlagPath: '/fake/.consent',
    });

    vi.mocked(patcher.applyPatches).mockReturnValue({ skippedViaCache: false, results: [] });
    vi.mocked(updater.checkForUpdates).mockResolvedValue(undefined);
    vi.mocked(consent.askForConsent).mockResolvedValue(true);
    vi.mocked(mode.getMode).mockReturnValue('YOLO');
    vi.mocked(mode.setMode).mockImplementation(() => {});
    vi.mocked(argv.prepareSafeArgv).mockImplementation(() => {});
    vi.mocked(argv.prepareUnleashedArgv).mockImplementation(() => {});

    return { argv, patcher, mode };
  }

  it('DISABLE_INSTALLATION_CHECKS is set', async () => {
    delete process.env.DISABLE_INSTALLATION_CHECKS;
    process.argv = ['node', 'claude-unleashed'];
    await setupMocks({ isSilent: true, skipConsent: true, noUpdate: true });

    await import('../bin/claude-unleashed.js');
    await new Promise(r => setTimeout(r, 100));

    expect(process.env.DISABLE_INSTALLATION_CHECKS).toBe('1');
  });

  it('mode command displays current mode', async () => {
    process.argv = ['node', 'claude-unleashed', 'mode'];
    const { mode } = await setupMocks();
    vi.mocked(mode.getMode).mockReturnValue('YOLO');

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await import('../bin/claude-unleashed.js');
    await new Promise(r => setTimeout(r, 100));

    const modeOutput = consoleSpy.mock.calls.find(call =>
      typeof call[0] === 'string' && call[0].includes('Current mode')
    );
    expect(modeOutput).toBeDefined();

    consoleSpy.mockRestore();
  });

  it('safe mode skips patching', async () => {
    process.argv = ['node', 'claude-unleashed'];
    const { patcher, argv } = await setupMocks({ safeMode: true, isSilent: true, noUpdate: true });

    // Clear any lingering calls from previous tests' async operations
    vi.mocked(patcher.applyPatches).mockClear();

    await import('../bin/claude-unleashed.js');
    await new Promise(r => setTimeout(r, 150));

    // Verify the safe mode path was taken
    expect(argv.prepareSafeArgv).toHaveBeenCalled();
    // applyPatches should NOT be called in safe mode
    expect(patcher.applyPatches).not.toHaveBeenCalled();
  });
});
