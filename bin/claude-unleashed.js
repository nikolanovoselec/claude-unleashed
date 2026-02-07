#!/usr/bin/env node

import fs from 'fs';
import { RED, YELLOW, CYAN, GREEN, RESET, BOLD } from '../lib/colors.js';
import { getMode, setMode } from '../lib/mode.js';
import { askForConsent } from '../lib/consent.js';
import { resolveCliPaths } from '../lib/cli-resolver.js';
import { checkForUpdates } from '../lib/updater.js';
import { parseArgs, prepareYoloArgv, prepareSafeArgv } from '../lib/argv.js';
import { applyPatches } from '../lib/patcher.js';
import { handleError } from '../lib/errors.js';
import debug from '../lib/debug.js';

const { isSilent, skipConsent, safeMode: safeModeFlag, noUpdate, channel } = parseArgs();
const { originalCliPath, yoloCliPath, nodeModulesDir, packageJsonPath, consentFlagPath } = resolveCliPaths();

const maybeUpdate = async () => {
  if (noUpdate) {
    debug("Updates disabled via --no-update or CLAUDE_UNLEASHED_NO_UPDATE");
    return;
  }
  try { await checkForUpdates({ packageJsonPath, nodeModulesDir, silent: isSilent, channel }); } catch { /* recoverable — already logged to stderr */ }
};

async function run() {
  // Handle mode commands
  const args = process.argv.slice(2);
  if (args[0] === 'mode') {
    if (args[1] === 'yolo') {
      console.log(`${YELLOW}🔥 Switching to YOLO mode...${RESET}`);
      console.log(`${RED}⚠️  WARNING: All safety checks will be DISABLED!${RESET}`);
      setMode('YOLO');
      console.log(`${YELLOW}✓ YOLO mode activated${RESET}`);
      return;
    } else if (args[1] === 'safe') {
      console.log(`${CYAN}🛡️  Switching to SAFE mode...${RESET}`);
      console.log(`${GREEN}✓ Safety checks will be enabled${RESET}`);
      setMode('SAFE');
      console.log(`${CYAN}✓ SAFE mode activated${RESET}`);
      return;
    } else {
      const currentMode = getMode();
      console.log(`Current mode: ${currentMode === 'YOLO' ? YELLOW : CYAN}${currentMode}${RESET}`);
      return;
    }
  }

  const safeMode = safeModeFlag || getMode() === 'SAFE';

  // SAFE MODE — run original CLI unmodified
  if (safeMode) {
    prepareSafeArgv();
    if (!isSilent) console.log(`${CYAN}[SAFE] Running Claude in SAFE mode${RESET}`);
    await maybeUpdate();
    await import(originalCliPath);
    return;
  }

  // YOLO MODE
  if (!isSilent) console.log(`${YELLOW}[YOLO] Running Claude in YOLO mode${RESET}`);
  prepareYoloArgv();

  await maybeUpdate();

  // Handle consent
  const consentNeeded = !fs.existsSync(yoloCliPath) || !fs.existsSync(consentFlagPath);
  if (consentNeeded) {
    if (skipConsent) {
      debug("Consent skipped via CLAUDE_YOLO_SKIP_CONSENT or --no-consent");
      try { fs.writeFileSync(consentFlagPath, 'consent-given'); } catch (err) { debug(`Error creating consent flag: ${err.message}`); }
    } else {
      const consent = await askForConsent();
      if (!consent) process.exit(1);
      try { fs.writeFileSync(consentFlagPath, 'consent-given'); } catch (err) { debug(`Error creating consent flag: ${err.message}`); }
    }
  }

  // Apply declarative patch system
  applyPatches({ originalCliPath, yoloCliPath });

  if (!isSilent) console.log(`${YELLOW}🔥 YOLO MODE ACTIVATED 🔥${RESET}`);

  await import(yoloCliPath);
}

run().catch(err => {
  handleError(err);
  if (!(err instanceof Error && err.name === 'FatalError')) {
    console.error("Error:", err);
    process.exit(1);
  }
});
