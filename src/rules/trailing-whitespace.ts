/**
 * @file The `trailing-whitespace` rule, which reports a line that ends with a space.
 */
import type { LineText } from '../language/line-text.js';
import { trimEnd } from '../language/text.js';
import type { LineNode } from '../language/types.js';
import { LineRule } from './dotenv-rule.js';
import type { Reporter } from './reporter.js';
import type { DotenvRule } from './types.js';

/**
 * Reports an assignment or a blank line that ends with a space. The fix removes the trailing
 * whitespace.
 */
class TrailingWhitespaceRule extends LineRule<'trailing'> {
  /** The types of line the rule checks. */
  protected override readonly lineTypes = ['Entry', 'Blank'] as const;

  /** Creates the rule. */
  public constructor() {
    super({
      name: 'trailing-whitespace',
      description: 'Disallow trailing whitespace at the end of a line.',
      type: 'layout',
      fixable: 'whitespace',
      messages: { trailing: 'Trailing whitespace detected' },
    });
  }

  /**
   * Reports a line that ends with a space.
   * @param line The line to check.
   * @param text What can be read from the line.
   * @param reporter Reports the problems of the file.
   */
  protected check(
    line: LineNode,
    text: LineText,
    reporter: Reporter<'trailing'>,
  ): void {
    if (text.raw.endsWith(' ')) {
      reporter.report(line, 'trailing', undefined, trimEnd(text.raw));
    }
  }
}

const rule: DotenvRule<'trailing'> = new TrailingWhitespaceRule();

export default rule;
