/**
 * Robust utilities for patching minified JS source code.
 *
 * Instead of matching specific minified identifier names (which change every
 * build), these utilities use depth-aware scanning to find value boundaries
 * in object literals and method calls.
 */

/**
 * Find the end index of a JS value starting at `start`.
 * Tracks nesting depth through (), [], {} and respects string literals.
 * Returns the index of the first `,` or `}` at depth 0 (the value boundary).
 */
export function findValueEnd(source, start) {
  let depth = 0;
  let i = start;
  let inString = null;

  while (i < source.length) {
    const ch = source[i];

    if (inString) {
      if (ch === '\\') { i += 2; continue; }
      if (ch === inString) inString = null;
      i++;
      continue;
    }

    switch (ch) {
      case '"': case "'": case '`':
        inString = ch;
        break;
      case '(': case '[': case '{':
        depth++;
        break;
      case ')': case ']':
        depth--;
        break;
      case '}':
        if (depth === 0) return i;
        depth--;
        break;
      case ',':
        if (depth === 0) return i;
        break;
    }
    i++;
  }
  return i;
}

/**
 * Replace the value of an object property in minified JS source.
 *
 * Matches `propName:VALUE` where VALUE can be any JS expression (identifier,
 * arrow function, function call, nested object, etc.). Handles quoted and
 * unquoted property names.
 *
 * @param {string} source - The source code
 * @param {string} propName - The property name to find
 * @param {string} newValue - The replacement value expression
 * @returns {string} Modified source
 */
export function replaceProperty(source, propName, newValue) {
  // Match the property key followed by colon (with optional whitespace)
  // Handles: propName:, "propName":, 'propName':
  const keyPattern = new RegExp(
    `(?:["']?${escapeForRegex(propName)}["']?\\s*:\\s*)`,
    'g',
  );

  let result = source;
  let offset = 0;

  for (const match of source.matchAll(keyPattern)) {
    const keyEnd = match.index + offset + match[0].length;
    const valueEnd = findValueEnd(result, keyEnd);
    const oldValue = result.slice(keyEnd, valueEnd);
    result = result.slice(0, keyEnd) + newValue + result.slice(valueEnd);
    offset += newValue.length - oldValue.length;
  }

  return result;
}

/**
 * Replace method calls like `receiver.methodName()` with a fixed value.
 *
 * Handles any receiver expression (simple identifier, chained access, etc.).
 * Only replaces zero-argument calls.
 *
 * @param {string} source - The source code
 * @param {string} methodName - The method name to find
 * @param {string} replacement - The replacement expression
 * @returns {string} Modified source
 */
export function replaceMethodCall(source, methodName, replacement) {
  // Match any receiver followed by .methodName()
  // Receiver can contain word chars, $, dots (for chained access)
  const pattern = new RegExp(
    `[\\w$.]*\\.${escapeForRegex(methodName)}\\(\\)`,
    'g',
  );
  return source.replace(pattern, replacement);
}

function escapeForRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
