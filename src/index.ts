/**
 * @file The entry point of the plugin: the dotenv language, its rules and a recommended
 * configuration.
 */
import { createRequire } from 'node:module';
import { DotenvLanguage } from './language/language.js';
import { rules } from './rules/index.js';

/** The package metadata, read so the plugin reports its own name and version. */
const packageJson: unknown = createRequire(import.meta.url)('../package.json');

const meta: Record<string, unknown> =
  typeof packageJson === 'object' && packageJson !== null
    ? Object.fromEntries(Object.entries(packageJson))
    : {};

const { name, version } = meta;

if (typeof name !== 'string' || typeof version !== 'string') {
  throw new TypeError('The package.json of this plugin has no name or version');
}

/** The name of the language, as a configuration refers to it. */
const LANGUAGE = 'dotenv/dotenv';

/** The rules of the recommended configuration, all switched on as errors. */
const recommendedRules = Object.fromEntries(
  Object.keys(rules).map((rule) => [`dotenv/${rule}`, 'error'] as const),
);

/** The plugin object ESLint loads. */
const plugin = {
  meta: { name, version },
  languages: { dotenv: new DotenvLanguage() },
  rules,
  configs: {} as Record<string, unknown>,
};

// eslint-disable-next-line functional/immutable-data -- the config refers to the plugin object, so it can only be added once the plugin exists
plugin.configs.recommended = [
  {
    name: 'dotenv/recommended',
    files: ['**/.env*', '**/*.env'],
    ignores: ['**/.envrc', '**/*.bak'],
    plugins: { dotenv: plugin },
    language: LANGUAGE,
    rules: recommendedRules,
  },
];

export default plugin;
export { DotenvLanguage } from './language/language.js';
export { rules } from './rules/index.js';
export type {
  BlankNode,
  CommentNode,
  DotenvNode,
  EntryNode,
  LineBase,
  LineNode,
  Position,
  ProgramNode,
  SourceLocation,
  SourceRange,
} from './language/types.js';
export type { SchemaViolationOptions } from './rules/schema-violation.js';
export { DotenvLintRule, LineRule, ProgramRule } from './rules/dotenv-rule.js';
export type { RuleDescription } from './rules/dotenv-rule.js';
export { Reporter } from './rules/reporter.js';
