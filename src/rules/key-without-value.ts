/**
 * @file The `key-without-value` rule, which reports a line that has no `=`.
 */
import { LineRule } from './dotenv-rule.js';
import type { LineText } from '../language/line-text.js';
import type { LineNode } from '../language/types.js';
import type { Reporter } from './reporter.js';
import type { DotenvRule } from './types.js';

/**
 * Reports an assignment line with no `=`. The fix adds the `=`.
 */
class KeyWithoutValueRule extends LineRule<'missing'> {
  /** Creates the rule. */
  public constructor() {
    super({
      name: 'key-without-value',
      description: 'Require an equal sign after every key.',
      type: 'problem',
      fixable: 'code',
      messages: {
        missing: 'The {{key}} key should be with a value or have an equal sign',
      },
    });
  }

  /**
   * Reports an assignment that has no `=`.
   * @param line The line to check.
   * @param text What can be read from the line.
   * @param reporter Reports the problems of the file.
   */
  protected check(
    line: LineNode,
    text: LineText,
    reporter: Reporter<'missing'>,
  ): void {
    if (!text.raw.includes('=')) {
      reporter.report(
        line,
        'missing',
        { key: text.key ?? text.raw },
        `${text.raw}=`,
      );
    }
  }
}

const rule: DotenvRule<'missing'> = new KeyWithoutValueRule();

export default rule;
