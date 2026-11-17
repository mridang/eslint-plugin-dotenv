/**
 * @file Reports the problems of a rule, with the fix that goes with each.
 */
import type {
  MessagePlaceholderData,
  RuleFixer,
  ViolationReport,
} from '@eslint/core';
import type { DotenvSourceCode } from '../language/source-code.js';
import type {
  DotenvNode,
  LineNode,
  SourceLocation,
} from '../language/types.js';

/** What a rule needs from ESLint to report a problem. */
export interface ReportingContext<MessageId extends string> {
  /** The source code of the file being linted. */
  readonly sourceCode: DotenvSourceCode;
  /**
   * Reports a problem.
   * @param violation The problem to report.
   */
  report(violation: ViolationReport<DotenvNode, MessageId>): void;
}

/**
 * How to fix a problem: the new text of the line, a function that edits the file, or nothing when
 * the problem has no fix.
 */
export type Fix = string | RuleFixer | null;

/**
 * Reports the problems of one rule in one file. A reported line gets the fix that replaces its text,
 * and a replacement that would not change the line gets no fix at all.
 * @template MessageId The ids of the messages the rule reports.
 * @example
 * ```ts
 * const reporter = new Reporter(context);
 * reporter.report(line, 'lowercase', { key: 'foo' }, 'FOO=bar');
 * ```
 */
export class Reporter<MessageId extends string> {
  /**
   * Creates a reporter.
   * @param context What the rule gets from ESLint.
   */
  public constructor(private readonly context: ReportingContext<MessageId>) {}

  /** The text of the file being linted. */
  public get text(): string {
    return this.context.sourceCode.text;
  }

  /**
   * Reports a problem on the first physical line of a line.
   * @param line The line the problem is on.
   * @param messageId The id of the message to report.
   * @param data The values to put in the message.
   * @param fix The new text of the line, a function that edits the file, or `null` for no fix.
   */
  public report(
    line: LineNode,
    messageId: MessageId,
    data?: MessagePlaceholderData,
    fix: Fix = null,
  ): void {
    this.context.report({
      loc: line.head,
      messageId,
      data,
      fix: typeof fix === 'string' ? this.replacement(line, fix) : fix,
    });
  }

  /**
   * Reports a problem at a place that is not a line, such as the end of the file.
   * @param loc The location of the problem.
   * @param messageId The id of the message to report.
   * @param data The values to put in the message.
   */
  public reportAt(
    loc: SourceLocation,
    messageId: MessageId,
    data?: MessagePlaceholderData,
  ): void {
    this.context.report({ loc, messageId, data });
  }

  /**
   * Builds the fix that replaces the text of a line, keeping the Windows line breaks inside a
   * multi-line value.
   * @param line The line to replace.
   * @param replacement The new text, with `\n` between physical lines.
   * @returns The fix, or `null` when the text would not change.
   */
  private replacement(line: LineNode, replacement: string): RuleFixer | null {
    const original = this.text.slice(...line.range);
    const text = original.includes('\r\n')
      ? replacement.replaceAll('\n', '\r\n')
      : replacement;

    return text === original
      ? null
      : (fixer) => fixer.replaceTextRange(line.range, text);
  }
}
