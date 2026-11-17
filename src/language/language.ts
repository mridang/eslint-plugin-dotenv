/**
 * @file The dotenv language, which teaches ESLint to read `.env` files.
 */
import { DotenvParser } from './parser.js';
import { DotenvSourceCode } from './source-code.js';
import type { File, Language, OkParseResult, ParseResult } from '@eslint/core';
import type {
  DotenvLanguageOptions,
  DotenvNode,
  ProgramNode,
} from './types.js';

/** The visitor keys of the tree: only the root has children. */
const VISITOR_KEYS = {
  Program: ['body'],
  Entry: [],
  Comment: [],
  Blank: [],
} satisfies Record<string, string[]>;

/**
 * Reads the text of a file, which ESLint may hand over as bytes.
 * @param file The file.
 * @returns The text.
 */
function bodyText(file: File): string {
  return typeof file.body === 'string'
    ? file.body
    : new TextDecoder().decode(file.body);
}

/**
 * The dotenv language: it parses the text of a `.env` file into lines and builds the source
 * code that rules inspect.
 */
export class DotenvLanguage implements Language<{
  LangOptions: DotenvLanguageOptions;
  Code: DotenvSourceCode;
  RootNode: ProgramNode;
  Node: DotenvNode;
}> {
  /** The parser that reads every file. */
  private readonly parser = new DotenvParser();

  /** The kind of file this language reads. */
  public readonly fileType = 'text';

  /** The number of the first line. */
  public readonly lineStart = 1;

  /** The number of the first column. */
  public readonly columnStart = 1;

  /** The property that holds the type of a node. */
  public readonly nodeTypeKey = 'type';

  /** The properties of each node type that hold child nodes. */
  public readonly visitorKeys = VISITOR_KEYS;

  /**
   * Checks the language options, which the dotenv language does not have.
   * @param languageOptions The options to check.
   * @example
   * ```ts
   * language.validateLanguageOptions({});
   * ```
   */
  public validateLanguageOptions(languageOptions: DotenvLanguageOptions): void {
    const unknown = Object.keys(languageOptions);

    if (unknown.length > 0) {
      throw new Error(
        `The dotenv language has no options, but got: ${unknown.join(', ')}.`,
      );
    }
  }

  /**
   * Reads a file. Any text is valid dotenv text, so parsing never fails.
   * @param file The file to read.
   * @returns The syntax tree.
   * @example
   * ```ts
   * const result = language.parse({ body: 'FOO=BAR\n' } as File);
   * ```
   */
  public parse(file: File): ParseResult<ProgramNode> {
    return { ok: true, ast: this.parser.parse(bodyText(file)) };
  }

  /**
   * Builds the source code of a file that was parsed.
   * @param file The file.
   * @param parseResult The result of parsing it.
   * @returns The source code.
   * @example
   * ```ts
   * const sourceCode = language.createSourceCode(file, language.parse(file));
   * ```
   */
  public createSourceCode(
    file: File,
    parseResult: OkParseResult<ProgramNode>,
  ): DotenvSourceCode {
    return new DotenvSourceCode({
      text: bodyText(file),
      ast: parseResult.ast,
    });
  }
}
