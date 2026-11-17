/**
 * @file A rule tester that lints text with the dotenv language.
 */
import { RuleTester } from 'eslint';
import plugin from '../../src/index.js';
import type { DotenvRule } from '../../src/rules/types.js';

/**
 * The plugin as ESLint's configuration types accept it. ESLint types the rules of a plugin for the
 * JavaScript language, and the rules of this plugin are typed for the dotenv language, so the two
 * types never match; at run time ESLint calls each rule with the dotenv context it was written for.
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ESLint types a plugin's rules for the JavaScript language, and the rules of this plugin are typed for the dotenv language
export const eslintPlugin = plugin as never;

/** The recommended configuration of the plugin, as ESLint's configuration types accept it. */
// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- the configuration refers to the plugin, whose rules ESLint types for the JavaScript language, and the plugin object types its configurations as unknown
export const recommendedConfig = plugin.configs.recommended as never;

/** The tests of one rule, as ESLint's rule tester reads them. */
type RuleTests = Parameters<RuleTester['run']>[2];

/** ESLint's rule tester, set up to read its code as a dotenv file. */
const tester = new RuleTester({
  plugins: { dotenv: eslintPlugin },
  language: 'dotenv/dotenv',
});

/** The rule tester every rule test uses. */
export const ruleTester = {
  /**
   * Runs the tests of a rule.
   * @param name The name of the rule.
   * @param rule The rule.
   * @param tests The code the rule must accept and the code it must report.
   */
  run<MessageIds extends string, Options extends unknown[]>(
    name: string,
    rule: DotenvRule<MessageIds, Options>,
    tests: RuleTests,
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ESLint's rule tester types a rule for the JavaScript language, and a dotenv rule is typed for the dotenv language
    tester.run(name, rule as never, tests);
  },
};
