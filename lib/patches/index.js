// Ordered patch registry — patches are applied in this order
import isDocker from './is-docker.patch.js';
import internetAccess from './internet-access.patch.js';
import rootCheck from './root-check.patch.js';
import punycode from './punycode.patch.js';
import planAutoaccept from './plan-autoaccept.patch.js';
import loadingMessages from './loading-messages.patch.js';
import autoUpdater from './auto-updater.patch.js';

export const patches = [
  isDocker,
  internetAccess,
  rootCheck,
  punycode,
  planAutoaccept,
  loadingMessages,
  autoUpdater,
];
