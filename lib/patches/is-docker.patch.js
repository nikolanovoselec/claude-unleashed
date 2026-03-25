import { Patch } from './patch-base.js';
import { replaceProperty, replaceMethodCall } from './utils.js';

export default new Patch({
  id: 'is-docker',
  description: 'Replace getIsDocker() calls/references with true',
  required: true,

  canApply(source) {
    return source.includes('getIsDocker');
  },

  apply(source) {
    let result = source;
    // Strategy 1: Object property — depth-aware, handles any value type
    result = replaceProperty(result, 'getIsDocker', '()=>true');
    // Strategy 2: Method calls — handles any receiver expression
    result = replaceMethodCall(result, 'getIsDocker', 'true');
    return result;
  },
});
