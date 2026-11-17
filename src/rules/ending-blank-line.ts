/**
 * @file The `ending-blank-line` rule, which reports a file that does not end with a line break.
 */
import { getLineBreak } from '../language/text.js';
import type { ProgramNode } from '../language/types.js';
import { ProgramRule } from './dotenv-rule.js';
import type { Reporter } from './reporter.js';
import type { DotenvRule } from './types.js';

/**
 * Reports a last line that is not followed by a line break. The fix adds the line break, using
 * the line breaks the file already uses.
 */
class EndingBlankLineRule extends ProgramRule<'missing'> {
  /** Creates the rule. */
  public constructor() {
    super({
      name: 'ending-blank-line',
      description: 'Require a line break at the end of the file.',
      type: 'layout',
      fixable: 'whitespace',
      messages: { missing: 'No blank line at the end of the file' },
    });
  }

  /**
   * Reports the last line of the file when it has no line break after it.
   * @param program The lines of the file.
   * @param reporter Reports the problems of the file.
   */
  protected check(program: ProgramNode, reporter: Reporter<'missing'>): void {
    const last = program.body.at(-1);

    if (last?.isLast === true && !last.raw.endsWith('\n')) {
      reporter.report(last, 'missing', undefined, (fixer) =>
        fixer.insertTextAfterRange(last.range, getLineBreak(reporter.text)),
      );
    }
  }
}

const rule: DotenvRule<'missing'> = new EndingBlankLineRule();

export default rule;
