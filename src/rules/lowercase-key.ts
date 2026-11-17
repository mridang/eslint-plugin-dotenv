/**
 * @file The `lowercase-key` rule, which reports keys that are not in uppercase.
 */
import type { LineText } from '../language/line-text.js';
import type { LineNode } from '../language/types.js';
import { LineRule } from './dotenv-rule.js';
import type { Reporter } from './reporter.js';
import type { DotenvRule } from './types.js';

/**
 * Reports a key that is not in uppercase. The fix uppercases the key.
 */
class LowercaseKeyRule extends LineRule<'lowercase'> {
  /** Creates the rule. */
  public constructor() {
    super({
      name: 'lowercase-key',
      description: 'Require keys to be in uppercase.',
      type: 'suggestion',
      fixable: 'code',
      messages: { lowercase: 'The {{key}} key should be in uppercase' },
    });
  }

  /**
   * Reports an assignment whose key has a lowercase letter.
   * @param line The line to check.
   * @param text What can be read from the line.
   * @param reporter Reports the problems of the file.
   */
  protected check(
    line: LineNode,
    text: LineText,
    reporter: Reporter<'lowercase'>,
  ): void {
    const { key, value } = text;

    if (key !== undefined && key.toUpperCase() !== key) {
      reporter.report(
        line,
        'lowercase',
        { key },
        value === undefined ? null : text.assign(key.toUpperCase(), value),
      );
    }
  }
}

const rule: DotenvRule<'lowercase'> = new LowercaseKeyRule();

export default rule;
