/**
 * @file The `value-without-quotes` rule, which reports a value with whitespace that is not
 * wrapped in quotes.
 */
import { hasWhitespace, trim } from '../language/text.js';
import { LineRule } from './dotenv-rule.js';
import type { LineText } from '../language/line-text.js';
import type { LineNode } from '../language/types.js';
import type { Reporter } from './reporter.js';
import type { DotenvRule } from './types.js';

/** The quote characters a value can be wrapped in. */
const QUOTES = ["'", '"'] as const;

/**
 * Reports a value that holds whitespace but is not wrapped in one kind of quote. The fix wraps
 * the value in double quotes.
 */
class ValueWithoutQuotesRule extends LineRule<'unquoted'> {
  /** Creates the rule. */
  public constructor() {
    super({
      name: 'value-without-quotes',
      description: 'Require values with whitespace to be quoted.',
      type: 'problem',
      fixable: 'code',
      messages: { unquoted: 'This value needs to be surrounded in quotes' },
    });
  }

  /**
   * Reports an assignment whose value has whitespace and no quotes around it.
   * @param line The line to check.
   * @param text What can be read from the line.
   * @param reporter Reports the problems of the file.
   */
  protected check(
    line: LineNode,
    text: LineText,
    reporter: Reporter<'unquoted'>,
  ): void {
    const { key, value } = text;

    if (value === undefined) {
      return;
    }

    const trimmed = trim(value);
    const quoted = QUOTES.some(
      (quote) => trimmed.startsWith(quote) && trimmed.endsWith(quote),
    );

    if (hasWhitespace(trimmed) && !quoted) {
      reporter.report(
        line,
        'unquoted',
        undefined,
        key === undefined ? null : text.assign(key, `"${value}"`),
      );
    }
  }
}

const rule: DotenvRule<'unquoted'> = new ValueWithoutQuotesRule();

export default rule;
