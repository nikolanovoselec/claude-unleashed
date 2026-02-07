import fs from 'fs';
import { STATE_FILE } from './constants.js';

export function getMode() {
  try {
    return fs.readFileSync(STATE_FILE, 'utf8').trim();
  } catch {
    return 'YOLO'; // Default mode
  }
}

export function setMode(mode) {
  fs.writeFileSync(STATE_FILE, mode);
}
