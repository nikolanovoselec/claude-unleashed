import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import patch from '../../lib/patches/loading-messages.patch.js';

describe('loading-messages patch', () => {
  const ORIGINAL_ARRAY = '["Accomplishing","Actioning","Actualizing","Baking","Brewing","Calculating","Cerebrating","Churning","Clauding","Coalescing","Cogitating","Computing","Conjuring","Considering","Cooking","Crafting","Creating","Crunching","Deliberating","Determining","Doing","Effecting","Finagling","Forging","Forming","Generating","Hatching","Herding","Honking","Hustling","Ideating","Inferring","Manifesting","Marinating","Moseying","Mulling","Mustering","Musing","Noodling","Percolating","Pondering","Processing","Puttering","Reticulating","Ruminating","Schlepping","Shucking","Simmering","Smooshing","Spinning","Stewing","Synthesizing","Thinking","Transmuting","Vibing","Working"]';

  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('canApply returns true when original array is present', () => {
    expect(patch.canApply(`var x=${ORIGINAL_ARRAY};`)).toBe(true);
  });

  it('canApply returns false when array is absent', () => {
    expect(patch.canApply('no loading messages here')).toBe(false);
  });

  it('apply produces valid JSON array', () => {
    const source = `var x=${ORIGINAL_ARRAY};`;
    const result = patch.apply(source);
    // Extract the JSON array from the result
    const match = result.match(/var x=(\[.*?\]);/);
    expect(match).not.toBeNull();
    const parsed = JSON.parse(match[1]);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(56);
  });

  it('all items have YOLO suffixes (contain ANSI codes)', () => {
    const source = `var x=${ORIGINAL_ARRAY};`;
    const result = patch.apply(source);
    const match = result.match(/var x=(\[.*?\]);/);
    const parsed = JSON.parse(match[1]);
    for (const item of parsed) {
      expect(item).toContain('\x1b[');
    }
  });

  it('is marked as optional', () => {
    expect(patch.required).toBe(false);
  });
});
