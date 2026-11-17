/**
 * @file The base classes of the rules of this plugin, which hold what every rule has in common:
 * its metadata, its documentation and the way it is attached to the lines of a file.
 */
import type {
  RuleContext,
  RuleFixType,
  RulesMeta,
  RuleType,
  RuleVisitor,
} from '@eslint/core';
import { LineText } from '../language/line-text.js';
import type { DotenvSourceCode } from '../language/source-code.js';
import type {
  DotenvLanguageOptions,
  DotenvNode,
  LineNode,
  ProgramNode,
} from '../language/types.js';
import { Reporter } from './reporter.js';
import type { DotenvRule, DotenvRuleDocumentation } from './types.js';

/** The page that documents the rules. */
const DOCUMENTATION = 'https://github.com/mridang/eslint-plugin-dotenv';

/**
 * What the context of a rule looks like.
 * @template MessageId The ids of the messages the rule reports.
 * @template Options The options the rule takes.
 */
export type DotenvRuleContext<
  MessageId extends string,
  Options extends unknown[],
> = RuleContext<{
  LangOptions: DotenvLanguageOptions;
  Code: DotenvSourceCode;
  RuleOptions: Options;
  Node: DotenvNode;
  MessageIds: MessageId;
}>;

/**
 * How a rule describes itself.
 * @template MessageId The ids of the messages the rule reports.
 * @template Options The options the rule takes.
 */
export interface RuleDescription<
  MessageId extends string,
  Options extends unknown[] = [],
> {
  /** The name of the rule, such as `duplicated-key`; it is also the anchor of its documentation. */
  readonly name: string;
  /** What the rule checks, in one sentence. */
  readonly description: string;
  /** The kind of problem the rule finds. */
  readonly type: RuleType;
  /** The kind of fix the rule offers, when it offers one. */
  readonly fixable?: RuleFixType;
  /** The messages the rule reports, by id. */
  readonly messages: Readonly<Record<MessageId, string>>;
  /** The JSON schema of the options of the rule, when it takes any. */
  readonly schema?: RulesMeta['schema'];
  /** The options used when none are given. */
  readonly defaultOptions?: Options;
}

/**
 * A rule of this plugin. It builds its metadata and documentation from a description, and leaves
 * the visitor to the classes that extend it.
 * @template MessageId The ids of the messages the rule reports.
 * @template Options The options the rule takes.
 */
export abstract class DotenvLintRule<
  MessageId extends string,
  Options extends unknown[] = [],
> implements DotenvRule<MessageId, Options> {
  /** What ESLint needs to know about the rule. */
  public readonly meta: RulesMeta<MessageId, Options, DotenvRuleDocumentation>;

  /**
   * Creates a rule.
   * @param description How the rule describes itself.
   */
  protected constructor(description: RuleDescription<MessageId, Options>) {
    this.meta = {
      type: description.type,
      docs: {
        description: description.description,
        recommended: true,
        url: `${DOCUMENTATION}#${description.name}`,
      },
      fixable: description.fixable,
      schema: description.schema ?? [],
      defaultOptions: description.defaultOptions,
      messages: description.messages,
    };
  }

  /**
   * Starts checking a file. ESLint calls this once for each file.
   * @param context What the rule gets from ESLint.
   * @returns The visitor that ESLint calls for the nodes of the file.
   */
  public create(context: DotenvRuleContext<MessageId, Options>): RuleVisitor {
    return this.createVisitor(new Reporter(context), context);
  }

  /**
   * Builds the visitor of a file.
   * @param reporter Reports the problems of the file.
   * @param context What the rule gets from ESLint.
   * @returns The visitor.
   */
  protected abstract createVisitor(
    reporter: Reporter<MessageId>,
    context: DotenvRuleContext<MessageId, Options>,
  ): RuleVisitor;
}

/**
 * A rule that looks at one line at a time. It checks the lines of the types it names, which are
 * assignments unless the rule says otherwise.
 * @template MessageId The ids of the messages the rule reports.
 */
export abstract class LineRule<
  MessageId extends string,
> extends DotenvLintRule<MessageId> {
  /** The types of line the rule checks. */
  protected readonly lineTypes: readonly LineNode['type'][] = ['Entry'];

  /**
   * Checks one line.
   * @param line The line to check.
   * @param text What can be read from the line.
   * @param reporter Reports the problems of the file.
   */
  protected abstract check(
    line: LineNode,
    text: LineText,
    reporter: Reporter<MessageId>,
  ): void;

  /**
   * Builds a visitor that checks every line of the types the rule names.
   * @param reporter Reports the problems of the file.
   * @returns The visitor.
   */
  protected createVisitor(reporter: Reporter<MessageId>): RuleVisitor {
    return Object.fromEntries(
      this.lineTypes.map((type) => [
        type,
        (line: LineNode): void => {
          this.check(line, new LineText(line.raw), reporter);
        },
      ]),
    );
  }
}

/**
 * A rule that looks at the whole file, because what it reports depends on the lines around a line.
 * @template MessageId The ids of the messages the rule reports.
 * @template Options The options the rule takes.
 */
export abstract class ProgramRule<
  MessageId extends string,
  Options extends unknown[] = [],
> extends DotenvLintRule<MessageId, Options> {
  /**
   * Checks the whole file.
   * @param program The lines of the file.
   * @param reporter Reports the problems of the file.
   * @param context What the rule gets from ESLint.
   */
  protected abstract check(
    program: ProgramNode,
    reporter: Reporter<MessageId>,
    context: DotenvRuleContext<MessageId, Options>,
  ): void;

  /**
   * Builds a visitor that checks the file when ESLint reaches its root.
   * @param reporter Reports the problems of the file.
   * @param context What the rule gets from ESLint.
   * @returns The visitor.
   */
  protected createVisitor(
    reporter: Reporter<MessageId>,
    context: DotenvRuleContext<MessageId, Options>,
  ): RuleVisitor {
    return Object.fromEntries([
      [
        'Program',
        (program: ProgramNode): void => {
          this.check(program, reporter, context);
        },
      ],
    ]);
  }
}
