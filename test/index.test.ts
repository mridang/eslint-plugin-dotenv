/**
 * @file Tests for the plugin object and its recommended configuration.
 */
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from '@jest/globals';
import { ESLint } from 'eslint';
import plugin, { DotenvLanguage, rules } from '../src/index.js';

/** Matches a semantic version at the start of a string. */
const VERSION = /^\d+\.\d+\.\d+/u;

/** The names of every rule the plugin must provide. */
const RULE_NAMES = [
  'duplicated-key',
  'ending-blank-line',
  'extra-blank-line',
  'incorrect-delimiter',
  'key-without-value',
  'leading-character',
  'lowercase-key',
  'quote-character',
  'schema-violation',
  'space-character',
  'substitution-key',
  'trailing-whitespace',
  'unordered-key',
  'value-without-quotes',
];

/**
 * Finds out whether the recommended configuration applies to a file name.
 * @param fileName The name of the file.
 * @returns `true` when the dotenv language is used for the file.
 */
async function appliesTo(fileName: string): Promise<boolean> {
  const cwd = await mkdtemp(path.join(tmpdir(), 'dotenv-config-'));
  const eslint = new ESLint({
    cwd,
    overrideConfigFile: true,
    overrideConfig: plugin.configs.recommended as never,
  });
  const config = (await eslint.calculateConfigForFile(
    path.join(cwd, 'config', fileName),
  )) as { language?: string } | undefined;

  return config?.language instanceof DotenvLanguage;
}

/** Compares names alphabetically. */
const NAME_COLLATOR = new Intl.Collator('en', {
  numeric: true,
  sensitivity: 'base',
});

describe('plugin', () => {
  it('names itself after the package', () => {
    expect(plugin.meta.name).toBe('@mridang/eslint-plugin-dotenv');
    expect(plugin.meta.version).toMatch(VERSION);
  });

  it('provides the dotenv language', () => {
    expect(plugin.languages.dotenv).toBeInstanceOf(DotenvLanguage);
  });

  it('provides every rule, each documented and recommended', () => {
    expect(Object.keys(rules).toSorted(NAME_COLLATOR.compare)).toEqual(
      RULE_NAMES,
    );
    expect(plugin.rules).toBe(rules);

    for (const [name, rule] of Object.entries(rules)) {
      expect(rule.meta?.docs?.description).toEqual(expect.any(String));
      expect(rule.meta?.docs?.recommended).toBe(true);
      expect(rule.meta?.docs?.url).toContain(name);
      expect(rule.meta?.messages).toBeDefined();
    }
  });

  it('marks the rules that fix as fixable', () => {
    const fixable = Object.entries(rules)
      .filter(([, rule]) => rule.meta?.fixable !== undefined)
      .map(([name]) => name)
      .toSorted(NAME_COLLATOR.compare);

    expect(fixable).toEqual(
      RULE_NAMES.filter((name) => name !== 'schema-violation'),
    );
  });
});

describe('recommended configuration', () => {
  it('switches on every rule as an error', () => {
    const [config] = plugin.configs.recommended as {
      rules: Record<string, string>;
      language: string;
    }[];

    expect(config?.language).toBe('dotenv/dotenv');
    expect(config?.rules).toEqual(
      Object.fromEntries(RULE_NAMES.map((name) => [`dotenv/${name}`, 'error'])),
    );
  });

  it.each([
    '.env',
    'foo.env',
    '.env.foo',
    '.env.foo.common',
    '.env.local',
    'production.env',
  ])('applies to %s', async (fileName) => {
    await expect(appliesTo(fileName)).resolves.toBe(true);
  });

  it.each([
    'env',
    'env.foo',
    'foo_env',
    'foo-env',
    '.my-env-file',
    'dev.env.js',
    '.env.bak',
    '.envrc',
    'index.ts',
  ])('does not apply to %s', async (fileName) => {
    await expect(appliesTo(fileName)).resolves.toBe(false);
  });
});
