/**
 * @file The `leading-character` rule, which reports a line that does not start with a letter or
 * an underscore.
 */
import { LineRule } from './dotenv-rule.js';
import type { LineText } from '../language/line-text.js';
import type { LineNode } from '../language/types.js';
import type { Reporter } from './reporter.js';
import type { DotenvRule } from './types.js';

/** Matches a line that starts with a letter or an underscore. */
const VALID_START = /^[\p{Alphabetic}_]/u;

/**
 * Reports an assignment whose first character is not a letter or an underscore, including a
 * space. The fix drops the invalid leading characters of the key.
 */
class LeadingCharacterRule extends LineRule<'invalid'> {
  /** Creates the rule. */
  public constructor() {
    super({
      name: 'leading-character',
      description:
        'Require every line to start with a letter or an underscore.',
      type: 'problem',
      fixable: 'code',
      messages: { invalid: 'Invalid leading character detected' },
    });
  }

  /**
   * Reports an assignment that does not start with a letter or an underscore.
   * @param line The line to check.
   * @param text What can be read from the line.
   * @param reporter Reports the problems of the file.
   */
  protected check(
    line: LineNode,
    text: LineText,
    reporter: Reporter<'invalid'>,
  ): void {
    const { raw, cleanedKey, value } = text;

    if (!VALID_START.test(raw)) {
      reporter.report(
        line,
        'invalid',
        undefined,
        cleanedKey === undefined || value === undefined
          ? null
          : text.assign(cleanedKey, value),
      );
    }
  }
}

const rule: DotenvRule<'invalid'> = new LeadingCharacterRule();

export default rule;
