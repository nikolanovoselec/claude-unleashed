import { Patch } from './patch-base.js';

// The auto-updater disable check function (WP1 in current build) contains
// the string literal "DISABLE_AUTOUPDATER" and returns null when no disable
// reason is found. We inject an additional check for DISABLE_INSTALLATION_CHECKS
// at the top of this function so it short-circuits when that env var is set.
//
// Target pattern (minified, function names change across versions):
//   function XX(){if(_6(process.env.DISABLE_AUTOUPDATER))return"DISABLE_AUTOUPDATER set";...return null}
//
// We match the stable string: process.env.DISABLE_AUTOUPDATER))return"DISABLE_AUTOUPDATER set"
// and prepend a check for DISABLE_INSTALLATION_CHECKS before it.

const SEARCH = 'process.env.DISABLE_AUTOUPDATER))return"DISABLE_AUTOUPDATER set"';
const REPLACE =
  'process.env.DISABLE_INSTALLATION_CHECKS))return"DISABLE_INSTALLATION_CHECKS set";' +
  'if(_6(process.env.DISABLE_AUTOUPDATER))return"DISABLE_AUTOUPDATER set"';

export default new Patch({
  id: 'auto-updater',
  description: 'Disable auto-updater when DISABLE_INSTALLATION_CHECKS is set',
  required: false,

  canApply(source) {
    return source.includes(SEARCH);
  },

  apply(source) {
    // The pattern occurs in the WP1-equivalent function definition.
    // We need to replace only the first occurrence (the actual function body),
    // not any duplicates in string literals or comments.
    // Using indexOf + slice for a single precise replacement.
    const idx = source.indexOf(SEARCH);
    if (idx === -1) return source;

    // Walk backwards to find "if(_6(" that precedes our match
    const prefix = 'if(_6(';
    const ifStart = source.lastIndexOf(prefix, idx);
    if (ifStart === -1 || idx - ifStart > prefix.length + 5) {
      // Fallback: just do a simple single replace
      return source.replace(SEARCH, REPLACE);
    }

    const fullOld = source.slice(ifStart, idx + SEARCH.length);
    const fullNew = 'if(_6(' + REPLACE;

    return source.slice(0, ifStart) + fullNew + source.slice(ifStart + fullOld.length);
  },
});
