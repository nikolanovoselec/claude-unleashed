import { Patch } from './patch-base.js';

// Matches both patterns:
//   Old: y.hasInternetAccess()   — inline function call
//   New: hasInternetAccess:dZq   — property assignment in object literal
const CALL_PATTERN = /[a-zA-Z0-9_]*\.hasInternetAccess\(\)/;
const PROP_PATTERN = /hasInternetAccess:\w+/;

export default new Patch({
  id: 'internet-access',
  description: 'Replace hasInternetAccess() calls/references with false',
  required: true,

  canApply(source) {
    return CALL_PATTERN.test(source) || PROP_PATTERN.test(source);
  },

  apply(source) {
    let result = source;
    result = result.replace(new RegExp(CALL_PATTERN.source, 'g'), 'false');
    result = result.replace(new RegExp(PROP_PATTERN.source, 'g'), 'hasInternetAccess:()=>false');
    return result;
  },
});
