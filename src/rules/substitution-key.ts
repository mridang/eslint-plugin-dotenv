/**
 * @file The `substitution-key` rule, which reports variable references with unbalanced braces
 * or invalid names.
 */
import { isEscaped, trim } from '../language/text.js';
import { LineRule } from './dotenv-rule.js';
import type { LineText } from '../language/line-text.js';
import type { LineNode } from '../language/types.js';
import type { Reporter } from './reporter.js';
import type { DotenvRule } from './types.js';

/** Matches the first character that cannot be part of a variable name. */
const NON_NAME_CHARACTER = /[^\dA-Za-z_]/u;

/** Matches a name that is made only of variable name characters. */
const NAME = /^\w*$/u;

/**
 * Reports a reference to a variable with unbalanced braces or a name with invalid characters, such
 * as `${BAR`, `$BAR}` or `${BAR!}`. References in single-quoted values and escaped ones are
 * ignored. The fix wraps a name in braces where that is enough, keeping every other character of
 * the value.
 */
class SubstitutionKeyRule extends LineRule<'incorrect'> {
  /** Creates the rule. */
  public constructor() {
    super({
      name: 'substitution-key',
      description: 'Require variable references to be well formed.',
      type: 'problem',
      fixable: 'code',
      messages: { incorrect: 'The {{key}} key is not assigned properly' },
    });
  }

  /**
   * Reports an assignment with a malformed variable reference.
   * @param line The line to check.
   * @param text What can be read from the line.
   * @param reporter Reports the problems of the file.
   */
  protected check(
    line: LineNode,
    text: LineText,
    reporter: Reporter<'incorrect'>,
  ): void {
    const { key } = text;
    const value = text.value === undefined ? undefined : trim(text.value);

    if (
      value !== undefined &&
      !value.startsWith("'") &&
      this.isIncorrect(value)
    ) {
      reporter.report(
        line,
        'incorrect',
        { key },
        key === undefined ? null : text.assign(key, this.repair(value)),
      );
    }
  }

  /**
   * Splits the text after a `$` at the next `$`, so the reference being read is kept apart from
   * the references that follow.
   * @param afterDollar The text after a `$`.
   * @returns The text up to the next `$`, and the rest starting at it.
   */
  private split(afterDollar: string): { reference: string; rest: string } {
    const next = afterDollar.indexOf('$');

    return next === -1
      ? { reference: afterDollar, rest: '' }
      : {
          reference: afterDollar.slice(0, next),
          rest: afterDollar.slice(next),
        };
  }

  /**
   * Tells whether a value refers to a variable in a wrong way: with only one brace, or with a name
   * that has invalid characters.
   * @param value The value to inspect, without surrounding whitespace.
   * @returns `true` when a reference is wrong.
   */
  private isIncorrect(value: string): boolean {
    const dollar = value.indexOf('$');

    if (dollar === -1) {
      return false;
    }

    const { reference, rest } = this.split(value.slice(dollar + 1));
    const closing = reference.indexOf('}');
    const hasStart = reference.startsWith('{');
    const hasEnd = closing !== -1;
    const invalidName =
      hasStart && hasEnd && !NAME.test(reference.slice(1, closing));
    const incorrect = hasStart !== hasEnd || invalidName;

    return (
      (incorrect && !isEscaped(value.slice(0, dollar))) ||
      this.isIncorrect(rest)
    );
  }

  /**
   * Rewrites the variable references of a value so each one is wrapped in balanced braces.
   * @param value The value to repair, without surrounding whitespace.
   * @returns The repaired value.
   */
  private repair(value: string): string {
    const dollar = value.indexOf('$');

    if (dollar === -1) {
      return value;
    }

    const prefix = value.slice(0, dollar);
    const afterDollar = value.slice(dollar + 1);
    const closing = afterDollar.indexOf('}');

    if (afterDollar.startsWith('{') && closing !== -1) {
      const braced = afterDollar.slice(0, closing + 1);

      return `${prefix}$${braced}${this.repair(afterDollar.slice(closing + 1))}`;
    }

    const { reference, rest } = this.split(afterDollar);
    const stripped = reference.startsWith('{') ? reference.slice(1) : reference;
    const invalid = stripped.search(NON_NAME_CHARACTER);
    const nameEnd = invalid === -1 ? stripped.length : invalid;

    if (isEscaped(prefix) || nameEnd === 0) {
      return `${prefix}$${stripped}${this.repair(rest)}`;
    }

    const afterName = stripped.slice(nameEnd);
    const closer = afterName.startsWith('}') ? '' : '}';

    return `${prefix}\${${stripped.slice(0, nameEnd)}${closer}${afterName}${this.repair(rest)}`;
  }
}

const rule: DotenvRule<'incorrect'> = new SubstitutionKeyRule();

export default rule;
