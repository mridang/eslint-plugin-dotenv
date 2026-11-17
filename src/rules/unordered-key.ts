/**
 * @file The `unordered-key` rule, which reports keys that are not in alphabetical order within
 * their group.
 */
import { ProgramRule } from './dotenv-rule.js';
import { KeyGroup } from './key-groups.js';
import type { ProgramNode } from '../language/types.js';
import type { Reporter } from './reporter.js';
import type { DotenvRule } from './types.js';

/**
 * Reports a key that should go before a key above it in the same group. The fix sorts the group,
 * keeping each key together with the comments above it. It does not add anything to the file.
 */
class UnorderedKeyRule extends ProgramRule<'unordered'> {
  /** Creates the rule. */
  public constructor() {
    super({
      name: 'unordered-key',
      description: 'Require the keys of a group to be in alphabetical order.',
      type: 'suggestion',
      fixable: 'code',
      messages: {
        unordered: 'The {{key}} key should go before the {{other}} key',
      },
    });
  }

  /**
   * Reports the misplaced keys of every group of the file.
   * @param program The lines of the file.
   * @param reporter Reports the problems of the file.
   */
  protected check(program: ProgramNode, reporter: Reporter<'unordered'>): void {
    // eslint-disable-next-line functional/no-loop-statements -- the loop only reports problems to ESLint, one call each
    for (const group of KeyGroup.split(program.body)) {
      const first = group.lines.at(0);
      const last = group.lines.at(-1);

      if (first !== undefined && last !== undefined) {
        const sorted = group.sortedText(reporter.text);

        // eslint-disable-next-line functional/no-loop-statements -- the loop only reports problems to ESLint, one call each
        for (const { line, key, other } of group.findMisplacements()) {
          reporter.report(line, 'unordered', { key, other }, (fixer) =>
            fixer.replaceTextRange([first.range[0], last.range[1]], sorted),
          );
        }
      }
    }
  }
}

const rule: DotenvRule<'unordered'> = new UnorderedKeyRule();

export default rule;
