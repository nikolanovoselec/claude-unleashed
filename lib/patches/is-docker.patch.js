import { Patch } from './patch-base.js';

// Matches both patterns:
//   Old: x3.getIsDocker()       — inline function call
//   New: getIsDocker:jG9         — property assignment in object literal
const CALL_PATTERN = /[a-zA-Z0-9_]*\.getIsDocker\(\)/;
const PROP_PATTERN = /getIsDocker:\w+/;

export default new Patch({
  id: 'is-docker',
  description: 'Replace getIsDocker() calls/references with true',
  required: true,

  canApply(source) {
    return CALL_PATTERN.test(source) || PROP_PATTERN.test(source);
  },

  apply(source) {
    let result = source;
    result = result.replace(new RegExp(CALL_PATTERN.source, 'g'), 'true');
    result = result.replace(new RegExp(PROP_PATTERN.source, 'g'), 'getIsDocker:()=>true');
    return result;
  },
});
