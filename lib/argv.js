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
  const isSilent = process.env.CLAUDE_UNLEASHED_SILENT === '1' ||
                   process.env.CLAUDE_UNLEASHED_SILENT === 'true' ||
                   process.env.CLAUDE_YOLO_SILENT === '1' ||
                   process.env.CLAUDE_YOLO_SILENT === 'true' ||
                   process.argv.includes('--silent');

  const skipConsent = process.env.CLAUDE_UNLEASHED_SKIP_CONSENT === '1' ||
                      process.env.CLAUDE_UNLEASHED_SKIP_CONSENT === 'true' ||
                      process.env.CLAUDE_YOLO_SKIP_CONSENT === '1' ||
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

  const disableInstallChecks = process.argv.includes('--disable-installation-checks') ||
                               process.env.DISABLE_INSTALLATION_CHECKS === '1';

  // Priority: CLI flag > env var > null
  const pinVersionArg = process.argv.find(a => a.startsWith('--pin-version='));
  const pinnedVersion = pinVersionArg
    ? pinVersionArg.split('=')[1]
    : (process.env.CLAUDE_UNLEASHED_VERSION || null);

  return { isSilent, skipConsent, safeMode, noUpdate, channel, pinnedVersion, disableInstallChecks };
}

const CUSTOM_FLAGS = ['--safe', '--no-yolo', '--no-consent', '--silent', '--no-update', '--stable', '--disable-installation-checks'];

function stripCustomFlags() {
  process.argv = process.argv.filter(arg => !CUSTOM_FLAGS.includes(arg) && !arg.startsWith('--pin-version='));
}

export function prepareUnleashedArgv() {
  if (!process.argv.includes('--dangerously-skip-permissions')) {
    process.argv.push('--dangerously-skip-permissions');
    debug("Added --dangerously-skip-permissions flag for Unleashed mode");
  }

  stripCustomFlags();
}

export function prepareSafeArgv() {
  stripCustomFlags();
}
