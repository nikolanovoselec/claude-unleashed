import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { UPSTREAM_PACKAGE } from './constants.js';
import { FatalError, RecoverableError } from './errors.js';
import debug from './debug.js';

/**
 * Read the actually installed version from the package's own package.json
 * inside node_modules (not the dependency spec in the parent package.json).
 */
function getInstalledVersion(nodeModulesDir) {
  try {
    const installedPkgPath = path.join(nodeModulesDir, 'node_modules', ...UPSTREAM_PACKAGE.split('/'), 'package.json');
    const installedPkg = JSON.parse(fs.readFileSync(installedPkgPath, 'utf8'));
    return installedPkg.version || null;
  } catch {
    return null;
  }
}

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

    const installedVersion = getInstalledVersion(nodeModulesDir);
    debug(`Actually installed version: ${installedVersion || 'not found'}`);

    // If the installed version already matches the target, skip npm install entirely
    if (installedVersion === targetVersion) {
      debug("Installed version matches target, skipping npm install");
      return;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const dependencies = packageJson.dependencies || {};
    const currentVersion = dependencies[UPSTREAM_PACKAGE];

    debug(`Claude version from package.json: ${currentVersion}`);

    // Pin the target version in package.json (replace "latest" or outdated version)
    if (currentVersion !== targetVersion) {
      if (!silent) console.log(`Updating Claude package from ${installedVersion || currentVersion || 'unknown'} to ${targetVersion}...`);

      // Atomic write: update package.json via temp file
      const tmpPath = packageJsonPath + '.tmp';
      packageJson.dependencies[UPSTREAM_PACKAGE] = targetVersion;
      fs.writeFileSync(tmpPath, JSON.stringify(packageJson, null, 2));
      fs.renameSync(tmpPath, packageJsonPath);
    }

    if (!silent) console.log("Running npm install to update dependencies...");
    execSync("npm install --no-update-notifier", { stdio: silent ? 'pipe' : 'inherit', cwd: nodeModulesDir });
    if (!silent) console.log("Update complete!");
  } catch (error) {
    // Always surface update errors to stderr, even in silent mode
    process.stderr.write(`[claude-unleashed] Update error: ${error.message}\n`);
    debug(error.stack);
    throw new RecoverableError(`Update check failed: ${error.message}`);
  }
}
