import { Patch } from './patch-base.js';
import debug from '../debug.js';

// Strategy 2: Known versioned anchors (fallback)
const KNOWN_ANCHOR = 'let M=Md(),R=M?oH(M):null';
const KNOWN_PATCH = `k5.useEffect(()=>{if(G.toolPermissionContext.isBypassPermissionsModeAvailable&&!F){N("yes-bypass-permissions")}},[]);`;

export default new Patch({
  id: 'plan-autoaccept',
  description: 'Auto-accept plan mode when bypass permissions is available',
  required: false,

  canApply(source) {
    // Strategy 1: Semantic anchor — find isBypassPermissionsModeAvailable
    if (source.includes('isBypassPermissionsModeAvailable')) {
      return true;
    }
    // Strategy 2: Known pattern
    if (source.includes(KNOWN_ANCHOR)) {
      return true;
    }
    return false;
  },

  apply(source) {
    // Strategy 1: Semantic anchor search
    // Find the string literal `isBypassPermissionsModeAvailable` and derive
    // the surrounding context: the React hook alias (useEffect) and the submit function
    const semanticResult = trySemanticPatch(source);
    if (semanticResult) {
      debug("[plan-autoaccept] Applied via semantic anchor strategy");
      return semanticResult;
    }

    // Strategy 2: Known pattern matching
    if (source.includes(KNOWN_ANCHOR)) {
      debug("[plan-autoaccept] Applied via known pattern strategy");
      return source.replace(KNOWN_ANCHOR, KNOWN_ANCHOR + ';' + KNOWN_PATCH);
    }

    debug("[plan-autoaccept] WARNING: No strategy matched, skipping");
    return source;
  },
});

const trySemanticPatch = (source) => {
  // Find `isBypassPermissionsModeAvailable` in the source
  const anchorIndex = source.indexOf('isBypassPermissionsModeAvailable');
  if (anchorIndex === -1) return null;

  // Look backwards from the anchor to find the component boundary region (~2000 chars)
  const searchStart = Math.max(0, anchorIndex - 2000);
  const region = source.slice(searchStart, anchorIndex + 500);

  // Find the useEffect alias: look for pattern like `XX.useEffect(` where XX is a short identifier
  // In minified React bundles, useEffect is accessed as a property of the React import alias
  const useEffectMatch = region.match(/(\w{1,3})\.useEffect\(/);
  if (!useEffectMatch) {
    debug("[plan-autoaccept] Could not find useEffect alias in region");
    return null;
  }
  const reactAlias = useEffectMatch[1];

  // Find the permission context object: pattern like `XX.toolPermissionContext`
  const permContextMatch = region.match(/(\w+)\.toolPermissionContext/);
  if (!permContextMatch) {
    debug("[plan-autoaccept] Could not find toolPermissionContext accessor");
    return null;
  }
  const contextObj = permContextMatch[1];

  // Find the submit/dispatch function: look for pattern like `XX("yes-bypass-permissions")`
  // or `XX('yes-bypass-permissions')` in the wider region
  const widerRegion = source.slice(searchStart, anchorIndex + 2000);
  const submitMatch = widerRegion.match(/(\w+)\(["']yes-bypass-permissions["']\)/);
  if (!submitMatch) {
    debug("[plan-autoaccept] Could not find submit function for yes-bypass-permissions");
    return null;
  }
  const submitFn = submitMatch[1];

  // Build the dynamic patch
  const dynamicPatch = `${reactAlias}.useEffect(()=>{if(${contextObj}.toolPermissionContext.isBypassPermissionsModeAvailable&&!F){${submitFn}("yes-bypass-permissions")}},[]);`;

  // Find a suitable injection point — the known anchor pattern or the nearest
  // `let` declaration before the component return
  if (source.includes(KNOWN_ANCHOR)) {
    return source.replace(KNOWN_ANCHOR, KNOWN_ANCHOR + ';' + dynamicPatch);
  }

  // Fallback: inject right before `isBypassPermissionsModeAvailable` usage site
  // Find the start of the statement containing isBypassPermissionsModeAvailable
  const stmtStart = source.lastIndexOf(';', anchorIndex);
  if (stmtStart !== -1) {
    return source.slice(0, stmtStart + 1) + dynamicPatch + source.slice(stmtStart + 1);
  }

  return null;
};
