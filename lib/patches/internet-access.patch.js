import { Patch } from './patch-base.js';
import { replaceProperty, replaceMethodCall } from './utils.js';

export default new Patch({
  id: 'internet-access',
  description: 'Replace hasInternetAccess() calls/references with false',
  required: true,

  canApply(source) {
    return source.includes('hasInternetAccess');
  },

  apply(source) {
    let result = source;
    // Strategy 1: Object property — depth-aware, handles any value type
    result = replaceProperty(result, 'hasInternetAccess', '()=>false');
    // Strategy 2: Method calls — handles any receiver expression
    result = replaceMethodCall(result, 'hasInternetAccess', 'false');
    return result;
  },
});
