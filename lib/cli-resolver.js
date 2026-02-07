import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CONSENT_FLAG_NAME, CONSENT_FLAG_PATH, UPSTREAM_PACKAGE } from './constants.js';
import { FatalError } from './errors.js';
import debug from './debug.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Migrate consent flag from old location (node_modules) to new (~/)
const migrateConsentFlag = (oldPath) => {
  if (!fs.existsSync(CONSENT_FLAG_PATH) && fs.existsSync(oldPath)) {
    try {
      fs.copyFileSync(oldPath, CONSENT_FLAG_PATH);
      debug(`Migrated consent flag from ${oldPath} to ${CONSENT_FLAG_PATH}`);
    } catch (err) {
      debug(`Failed to migrate consent flag: ${err.message}`);
    }
  }
};

export function resolveCliPaths() {
  let nodeModulesDir = path.resolve(__dirname, '..');
  while (!fs.existsSync(path.join(nodeModulesDir, 'node_modules')) && nodeModulesDir !== '/') {
    nodeModulesDir = path.resolve(nodeModulesDir, '..');
  }

  const packageJsonPath = path.join(nodeModulesDir, 'package.json');
  const claudeDir = path.join(nodeModulesDir, 'node_modules', ...UPSTREAM_PACKAGE.split('/'));
  debug(`Using Claude installation from: ${claudeDir}`);

  const mjsPath = path.join(claudeDir, 'cli.mjs');
  const jsPath = path.join(claudeDir, 'cli.js');
  let originalCliPath;
  let yoloCliPath;

  if (fs.existsSync(jsPath)) {
    originalCliPath = jsPath;
    yoloCliPath = path.join(claudeDir, 'cli-yolo.js');
    debug(`Found Claude CLI at ${originalCliPath} (js version)`);
  } else if (fs.existsSync(mjsPath)) {
    originalCliPath = mjsPath;
    yoloCliPath = path.join(claudeDir, 'cli-yolo.mjs');
    debug(`Found Claude CLI at ${originalCliPath} (mjs version)`);
  } else {
    throw new FatalError(
      `Claude CLI not found in ${claudeDir}`,
      { guidance: `Make sure ${UPSTREAM_PACKAGE} is installed. Try: npm install` }
    );
  }

  // Migrate consent from old location (inside node_modules) to new (home dir)
  const oldConsentPath = path.join(claudeDir, CONSENT_FLAG_NAME);
  migrateConsentFlag(oldConsentPath);

  // New consent flag path lives in home directory, persists across npm installs
  const consentFlagPath = CONSENT_FLAG_PATH;

  return { originalCliPath, yoloCliPath, claudeDir, nodeModulesDir, packageJsonPath, consentFlagPath };
}
