/**
 * @file Tests for the checks a schema runs on a value.
 */
import { describe, expect, it } from '@jest/globals';
import {
  BooleanValidator,
  EmailValidator,
  FloatValidator,
  IntegerValidator,
  PatternValidator,
  UrlValidator,
} from '../src/validators.js';

/** Matches a string made of uppercase letters only. */
const UPPERCASE = /^[A-Z]+$/u;

/** Matches a string that has a capital B in it. */
const CONTAINS_B = /B/u;

describe('PatternValidator', () => {
  it('accepts any value without a pattern', () => {
    expect(new PatternValidator().isValid('anything at all')).toBe(true);
  });

  it('accepts a value that matches the pattern somewhere', () => {
    expect(new PatternValidator(UPPERCASE).isValid('ABC')).toBe(true);
    expect(new PatternValidator(CONTAINS_B).isValid('ABC')).toBe(true);
  });

  it('rejects a value that does not match', () => {
    expect(new PatternValidator(UPPERCASE).isValid('abc')).toBe(false);
  });
});

describe('IntegerValidator', () => {
  const validator = new IntegerValidator();

  it.each(['0', '42', '-42', '+7', '2147483647', '-2147483648', '007'])(
    'accepts %j',
    (value) => {
      expect(validator.isValid(value)).toBe(true);
    },
  );

  it.each([
    '',
    'abc',
    '1.5',
    ' 1',
    '1 ',
    '2147483648',
    '-2147483649',
    '1_000',
    '0x10',
    '+',
    '--1',
  ])('rejects %j', (value) => {
    expect(validator.isValid(value)).toBe(false);
  });
});

describe('FloatValidator', () => {
  const validator = new FloatValidator();

  it.each([
    '1',
    '1.5',
    '.5',
    '5.',
    '+1.5',
    '-0.25',
    '1e10',
    '1E-5',
    '2.5e+3',
    'inf',
    '-Infinity',
    'NaN',
    '1e999',
  ])('accepts %j', (value) => {
    expect(validator.isValid(value)).toBe(true);
  });

  it.each([
    '',
    'abc',
    '.',
    'e5',
    '1e',
    '1_0',
    '0x10',
    ' 1',
    '1.5.2',
    'infinit',
    '--1',
  ])('rejects %j', (value) => {
    expect(validator.isValid(value)).toBe(false);
  });
});

describe('BooleanValidator', () => {
  const validator = new BooleanValidator();

  it.each([
    'true',
    'false',
    'TRUE',
    'FALSE',
    'yes',
    'no',
    'YES',
    'NO',
    '1',
    '0',
  ])('accepts %j', (value) => {
    expect(validator.isValid(value)).toBe(true);
  });

  it.each(['', 'True', 'maybe', '2', ' true'])('rejects %j', (value) => {
    expect(validator.isValid(value)).toBe(false);
  });
});

describe('UrlValidator', () => {
  const validator = new UrlValidator();

  it.each([
    'https://example.com',
    'http://localhost:3000/path?x=1',
    'ftp://host/file',
    'postgres://u:p@h/db',
    'mailto:a@b.co',
  ])('accepts %j', (value) => {
    expect(validator.isValid(value)).toBe(true);
  });

  it.each(['', 'example.com', '/relative/path', 'not a url', 'http://'])(
    'rejects %j',
    (value) => {
      expect(validator.isValid(value)).toBe(false);
    },
  );
});

describe('EmailValidator', () => {
  const validator = new EmailValidator();

  it.each(['a@b.co', 'first.last@example.com', 'user+tag@sub.example.org'])(
    'accepts %j',
    (value) => {
      expect(validator.isValid(value)).toBe(true);
    },
  );

  it.each(['', 'nobody', '@example.com', 'a@', 'a b@example.com', 'a@@b.co'])(
    'rejects %j',
    (value) => {
      expect(validator.isValid(value)).toBe(false);
    },
  );
});
