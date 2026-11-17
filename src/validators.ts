/**
 * @file The checks a schema runs on a value, one class for each type a value can be required to
 * have.
 */
import validator from 'email-validator';

/** A check that a value is of the type a schema asks for. */
export interface ValueValidator {
  /**
   * Checks a value.
   * @param value The value, exactly as written after the `=`.
   * @returns `true` when the value is valid.
   */
  isValid(value: string): boolean;
}

/** Matches an integer written with an optional sign and digits only. */
const INTEGER = /^[+-]?\d+$/u;

/** The smallest 32-bit signed integer. */
const INT32_MIN = -(2 ** 31);

/** The largest 32-bit signed integer. */
const INT32_MAX = 2 ** 31 - 1;

/** Matches the words Rust accepts as a float: infinity and not-a-number, with an optional sign. */
const FLOAT_WORD = /^[+-]?(?:inf|infinity|nan)$/iu;

/** Matches the numbers Rust accepts as a float: digits with an optional fraction and exponent. */
const FLOAT_NUMBER = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/iu;

/** The words dotenv-linter accepts as a boolean. */
const BOOLEANS: ReadonlySet<string> = new Set([
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
]);

/**
 * Accepts any string, or only the strings that match a pattern somewhere.
 * @example
 * ```ts
 * new PatternValidator(/^[A-Z]+$/u).isValid('ABC'); // true
 * ```
 */
export class PatternValidator implements ValueValidator {
  /**
   * Creates a validator.
   * @param pattern The pattern a value has to match, or `undefined` to accept any value.
   */
  public constructor(private readonly pattern?: RegExp) {}

  /**
   * Checks a value against the pattern.
   * @param value The value to check.
   * @returns `true` when there is no pattern, or the value matches it.
   */
  public isValid(value: string): boolean {
    return this.pattern?.test(value) ?? true;
  }
}

/** Accepts a whole number that fits in 32 bits, with an optional sign. */
export class IntegerValidator implements ValueValidator {
  /**
   * Checks that a value is an integer.
   * @param value The value to check.
   * @returns `true` for an integer between -2147483648 and 2147483647.
   */
  public isValid(value: string): boolean {
    return (
      INTEGER.test(value) &&
      Number(value) >= INT32_MIN &&
      Number(value) <= INT32_MAX
    );
  }
}

/** Accepts the numbers Rust reads as a float, including `inf` and `NaN`. */
export class FloatValidator implements ValueValidator {
  /**
   * Checks that a value is a float.
   * @param value The value to check.
   * @returns `true` for a number, with an optional fraction and exponent, or an infinity.
   */
  public isValid(value: string): boolean {
    return FLOAT_WORD.test(value) || FLOAT_NUMBER.test(value);
  }
}

/** Accepts `true`, `false`, `yes`, `no`, `1` and `0`, in lowercase or uppercase. */
export class BooleanValidator implements ValueValidator {
  /**
   * Checks that a value is a boolean.
   * @param value The value to check.
   * @returns `true` for one of the accepted words.
   */
  public isValid(value: string): boolean {
    return BOOLEANS.has(value);
  }
}

/** Accepts an absolute URL. */
export class UrlValidator implements ValueValidator {
  /**
   * Checks that a value is a URL.
   * @param value The value to check.
   * @returns `true` when the value parses as an absolute URL.
   */
  public isValid(value: string): boolean {
    return URL.canParse(value);
  }
}

/** Accepts an email address. */
export class EmailValidator implements ValueValidator {
  /**
   * Checks that a value is an email address.
   * @param value The value to check.
   * @returns `true` for a well-formed address.
   */
  public isValid(value: string): boolean {
    return validator.validate(value);
  }
}
