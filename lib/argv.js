import fs from 'fs';
import debug from './debug.js';
import { CONFIG_PATH } from './constants.js';

function readConfigChannel() {
  try {
    const content = fs.readFileSync(CONFIG_PATH, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('channel=')) {
        return trimmed.slice('channel='.length).trim() || null;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function parseArgs() {
  const isSilent = process.env.CLAUDE_YOLO_SILENT === '1' ||
                   process.env.CLAUDE_YOLO_SILENT === 'true' ||
                   process.argv.includes('--silent');

  const skipConsent = process.env.CLAUDE_YOLO_SKIP_CONSENT === '1' ||
                      process.env.CLAUDE_YOLO_SKIP_CONSENT === 'true' ||
                      process.argv.includes('--no-consent');

  const safeMode = process.argv.includes('--safe') ||
                   process.argv.includes('--no-yolo');

  const noUpdate = process.env.CLAUDE_UNLEASHED_NO_UPDATE === '1' ||
                   process.env.CLAUDE_UNLEASHED_NO_UPDATE === 'true' ||
                   process.argv.includes('--no-update');

  // Priority: CLI flag > env var > config file > default
  const channel = process.argv.includes('--stable') ? 'stable'
    : (process.env.CLAUDE_UNLEASHED_CHANNEL || readConfigChannel() || 'latest');

  return { isSilent, skipConsent, safeMode, noUpdate, channel };
}

export function prepareYoloArgv() {
  if (!process.argv.includes('--dangerously-skip-permissions')) {
    process.argv.push('--dangerously-skip-permissions');
    debug("Added --dangerously-skip-permissions flag for YOLO mode");
  }

  process.argv = process.argv.filter(arg =>
    arg !== '--safe' && arg !== '--no-yolo' && arg !== '--no-consent' &&
    arg !== '--silent' && arg !== '--no-update' && arg !== '--stable'
  );
}

export function prepareSafeArgv() {
  process.argv = process.argv.filter(arg =>
    arg !== '--safe' && arg !== '--no-yolo' && arg !== '--no-consent' &&
    arg !== '--silent' && arg !== '--no-update' && arg !== '--stable'
  );
}
