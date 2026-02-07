import { vi, describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';

vi.mock('fs');

describe('mode', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.mocked(fs.readFileSync).mockReset();
    vi.mocked(fs.writeFileSync).mockReset();
  });

  it('getMode returns file content trimmed', async () => {
    vi.mocked(fs.readFileSync).mockReturnValue('SAFE\n');
    const { getMode } = await import('../lib/mode.js');
    expect(getMode()).toBe('SAFE');
  });

  it('getMode returns YOLO when file is missing', async () => {
    vi.mocked(fs.readFileSync).mockImplementation(() => { throw new Error('ENOENT'); });
    const { getMode } = await import('../lib/mode.js');
    expect(getMode()).toBe('YOLO');
  });

  it('setMode writes to STATE_FILE', async () => {
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});
    const { setMode } = await import('../lib/mode.js');
    setMode('SAFE');
    expect(fs.writeFileSync).toHaveBeenCalledWith(expect.stringContaining('.claude_yolo_state'), 'SAFE');
  });
});
