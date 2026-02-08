#!/usr/bin/env node

import fs from 'fs';
import { RED, YELLOW, CYAN, GREEN, RESET, BOLD } from '../lib/colors.js';
import { getMode, setMode } from '../lib/mode.js';
import { askForConsent } from '../lib/consent.js';
import { resolveCliPaths } from '../lib/cli-resolver.js';
import { checkForUpdates } from '../lib/updater.js';
import { parseArgs, prepareUnleashedArgv, prepareSafeArgv } from '../lib/argv.js';
import { applyPatches } from '../lib/patcher.js';
import { handleError } from '../lib/errors.js';
import debug from '../lib/debug.js';

const { isSilent, skipConsent, safeMode: safeModeFlag, noUpdate, channel, pinnedVersion, disableInstallChecks } = parseArgs();
const { originalCliPath, patchedCliPath, nodeModulesDir, packageJsonPath, consentFlagPath } = resolveCliPaths();

const maybeUpdate = async () => {
  if (noUpdate) {
    debug("Updates disabled via --no-update or CLAUDE_UNLEASHED_NO_UPDATE");
    return;
  }
  try { await checkForUpdates({ packageJsonPath, nodeModulesDir, silent: isSilent, channel, pinnedVersion }); } catch (err) { debug(`Update check failed: ${err.message}`); }
};

async function run() {
  // Suppress upstream CLI's npm deprecation warning and internal auto-updater
  process.env.DISABLE_INSTALLATION_CHECKS = '1';
  process.env.DISABLE_AUTOUPDATER = '1';

  // Handle mode commands
  const args = process.argv.slice(2);
  if (args[0] === 'mode') {
    if (args[1] === 'yolo') {
      console.log(`${YELLOW}Switching to Unleashed mode...${RESET}`);
      console.log(`${RED}Warning: All safety checks will be disabled${RESET}`);
      setMode('YOLO');
      console.log(`${YELLOW}Unleashed mode activated${RESET}`);
      return;
    } else if (args[1] === 'safe') {
      console.log(`${CYAN}Switching to Safe mode...${RESET}`);
      console.log(`${GREEN}Safety checks will be enabled${RESET}`);
      setMode('SAFE');
      console.log(`${CYAN}Safe mode activated${RESET}`);
      return;
    } else {
      const currentMode = getMode();
      const displayMode = currentMode === 'YOLO' ? 'Unleashed' : 'Safe';
      console.log(`Current mode: ${currentMode === 'YOLO' ? YELLOW : CYAN}${displayMode}${RESET}`);
      return;
    }
  }

  const safeMode = safeModeFlag || getMode() === 'SAFE';

  // SAFE MODE — run original CLI unmodified
  if (safeMode) {
    prepareSafeArgv();
    if (!isSilent) console.log(`${CYAN}[Safe] Running Claude in Safe mode${RESET}`);
    await maybeUpdate();
    await import(originalCliPath);
    return;
  }

  // Unleashed mode
  if (!isSilent) console.log(`${YELLOW}[Unleashed] Running Claude in Unleashed mode${RESET}`);
  prepareUnleashedArgv();

  await maybeUpdate();

  // Handle consent
  const consentNeeded = !fs.existsSync(patchedCliPath) || !fs.existsSync(consentFlagPath);
  if (consentNeeded) {
    if (skipConsent) {
      debug("Consent skipped via CLAUDE_UNLEASHED_SKIP_CONSENT / CLAUDE_YOLO_SKIP_CONSENT or --no-consent");
      try { fs.writeFileSync(consentFlagPath, 'consent-given'); } catch (err) { debug(`Error creating consent flag: ${err.message}`); }
    } else {
      const consent = await askForConsent();
      if (!consent) process.exit(1);
      try { fs.writeFileSync(consentFlagPath, 'consent-given'); } catch (err) { debug(`Error creating consent flag: ${err.message}`); }
    }
  }

  // Apply declarative patch system
  applyPatches({ originalCliPath, patchedCliPath });

  if (!isSilent) console.log(`${YELLOW}Unleashed mode activated${RESET}`);

  await import(patchedCliPath);
}

run().catch(err => {
  handleError(err);
  console.error("Error:", err);
  process.exit(1);
});
