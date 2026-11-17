/**
 * @file The `duplicated-key` rule, which reports a key that is assigned more than once.
 */
import { LineText } from '../language/line-text.js';
import type { ProgramNode } from '../language/types.js';
import { ProgramRule } from './dotenv-rule.js';
import type { Reporter } from './reporter.js';
import type { DotenvRule } from './types.js';

/**
 * Reports the second and later assignments of a key. The key is read without an `export ` prefix,
 * so `export A=1` and `A=2` clash. The fix comments the repeated line out, every physical line of
 * it when the value spans several.
 */
class DuplicatedKeyRule extends ProgramRule<'duplicated'> {
  /** Creates the rule. */
  public constructor() {
    super({
      name: 'duplicated-key',
      description: 'Disallow a key that is assigned more than once.',
      type: 'problem',
      fixable: 'code',
      messages: { duplicated: 'The {{key}} key is duplicated' },
    });
  }

  /**
   * Reports every assignment whose key was assigned on an earlier line.
   * @param program The lines of the file.
   * @param reporter Reports the problems of the file.
   */
  protected check(
    program: ProgramNode,
    reporter: Reporter<'duplicated'>,
  ): void {
    const assignments = program.body.flatMap((line) => {
      const key = new LineText(line.raw).key;

      return line.type === 'Entry' && key !== undefined ? [{ line, key }] : [];
    });
    const firstLines = new Map(
      assignments.toReversed().map(({ line, key }) => [key, line]),
    );

    for (const { line, key } of assignments) {
      if (firstLines.get(key) !== line) {
        const commented = line.raw.split('\n').map((part) => `# ${part}`);

        reporter.report(line, 'duplicated', { key }, commented.join('\n'));
      }
    }
  }
}

const rule: DotenvRule<'duplicated'> = new DuplicatedKeyRule();

export default rule;
