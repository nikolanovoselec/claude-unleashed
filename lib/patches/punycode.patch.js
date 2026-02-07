import { Patch } from './patch-base.js';

// Targeted patterns instead of blanket /"punycode"/g
const REPLACEMENTS = [
  { pattern: /require\("punycode"\)/g, replacement: 'require("punycode/")' },
  { pattern: /from "punycode"/g, replacement: 'from "punycode/"' },
  { pattern: /import "punycode"/g, replacement: 'import "punycode/"' },
];

export default new Patch({
  id: 'punycode',
  description: 'Add trailing slash to punycode imports (Node.js deprecation fix)',
  required: false,

  canApply(source) {
    return REPLACEMENTS.some(({ pattern }) => new RegExp(pattern.source).test(source));
  },

  apply(source) {
    let result = source;
    for (const { pattern, replacement } of REPLACEMENTS) {
      result = result.replace(new RegExp(pattern.source, 'g'), replacement);
    }
    return result;
  },
});
