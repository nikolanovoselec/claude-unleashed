import { describe, it, expect } from 'vitest';
import { findValueEnd, replaceProperty, replaceMethodCall } from '../../lib/patches/utils.js';

describe('findValueEnd', () => {
  it('finds comma at depth 0', () => {
    const s = 'foo,bar';
    expect(s[findValueEnd(s, 0)]).toBe(',');
  });

  it('finds closing brace at depth 0', () => {
    const s = 'foo}';
    expect(s[findValueEnd(s, 0)]).toBe('}');
  });

  it('skips commas inside parentheses', () => {
    const s = 'fn(a,b),next';
    expect(findValueEnd(s, 0)).toBe(7); // the comma after )
  });

  it('skips braces inside nested objects', () => {
    const s = '{a:1},next';
    expect(findValueEnd(s, 0)).toBe(5); // the comma after }
  });

  it('handles string literals with special chars', () => {
    const s = '"hello,}world",next';
    expect(findValueEnd(s, 0)).toBe(14); // the comma after the string
  });

  it('handles escaped quotes in strings', () => {
    const s = '"he\\"llo",next';
    expect(findValueEnd(s, 0)).toBe(9); // the comma after the string
  });

  it('handles arrow functions', () => {
    const s = '()=>check(),next';
    expect(findValueEnd(s, 0)).toBe(11); // the comma after ()
  });

  it('returns source length if no boundary found', () => {
    const s = 'foobar';
    expect(findValueEnd(s, 0)).toBe(6);
  });
});

describe('replaceProperty', () => {
  it('replaces simple identifier value', () => {
    expect(replaceProperty('{foo:bar,baz:1}', 'foo', 'NEW'))
      .toBe('{foo:NEW,baz:1}');
  });

  it('replaces $-prefixed identifier', () => {
    expect(replaceProperty('{foo:$PK,baz:1}', 'foo', 'NEW'))
      .toBe('{foo:NEW,baz:1}');
  });

  it('replaces arrow function value', () => {
    expect(replaceProperty('{foo:()=>check(),baz:1}', 'foo', '()=>false'))
      .toBe('{foo:()=>false,baz:1}');
  });

  it('replaces function call with args', () => {
    expect(replaceProperty('{foo:doStuff(a,b,c),baz:1}', 'foo', 'NEW'))
      .toBe('{foo:NEW,baz:1}');
  });

  it('replaces value at end of object (before })', () => {
    expect(replaceProperty('{baz:1,foo:bar}', 'foo', 'NEW'))
      .toBe('{baz:1,foo:NEW}');
  });

  it('handles multiple occurrences', () => {
    expect(replaceProperty('{foo:a,x:1,foo:b}', 'foo', 'NEW'))
      .toBe('{foo:NEW,x:1,foo:NEW}');
  });

  it('handles nested object value', () => {
    expect(replaceProperty('{foo:{a:1,b:2},baz:3}', 'foo', 'NEW'))
      .toBe('{foo:NEW,baz:3}');
  });

  it('does not modify unrelated properties', () => {
    expect(replaceProperty('{bar:1,baz:2}', 'foo', 'NEW'))
      .toBe('{bar:1,baz:2}');
  });

  it('handles whitespace around colon', () => {
    expect(replaceProperty('{foo : bar,baz:1}', 'foo', 'NEW'))
      .toBe('{foo : NEW,baz:1}');
  });
});

describe('replaceMethodCall', () => {
  it('replaces simple receiver.method()', () => {
    expect(replaceMethodCall('x.foo()', 'foo', 'false'))
      .toBe('false');
  });

  it('replaces $-prefixed receiver', () => {
    expect(replaceMethodCall('$x.foo()', 'foo', 'false'))
      .toBe('false');
  });

  it('replaces chained receiver', () => {
    expect(replaceMethodCall('a.b.foo()', 'foo', 'false'))
      .toBe('false');
  });

  it('replaces multiple occurrences', () => {
    expect(replaceMethodCall('x.foo();y.foo()', 'foo', 'R'))
      .toBe('R;R');
  });

  it('does not replace non-matching methods', () => {
    expect(replaceMethodCall('x.bar()', 'foo', 'false'))
      .toBe('x.bar()');
  });

  it('does not replace calls with arguments', () => {
    // Only zero-arg calls are matched
    expect(replaceMethodCall('x.foo(arg)', 'foo', 'false'))
      .toBe('x.foo(arg)');
  });
});
