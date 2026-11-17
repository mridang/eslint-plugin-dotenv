/**
 * @file The `quote-character` rule, which reports a value that has quotes it does not need.
 */
import type { LineText } from '../language/line-text.js';
import { hasWhitespace } from '../language/text.js';
import type { LineNode } from '../language/types.js';
import { LineRule } from './dotenv-rule.js';
import type { Reporter } from './reporter.js';
import type { DotenvRule } from './types.js';

/** The characters that make quotes necessary when they appear in a value. */
const NEEDS_QUOTES = ['$', '#', '&', '='];

/** Matches a quote character. */
const QUOTE = /["']/u;

/** Matches every quote character of a string. */
const ALL_QUOTES = /["']/gu;

/**
 * Reports a value that has quotes although it holds nothing that needs them: no whitespace, no
 * escaped newline and none of `$`, `#`, `&` and `=`. The fix removes the quotes.
 */
class QuoteCharacterRule extends LineRule<'quoted'> {
  /** Creates the rule. */
  public constructor() {
    super({
      name: 'quote-character',
      description: 'Disallow quotes around values that do not need them.',
      type: 'suggestion',
      fixable: 'code',
      messages: { quoted: 'The value has quote characters (\', ")' },
    });
  }

  /**
   * Reports an assignment whose value has quotes it does not need.
   * @param line The line to check.
   * @param text What can be read from the line.
   * @param reporter Reports the problems of the file.
   */
  protected check(
    line: LineNode,
    text: LineText,
    reporter: Reporter<'quoted'>,
  ): void {
    const { key, value } = text;

    const needsQuotes =
      value !== undefined &&
      (value.includes(String.raw`\n`) ||
        hasWhitespace(value) ||
        NEEDS_QUOTES.some((character) => value.includes(character)));

    if (value !== undefined && !needsQuotes && QUOTE.test(value)) {
      reporter.report(
        line,
        'quoted',
        undefined,
        key === undefined
          ? null
          : text.assign(key, value.replaceAll(ALL_QUOTES, '')),
      );
    }
  }
}

const rule: DotenvRule<'quoted'> = new QuoteCharacterRule();

export default rule;
