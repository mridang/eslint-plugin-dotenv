/**
 * @file The types shared by the rules of this plugin.
 */
import type { RuleDefinition, RuleVisitor } from '@eslint/core';
import type { DotenvSourceCode } from '../language/source-code.js';
import type { DotenvLanguageOptions, DotenvNode } from '../language/types.js';

/** What the documentation of a rule says, beyond what ESLint knows. */
export interface DotenvRuleDocumentation {
  /** Whether the rule is part of the recommended configuration. */
  readonly recommended: boolean;
}

/**
 * A rule that lints dotenv files.
 * @template MessageIds The ids of the messages the rule reports.
 * @template Options The options the rule takes.
 */
export type DotenvRule<
  MessageIds extends string,
  Options extends unknown[] = [],
> = RuleDefinition<{
  LangOptions: DotenvLanguageOptions;
  Code: DotenvSourceCode;
  RuleOptions: Options;
  Visitor: RuleVisitor;
  Node: DotenvNode;
  MessageIds: MessageIds;
  ExtRuleDocs: DotenvRuleDocumentation;
}>;
