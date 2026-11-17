/**
 * @file Tests for the Unicode-aware string helpers.
 */
import { describe, expect, it } from '@jest/globals';
import {
  compareCodePoints,
  getLineBreak,
  hasWhitespace,
  isAlphabetic,
  isAlphanumeric,
  isAsciiAlphanumeric,
  isBlank,
  isEscaped,
  trim,
  trimEnd,
  trimStart,
} from '../../src/language/text.js';

describe('trim', () => {
  it('removes whitespace from both ends', () => {
    expect(trim('  FOO=BAR \t\n')).toBe('FOO=BAR');
  });

  it('removes the next-line character that Rust treats as whitespace', () => {
    expect(trim('\u0085FOO\u0085')).toBe('FOO');
  });

  it('keeps the byte order mark that JavaScript would remove', () => {
    expect(trim('\uFEFFFOO')).toBe('\uFEFFFOO');
  });

  it('removes from one end only when asked to', () => {
    expect(trimStart('  FOO  ')).toBe('FOO  ');
    expect(trimEnd('  FOO  ')).toBe('  FOO');
  });
});

describe('isBlank', () => {
  it.each(['', ' ', '\t \u00A0\u3000', '\n'])('is true for %j', (value) => {
    expect(isBlank(value)).toBe(true);
  });

  it.each(['a', ' a ', '#', '\uFEFF'])('is false for %j', (value) => {
    expect(isBlank(value)).toBe(false);
  });
});

describe('hasWhitespace', () => {
  it('finds whitespace anywhere', () => {
    expect(hasWhitespace('BAR BAZ')).toBe(true);
    expect(hasWhitespace('BAR\tBAZ')).toBe(true);
  });

  it('is false without whitespace', () => {
    expect(hasWhitespace('BARBAZ')).toBe(false);
  });
});

describe('character classes', () => {
  it('knows alphabetic characters of any script', () => {
    expect(isAlphabetic('a')).toBe(true);
    expect(isAlphabetic('é')).toBe(true);
    expect(isAlphabetic('日')).toBe(true);
    expect(isAlphabetic('1')).toBe(false);
    expect(isAlphabetic('_')).toBe(false);
  });

  it('knows alphanumeric characters of any script', () => {
    expect(isAlphanumeric('7')).toBe(true);
    expect(isAlphanumeric('٣')).toBe(true);
    expect(isAlphanumeric('é')).toBe(true);
    expect(isAlphanumeric('-')).toBe(false);
  });

  it('knows ASCII alphanumeric characters only', () => {
    expect(isAsciiAlphanumeric('a')).toBe(true);
    expect(isAsciiAlphanumeric('9')).toBe(true);
    expect(isAsciiAlphanumeric('é')).toBe(false);
    expect(isAsciiAlphanumeric('_')).toBe(false);
  });
});

describe('compareCodePoints', () => {
  it('orders by code point', () => {
    expect(compareCodePoints('A', 'B')).toBeLessThan(0);
    expect(compareCodePoints('B', 'A')).toBeGreaterThan(0);
    expect(compareCodePoints('A', 'A')).toBe(0);
  });

  it('puts a prefix before the longer string', () => {
    expect(compareCodePoints('FOO', 'FOO_BAR')).toBeLessThan(0);
    expect(compareCodePoints('FOO_BAR', 'FOO')).toBeGreaterThan(0);
  });

  it('puts characters outside the Basic Multilingual Plane after those inside it', () => {
    expect(compareCodePoints('\uFF21', '\u{10000}')).toBeLessThan(0);
  });
});

describe('isEscaped', () => {
  it('counts the trailing backslashes', () => {
    expect(isEscaped('\\')).toBe(true);
    expect(isEscaped('\\\\\\')).toBe(true);
    expect(isEscaped('\\\\')).toBe(false);
    expect(isEscaped('text without escaping')).toBe(false);
    expect(isEscaped('')).toBe(false);
  });
});

describe('getLineBreak', () => {
  it('uses Windows line breaks when the file has them', () => {
    expect(getLineBreak('A=1\r\nB=2\n')).toBe('\r\n');
  });

  it('uses a line feed otherwise', () => {
    expect(getLineBreak('A=1\nB=2\n')).toBe('\n');
    expect(getLineBreak('')).toBe('\n');
  });
});
