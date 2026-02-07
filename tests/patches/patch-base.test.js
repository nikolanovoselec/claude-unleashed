import { describe, it, expect } from 'vitest';
import { Patch } from '../../lib/patches/patch-base.js';

describe('Patch base class', () => {
  it('constructor sets id, description, and required', () => {
    const p = new Patch({ id: 'test', description: 'Test patch', required: true });
    expect(p.id).toBe('test');
    expect(p.description).toBe('Test patch');
    expect(p.required).toBe(true);
  });

  it('required defaults to false', () => {
    const p = new Patch({ id: 'test', description: 'Test' });
    expect(p.required).toBe(false);
  });

  it('canApply throws if not overridden', () => {
    const p = new Patch({ id: 'test', description: 'Test' });
    expect(() => p.canApply('source')).toThrow(/not implemented/);
  });

  it('apply throws if not overridden', () => {
    const p = new Patch({ id: 'test', description: 'Test' });
    expect(() => p.apply('source')).toThrow(/not implemented/);
  });

  it('verify returns true when before !== after', () => {
    const p = new Patch({ id: 'test', description: 'Test' });
    expect(p.verify('before', 'after')).toBe(true);
  });

  it('verify returns false when before === after', () => {
    const p = new Patch({ id: 'test', description: 'Test' });
    expect(p.verify('same', 'same')).toBe(false);
  });
});
