import fs from 'fs';
import { execSync } from 'child_process';
import { UPSTREAM_PACKAGE } from './constants.js';
import { RecoverableError } from './errors.js';
import debug from './debug.js';

export async function checkForUpdates({ packageJsonPath, nodeModulesDir, silent, channel = 'latest' }) {
  try {
    debug("Checking for Claude package updates...");

    const tag = channel === 'stable' ? 'stable' : 'latest';
    const latestVersion = execSync(`npm view ${UPSTREAM_PACKAGE} version --tag ${tag}`).toString().trim();
    debug(`Latest Claude version on npm: ${latestVersion}`);

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const dependencies = packageJson.dependencies || {};
    const currentVersion = dependencies[UPSTREAM_PACKAGE];

    debug(`Claude version from package.json: ${currentVersion}`);

    if (currentVersion !== "latest" && currentVersion !== latestVersion) {
      if (!silent) console.log(`Updating Claude package from ${currentVersion || 'unknown'} to ${latestVersion}...`);

      // Atomic write: update package.json via temp file
      const tmpPath = packageJsonPath + '.tmp';
      packageJson.dependencies[UPSTREAM_PACKAGE] = latestVersion;
      fs.writeFileSync(tmpPath, JSON.stringify(packageJson, null, 2));
      fs.renameSync(tmpPath, packageJsonPath);

      if (!silent) console.log("Running npm install to update dependencies...");
      execSync("npm install", { stdio: silent ? 'pipe' : 'inherit', cwd: nodeModulesDir });
      if (!silent) console.log("Update complete!");
    } else if (currentVersion === "latest") {
      debug("Using 'latest' tag in package.json, running npm install to ensure we have the newest version");
      execSync("npm install", { stdio: silent ? 'pipe' : 'inherit', cwd: nodeModulesDir });
    }
  } catch (error) {
    // Always surface update errors to stderr, even in silent mode
    process.stderr.write(`[claude-unleashed] Update error: ${error.message}\n`);
    debug(error.stack);
    throw new RecoverableError(`Update check failed: ${error.message}`);
  }
}
