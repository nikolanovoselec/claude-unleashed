import { Patch } from './patch-base.js';
import { RED, YELLOW, CYAN, RESET, BOLD } from '../colors.js';

const ORIGINAL_ARRAY = '["Accomplishing","Actioning","Actualizing","Baking","Brewing","Calculating","Cerebrating","Churning","Clauding","Coalescing","Cogitating","Computing","Conjuring","Considering","Cooking","Crafting","Creating","Crunching","Deliberating","Determining","Doing","Effecting","Finagling","Forging","Forming","Generating","Hatching","Herding","Honking","Hustling","Ideating","Inferring","Manifesting","Marinating","Moseying","Mulling","Mustering","Musing","Noodling","Percolating","Pondering","Processing","Puttering","Reticulating","Ruminating","Schlepping","Shucking","Simmering","Smooshing","Spinning","Stewing","Synthesizing","Thinking","Transmuting","Vibing","Working"]';

const YOLO_SUFFIXES = [
  ` ${RED}(safety's off, hold on tight)${RESET}`,
  ` ${YELLOW}(all gas, no brakes, lfg)${RESET}`,
  ` ${BOLD}\x1b[35m(unleashed mode)${RESET}`,
  ` ${CYAN}(dangerous mode! I guess you can just do things)${RESET}`
];

export default new Patch({
  id: 'loading-messages',
  description: 'Replace loading messages with Unleashed-themed versions',
  required: false,

  canApply(source) {
    return source.includes(ORIGINAL_ARRAY);
  },

  apply(source) {
    try {
      const array = JSON.parse(ORIGINAL_ARRAY);
      const yoloArray = array.map(word =>
        word + YOLO_SUFFIXES[Math.floor(Math.random() * YOLO_SUFFIXES.length)]
      );
      return source.replace(ORIGINAL_ARRAY, JSON.stringify(yoloArray));
    } catch {
      return source;
    }
  },
});
