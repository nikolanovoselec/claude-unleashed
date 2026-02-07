import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import readline from 'readline';

vi.mock('readline');

describe('consent', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockReadline = (answer) => {
    const mockRl = {
      question: vi.fn((prompt, cb) => cb(answer)),
      close: vi.fn(),
    };
    vi.mocked(readline.createInterface).mockReturnValue(mockRl);
    return mockRl;
  };

  it('returns true for "yes"', async () => {
    mockReadline('yes');
    const { askForConsent } = await import('../lib/consent.js');
    expect(await askForConsent()).toBe(true);
  });

  it('returns true for "y"', async () => {
    mockReadline('y');
    const { askForConsent } = await import('../lib/consent.js');
    expect(await askForConsent()).toBe(true);
  });

  it('returns false for "no"', async () => {
    mockReadline('no');
    const { askForConsent } = await import('../lib/consent.js');
    expect(await askForConsent()).toBe(false);
  });

  it('returns false for "n"', async () => {
    mockReadline('n');
    const { askForConsent } = await import('../lib/consent.js');
    expect(await askForConsent()).toBe(false);
  });

  it('is case-insensitive', async () => {
    mockReadline('YES');
    const { askForConsent } = await import('../lib/consent.js');
    expect(await askForConsent()).toBe(true);
  });

  it('trims whitespace', async () => {
    mockReadline('  yes  ');
    const { askForConsent } = await import('../lib/consent.js');
    expect(await askForConsent()).toBe(true);
  });
});
