import { RED, YELLOW, CYAN, GREEN, MAGENTA, RESET, BOLD } from '../lib/colors.js';

describe('colors', () => {
  const exports = { RED, YELLOW, CYAN, GREEN, MAGENTA, RESET, BOLD };

  for (const [name, value] of Object.entries(exports)) {
    it(`exports ${name} as an ANSI escape string`, () => {
      expect(typeof value).toBe('string');
      expect(value).toMatch(/^\x1b\[/);
    });
  }
});
