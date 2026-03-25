/**
 * Runtime preload — injected via NODE_OPTIONS="--require" before the CLI loads.
 *
 * Sets environment variables that the CLI already respects, eliminating the
 * need for fragile source-code patches where possible. This is the primary
 * defense layer; source patches serve as a secondary enhancement.
 */

// Bypass root/sudo check — CLI checks: getuid()===0 && IS_SANDBOX!=="1"
process.env.IS_SANDBOX = '1';

// Bypass auto-updater — CLI checks: DISABLE_INSTALLATION_CHECKS
process.env.DISABLE_INSTALLATION_CHECKS = '1';

// Signal bubblewrap sandbox — CLI uses this for sandbox-mode behavior
process.env.CLAUDE_CODE_BUBBLEWRAP = '1';

// Create /.dockerenv if we have write access (helps native Docker detection
// in environments like Firecracker where the file doesn't exist naturally)
try {
  const fs = require('fs');
  if (!fs.existsSync('/.dockerenv')) {
    fs.writeFileSync('/.dockerenv', '');
  }
} catch {
  // No write access to / — that's fine, source patches handle it
}
