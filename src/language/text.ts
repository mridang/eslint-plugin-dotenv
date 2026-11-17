/**
 * @file Unicode-aware string helpers that follow Rust's definitions of whitespace and
 * alphabetic characters, so that this plugin judges the same characters as dotenv-linter.
 */

/**
 * The characters Rust's `char::is_whitespace` accepts, which differ from JavaScript's
 * in two places: Rust includes U+0085 and does not include U+FEFF.
 */
const WHITESPACE = String.raw`\t-\r \u0085\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000`;

/** Matches a string that is entirely whitespace, or empty. */
const BLANK = new RegExp(`^[${WHITESPACE}]*$`, 'u');

/** Matches the whitespace at the start of a string. */
const LEADING = new RegExp(`^[${WHITESPACE}]+`, 'u');

/** Matches the whitespace at the end of a string. */
const TRAILING = new RegExp(`[${WHITESPACE}]+$`, 'u');

/** Matches a single whitespace character. */
const WHITESPACE_CHARACTER = new RegExp(`[${WHITESPACE}]`, 'u');

/** Matches a single ASCII letter or digit. */
const ASCII_ALPHANUMERIC = /^[\dA-Za-z]$/u;

/** Matches a single alphabetic character. */
const ALPHABETIC = /^\p{Alphabetic}$/u;

/** Matches a single alphabetic or numeric character. */
const ALPHANUMERIC = /^[\p{Alphabetic}\p{N}]$/u;

/**
 * Removes the whitespace from both ends of a string, as Rust's `str::trim` does.
 * @param value The string to trim.
 * @returns The trimmed string.
 * @example
 * ```ts
 * trim('  FOO=BAR \n'); // 'FOO=BAR'
 * ```
 */
export function trim(value: string): string {
  return trimEnd(trimStart(value));
}

/**
 * Removes the whitespace from the start of a string, as Rust's `str::trim_start` does.
 * @param value The string to trim.
 * @returns The trimmed string.
 * @example
 * ```ts
 * trimStart('  FOO'); // 'FOO'
 * ```
 */
export function trimStart(value: string): string {
  return value.replace(LEADING, '');
}

/**
 * Removes the whitespace from the end of a string, as Rust's `str::trim_end` does.
 * @param value The string to trim.
 * @returns The trimmed string.
 * @example
 * ```ts
 * trimEnd('FOO  '); // 'FOO'
 * ```
 */
export function trimEnd(value: string): string {
  return value.replace(TRAILING, '');
}

/**
 * Tells whether a string is empty or made only of whitespace.
 * @param value The string to test.
 * @returns `true` when there is nothing but whitespace.
 * @example
 * ```ts
 * isBlank(' \t'); // true
 * ```
 */
export function isBlank(value: string): boolean {
  return BLANK.test(value);
}

/**
 * Tells whether a string contains at least one whitespace character.
 * @param value The string to test.
 * @returns `true` when a whitespace character is present.
 * @example
 * ```ts
 * hasWhitespace('BAR BAZ'); // true
 * ```
 */
export function hasWhitespace(value: string): boolean {
  return WHITESPACE_CHARACTER.test(value);
}

/**
 * Tells whether a character is alphabetic, as Rust's `char::is_alphabetic` does.
 * @param character A single character.
 * @returns `true` for an alphabetic character.
 * @example
 * ```ts
 * isAlphabetic('é'); // true
 * ```
 */
export function isAlphabetic(character: string): boolean {
  return ALPHABETIC.test(character);
}

/**
 * Tells whether a character is alphabetic or numeric, as Rust's `char::is_alphanumeric` does.
 * @param character A single character.
 * @returns `true` for a letter or a digit.
 * @example
 * ```ts
 * isAlphanumeric('7'); // true
 * ```
 */
export function isAlphanumeric(character: string): boolean {
  return ALPHANUMERIC.test(character);
}

/**
 * Tells whether a character is an ASCII letter or digit.
 * @param character A single character.
 * @returns `true` for `a-z`, `A-Z` and `0-9`.
 * @example
 * ```ts
 * isAsciiAlphanumeric('é'); // false
 * ```
 */
export function isAsciiAlphanumeric(character: string): boolean {
  return ASCII_ALPHANUMERIC.test(character);
}

/**
 * Tells whether the end of a string is escaped, meaning it ends with an odd number of backslashes.
 * @param prefix The text that comes before the character being tested.
 * @returns `true` when the next character would be escaped.
 * @example
 * ```ts
 * isEscaped('FOO=\\'); // true
 * ```
 */
export function isEscaped(prefix: string): boolean {
  return prefix.endsWith('\\') && !isEscaped(prefix.slice(0, -1));
}

/**
 * Finds the line break a file uses, so inserted lines match the lines around them.
 * @param text The text of the file.
 * @returns `\r\n` when the file has Windows line breaks, otherwise `\n`.
 * @example
 * ```ts
 * getLineBreak('A=1\r\nB=2\r\n'); // '\r\n'
 * ```
 */
export function getLineBreak(text: string): string {
  return text.includes('\r\n') ? '\r\n' : '\n';
}

/**
 * Compares two strings by their Unicode code points, which is the order Rust sorts strings in.
 * JavaScript's default order compares UTF-16 code units and differs for characters outside the
 * Basic Multilingual Plane.
 * @param left The first string.
 * @param right The second string.
 * @returns A negative number, zero or a positive number.
 * @example
 * ```ts
 * compareCodePoints('A', 'B'); // -1
 * ```
 */
export function compareCodePoints(left: string, right: string): number {
  const leftPoints = Array.from(
    left,
    (character) => character.codePointAt(0) ?? 0,
  );
  const rightPoints = Array.from(
    right,
    (character) => character.codePointAt(0) ?? 0,
  );
  const length = Math.min(leftPoints.length, rightPoints.length);
  const differing = Array.from(
    { length },
    (_, index) => (leftPoints[index] ?? 0) - (rightPoints[index] ?? 0),
  ).find((difference) => difference !== 0);

  return differing ?? leftPoints.length - rightPoints.length;
}
