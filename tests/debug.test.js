import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('debug', () => {
  let originalDebug;

  beforeEach(() => {
    originalDebug = process.env.DEBUG;
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    if (originalDebug !== undefined) {
      process.env.DEBUG = originalDebug;
    } else {
      delete process.env.DEBUG;
    }
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('logs when DEBUG is set', async () => {
    process.env.DEBUG = '1';
    const { default: debug } = await import('../lib/debug.js');
    debug('test message');
    expect(console.log).toHaveBeenCalledWith('test message');
  });

  it('does not log when DEBUG is unset', async () => {
    delete process.env.DEBUG;
    const { default: debug } = await import('../lib/debug.js');
    debug('test message');
    expect(console.log).not.toHaveBeenCalled();
  });
});
