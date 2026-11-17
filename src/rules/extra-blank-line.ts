/**
 * @file The `extra-blank-line` rule, which reports blank lines that follow another blank line.
 */
import type { ProgramNode } from '../language/types.js';
import { ProgramRule } from './dotenv-rule.js';
import type { Reporter } from './reporter.js';
import type { DotenvRule } from './types.js';

/** Matches the line break at the start of a string. */
const LINE_BREAK = /^\r?\n/u;

/**
 * Reports a blank line right after another blank line. The fix removes the extra line; for the
 * empty line after the final line break it removes the blank line before it.
 */
class ExtraBlankLineRule extends ProgramRule<'extra'> {
  /** Creates the rule. */
  public constructor() {
    super({
      name: 'extra-blank-line',
      description: 'Disallow consecutive blank lines.',
      type: 'layout',
      fixable: 'whitespace',
      messages: { extra: 'Extra blank line detected' },
    });
  }

  /**
   * Reports every blank line whose line above it is blank too.
   * @param program The lines of the file.
   * @param reporter Reports the problems of the file.
   */
  protected check(program: ProgramNode, reporter: Reporter<'extra'>): void {
    const blanks = program.body.filter((line) => line.type === 'Blank');

    for (const [index, line] of blanks.entries()) {
      const previous = blanks[index - 1];

      if (previous?.number === line.number - 1) {
        const [start, end] = line.raw === '\n' ? previous.range : line.range;
        const lineBreak = LINE_BREAK.exec(reporter.text.slice(end, end + 2));

        reporter.report(line, 'extra', undefined, (fixer) =>
          fixer.removeRange([start, end + (lineBreak?.[0].length ?? 0)]),
        );
      }
    }
  }
}

const rule: DotenvRule<'extra'> = new ExtraBlankLineRule();

export default rule;
