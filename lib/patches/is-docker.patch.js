import { Patch } from './patch-base.js';

const PATTERN = /[a-zA-Z0-9_]*\.getIsDocker\(\)/g;

export default new Patch({
  id: 'is-docker',
  description: 'Replace getIsDocker() calls with true',
  required: true,

  canApply(source) {
    return PATTERN.test(source);
  },

  apply(source) {
    return source.replace(new RegExp(PATTERN.source, 'g'), 'true');
  },
});
