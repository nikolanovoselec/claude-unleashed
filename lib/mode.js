import fs from 'fs';
import { STATE_FILE } from './constants.js';

const VALID_MODES = ['YOLO', 'SAFE'];

export function getMode() {
  try {
    return fs.readFileSync(STATE_FILE, 'utf8').trim();
  } catch {
    return 'YOLO'; // Default mode
  }
}

export function setMode(mode) {
  if (!VALID_MODES.includes(mode)) {
    throw new Error(`Invalid mode: ${mode}. Must be one of: ${VALID_MODES.join(', ')}`);
  }
  fs.writeFileSync(STATE_FILE, mode);
}
