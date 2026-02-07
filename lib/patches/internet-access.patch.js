import { Patch } from './patch-base.js';

const PATTERN = /[a-zA-Z0-9_]*\.hasInternetAccess\(\)/g;

export default new Patch({
  id: 'internet-access',
  description: 'Replace hasInternetAccess() calls with false',
  required: true,

  canApply(source) {
    return PATTERN.test(source);
  },

  apply(source) {
    return source.replace(new RegExp(PATTERN.source, 'g'), 'false');
  },
});
