/**
 * @file Tests for the dotenv language.
 */
import { describe, expect, it } from '@jest/globals';
import { DotenvLanguage } from '../../src/language/language.js';
import { DotenvSourceCode } from '../../src/language/source-code.js';
import type { File } from '@eslint/core';

const language = new DotenvLanguage();

/**
 * Wraps text as the file ESLint passes to a language.
 * @param body The text of the file.
 * @returns The file.
 */
function fileOf(body: string): File {
  return { path: '.env', physicalPath: '.env', bom: false, body };
}

describe('DotenvLanguage', () => {
  it('describes how ESLint should read its trees', () => {
    expect(language.fileType).toBe('text');
    expect(language.lineStart).toBe(1);
    expect(language.columnStart).toBe(1);
    expect(language.nodeTypeKey).toBe('type');
    expect(language.visitorKeys).toEqual({
      Program: ['body'],
      Entry: [],
      Comment: [],
      Blank: [],
    });
  });

  it('accepts empty language options', () => {
    expect(() => {
      language.validateLanguageOptions({});
    }).not.toThrow();
  });

  it('rejects language options, because it has none', () => {
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- the test passes an option the type forbids on purpose, to prove the language refuses it at run time
      language.validateLanguageOptions({ sourceType: 'module' } as never);
    }).toThrow('The dotenv language has no options, but got: sourceType.');
  });

  it('parses any text', () => {
    const result = language.parse(fileOf('FOO=BAR\n'));

    expect(result.ok).toBe(true);
    expect(result.ok && result.ast.body.map((line) => line.type)).toEqual([
      'Entry',
      'Blank',
    ]);
  });

  it('builds the source code from a parse result', () => {
    const file = fileOf('FOO=BAR\n');
    const result = language.parse(file);
    const sourceCode = result.ok
      ? language.createSourceCode(file, result)
      : undefined;

    expect(sourceCode).toBeInstanceOf(DotenvSourceCode);
    expect(sourceCode?.text).toBe('FOO=BAR\n');
  });
});
