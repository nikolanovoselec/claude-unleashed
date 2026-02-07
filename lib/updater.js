import fs from 'fs';
import { execSync } from 'child_process';
import { UPSTREAM_PACKAGE } from './constants.js';
import { FatalError, RecoverableError } from './errors.js';
import debug from './debug.js';

export async function checkForUpdates({ packageJsonPath, nodeModulesDir, silent, channel = 'latest', pinnedVersion = null }) {
  try {
    debug("Checking for Claude package updates...");

    let targetVersion;
    if (pinnedVersion) {
      if (!/^\d+\.\d+\.\d+$/.test(pinnedVersion)) {
        throw new FatalError(`Invalid pinned version "${pinnedVersion}". Expected format: X.Y.Z`);
      }
      targetVersion = pinnedVersion;
      debug(`Using pinned version: ${targetVersion}`);
    } else {
      const tag = channel === 'stable' ? 'stable' : 'latest';
      targetVersion = execSync(`npm view ${UPSTREAM_PACKAGE} version --tag ${tag}`, { stdio: ['pipe', 'pipe', 'pipe'] }).toString().trim();
      debug(`Latest Claude version on npm: ${targetVersion}`);
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const dependencies = packageJson.dependencies || {};
    const currentVersion = dependencies[UPSTREAM_PACKAGE];

    debug(`Claude version from package.json: ${currentVersion}`);

    if (currentVersion !== "latest" && currentVersion !== targetVersion) {
      if (!silent) console.log(`Updating Claude package from ${currentVersion || 'unknown'} to ${targetVersion}...`);

      // Atomic write: update package.json via temp file
      const tmpPath = packageJsonPath + '.tmp';
      packageJson.dependencies[UPSTREAM_PACKAGE] = targetVersion;
      fs.writeFileSync(tmpPath, JSON.stringify(packageJson, null, 2));
      fs.renameSync(tmpPath, packageJsonPath);

      if (!silent) console.log("Running npm install to update dependencies...");
      execSync("npm install --no-update-notifier", { stdio: silent ? 'pipe' : 'inherit', cwd: nodeModulesDir });
      if (!silent) console.log("Update complete!");
    } else if (currentVersion === "latest") {
      debug("Using 'latest' tag in package.json, running npm install to ensure we have the newest version");
      execSync("npm install --no-update-notifier", { stdio: silent ? 'pipe' : 'inherit', cwd: nodeModulesDir });
    }
  } catch (error) {
    // Always surface update errors to stderr, even in silent mode
    process.stderr.write(`[claude-unleashed] Update error: ${error.message}\n`);
    debug(error.stack);
    throw new RecoverableError(`Update check failed: ${error.message}`);
  }
}
