import os from 'os';
import { STATE_FILE, CONSENT_FLAG_PATH, CONSENT_FLAG_NAME, UPSTREAM_PACKAGE } from '../lib/constants.js';

describe('constants', () => {
  it('STATE_FILE contains home directory', () => {
    expect(STATE_FILE).toContain(os.homedir());
  });

  it('CONSENT_FLAG_PATH contains home directory', () => {
    expect(CONSENT_FLAG_PATH).toContain(os.homedir());
  });

  it('CONSENT_FLAG_NAME is the legacy location name', () => {
    expect(CONSENT_FLAG_NAME).toBe('.claude-yolo-consent');
  });

  it('UPSTREAM_PACKAGE is @anthropic-ai/claude-code', () => {
    expect(UPSTREAM_PACKAGE).toBe('@anthropic-ai/claude-code');
  });
});
