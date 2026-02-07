import debug from './debug.js';

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

  return { isSilent, skipConsent, safeMode, noUpdate };
}

export function prepareYoloArgv() {
  if (!process.argv.includes('--dangerously-skip-permissions')) {
    process.argv.push('--dangerously-skip-permissions');
    debug("Added --dangerously-skip-permissions flag for YOLO mode");
  }

  process.argv = process.argv.filter(arg =>
    arg !== '--safe' && arg !== '--no-yolo' && arg !== '--no-consent' &&
    arg !== '--silent' && arg !== '--no-update'
  );
}

export function prepareSafeArgv() {
  process.argv = process.argv.filter(arg =>
    arg !== '--safe' && arg !== '--no-yolo' && arg !== '--no-consent' &&
    arg !== '--silent' && arg !== '--no-update'
  );
}
