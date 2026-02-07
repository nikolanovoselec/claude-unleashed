import { Patch } from './patch-base.js';

const PATTERNS = [
  /process\.getuid\(\)\s*===\s*0/g,
  /process\.getuid\?\.\(\)\s*===\s*0/g,
  /(\w+)\.getuid\(\)\s*===\s*0/g,
  /process\.geteuid\(\)\s*===\s*0/g,
  /process\.geteuid\?\.\(\)\s*===\s*0/g,
];

export default new Patch({
  id: 'root-check',
  description: 'Replace all getuid/geteuid === 0 checks with false',
  required: true,

  canApply(source) {
    return PATTERNS.some(p => new RegExp(p.source).test(source));
  },

  apply(source) {
    let result = source;
    for (const pattern of PATTERNS) {
      result = result.replace(new RegExp(pattern.source, 'g'), 'false');
    }
    return result;
  },
});
