/**
 * @file The `incorrect-delimiter` rule, which reports keys that use anything but letters,
 * digits and underscores.
 */
import type { LineText } from '../language/line-text.js';
import { trim, trimEnd } from '../language/text.js';
import type { LineNode } from '../language/types.js';
import { LineRule } from './dotenv-rule.js';
import type { Reporter } from './reporter.js';
import type { DotenvRule } from './types.js';

/** Matches a key made only of letters, digits and underscores. */
const VALID_KEY = /^[\p{Alphabetic}\p{N}_]*$/u;

/** Matches a character that is not a letter or a digit. */
const DELIMITER = /[^\p{Alphabetic}\p{N}]/gu;

/**
 * Reports a key that has a character other than a letter, a digit or an underscore after its
 * first valid character. The fix replaces each such character with an underscore, and leaves the
 * whitespace before the `=` alone.
 */
class IncorrectDelimiterRule extends LineRule<'incorrect'> {
  /** Creates the rule. */
  public constructor() {
    super({
      name: 'incorrect-delimiter',
      description: 'Require keys to use only letters, digits and underscores.',
      type: 'problem',
      fixable: 'code',
      messages: { incorrect: 'The {{key}} key has incorrect delimiter' },
    });
  }

  /**
   * Reports an assignment whose key has an invalid character.
   * @param line The line to check.
   * @param text What can be read from the line.
   * @param reporter Reports the problems of the file.
   */
  protected check(
    line: LineNode,
    text: LineText,
    reporter: Reporter<'incorrect'>,
  ): void {
    const { key, cleanedKey, value } = text;

    if (
      key === undefined ||
      cleanedKey === undefined ||
      VALID_KEY.test(trim(cleanedKey))
    ) {
      return;
    }

    const leading = key.slice(0, key.length - cleanedKey.length);
    const body = trimEnd(cleanedKey);
    const trailing = cleanedKey.slice(body.length);

    reporter.report(
      line,
      'incorrect',
      { key },
      value === undefined
        ? null
        : text.assign(
            `${leading}${body.replaceAll(DELIMITER, '_')}${trailing}`,
            value,
          ),
    );
  }
}

const rule: DotenvRule<'incorrect'> = new IncorrectDelimiterRule();

export default rule;
