import os from 'os';
import path from 'path';

export const STATE_FILE = path.join(os.homedir(), '.claude_yolo_state');
export const CONSENT_FLAG_PATH = path.join(os.homedir(), '.claude_unleashed_consent');
export const CONSENT_FLAG_NAME = '.claude-yolo-consent'; // Legacy location (in node_modules)
export const UPSTREAM_PACKAGE = '@anthropic-ai/claude-code';
export const CONFIG_PATH = path.join(os.homedir(), '.claude_unleashed_config');
