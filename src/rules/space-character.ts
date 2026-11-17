/**
 * @file The `space-character` rule, which reports spaces around the equal sign.
 */
import { trimEnd, trimStart } from '../language/text.js';
import { LineRule } from './dotenv-rule.js';
import type { LineText } from '../language/line-text.js';
import type { LineNode } from '../language/types.js';
import type { Reporter } from './reporter.js';
import type { DotenvRule } from './types.js';

/**
 * Reports a line with a space just before or just after its only `=`. The fix removes the spaces.
 */
class SpaceCharacterRule extends LineRule<'spaces'> {
  /** Creates the rule. */
  public constructor() {
    super({
      name: 'space-character',
      description: 'Disallow spaces around the equal sign.',
      type: 'layout',
      fixable: 'whitespace',
      messages: { spaces: 'The line has spaces around equal sign' },
    });
  }

  /**
   * Reports an assignment with a space next to its equal sign.
   * @param line The line to check.
   * @param text What can be read from the line.
   * @param reporter Reports the problems of the file.
   */
  protected check(
    line: LineNode,
    text: LineText,
    reporter: Reporter<'spaces'>,
  ): void {
    const parts = text.raw.split('=');
    const [before = '', after = ''] = parts;
    const { key, value } = text;

    if (parts.length === 2 && (before.endsWith(' ') || after.startsWith(' '))) {
      reporter.report(
        line,
        'spaces',
        undefined,
        key === undefined || value === undefined
          ? null
          : text.assign(trimEnd(key), trimStart(value)),
      );
    }
  }
}

const rule: DotenvRule<'spaces'> = new SpaceCharacterRule();

export default rule;
