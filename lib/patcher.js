import fs from 'fs';
import crypto from 'crypto';
import { patches } from './patches/index.js';
import { FatalError } from './errors.js';
import debug from './debug.js';

const HASH_CACHE_SUFFIX = '.hash';

const fileHash = (content) =>
  crypto.createHash('sha256').update(content).digest('hex');

export function applyPatches({ originalCliPath, patchedCliPath }) {
  const source = fs.readFileSync(originalCliPath, 'utf8');
  const sourceHash = fileHash(source);

  // Check cache — skip if upstream hasn't changed
  const hashPath = patchedCliPath + HASH_CACHE_SUFFIX;
  if (fs.existsSync(patchedCliPath) && fs.existsSync(hashPath)) {
    const cachedHash = fs.readFileSync(hashPath, 'utf8').trim();
    if (cachedHash === sourceHash) {
      debug("Source hash matches cache, skipping re-patching");
      return { skippedViaCache: true, results: [] };
    }
  }

  let patched = source;
  const results = [];
  const failures = [];

  for (const patch of patches) {
    const before = patched;

    if (!patch.canApply(patched)) {
      if (patch.required) {
        failures.push({ id: patch.id, reason: 'Target pattern not found in source' });
        results.push({ id: patch.id, status: 'FAILED', reason: 'pattern not found' });
      } else {
        results.push({ id: patch.id, status: 'SKIPPED', reason: 'pattern not found' });
      }
      continue;
    }

    const after = patch.apply(patched);

    if (patch.verify(before, after)) {
      patched = after;
      results.push({ id: patch.id, status: 'OK' });
    } else {
      if (patch.required) {
        failures.push({ id: patch.id, reason: 'Patch applied but verification failed' });
        results.push({ id: patch.id, status: 'FAILED', reason: 'verification failed' });
      } else {
        results.push({ id: patch.id, status: 'SKIPPED', reason: 'no effect' });
      }
    }
  }

  // Log patch report in debug mode
  debug("--- Patch Report ---");
  for (const r of results) {
    const statusTag = r.status === 'OK' ? '[OK]' : r.status === 'SKIPPED' ? '[SKIP]' : '[FAIL]';
    debug(`  ${statusTag} ${r.id}${r.reason ? ` (${r.reason})` : ''}`);
  }
  debug("--------------------");

  // If any required patches failed, abort
  if (failures.length > 0) {
    const failSummary = failures.map(f => `  - ${f.id}: ${f.reason}`).join('\n');
    throw new FatalError(
      `Required patch(es) failed:\n${failSummary}`,
      { guidance: 'The upstream Claude CLI may have changed. Please report this at:\nhttps://github.com/nikolanovoselec/claude-unleashed/issues' }
    );
  }

  // Atomic write: write to tmp, then rename
  const tmpPath = patchedCliPath + '.tmp';
  fs.writeFileSync(tmpPath, patched);
  fs.renameSync(tmpPath, patchedCliPath);

  // Write hash cache
  fs.writeFileSync(hashPath, sourceHash);

  debug(`Patched CLI written to ${patchedCliPath}`);
  return { skippedViaCache: false, results };
}
