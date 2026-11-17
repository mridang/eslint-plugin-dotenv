/**
 * @file The text of one line of a dotenv file, and what can be read from it.
 */
import { isBlank, isEscaped, trim } from './text.js';

/** The keyword that turns an assignment into a shell export. */
const EXPORT_KEYWORD = 'export ';

/** Matches the first character that can start a key. */
const KEY_START = /[\p{Alphabetic}_]/u;

/** Matches the characters a variable name starts with, up to the first character that cannot be in one. */
const NAME_START = /^\w*/u;

/** The words that start a comment holding an ESLint directive or inline configuration. */
const DIRECTIVES: ReadonlySet<string> = new Set([
  'eslint',
  'eslint-enable',
  'eslint-disable',
  'eslint-disable-line',
  'eslint-disable-next-line',
]);

/** Matches whitespace. */
const WHITESPACE = /\s/u;

/**
 * The text of one line of a dotenv file, read the way dotenv-linter reads it. An instance never
 * changes: everything is worked out from the text when it is created.
 * @example
 * ```ts
 * const line = new LineText('export FOO=${BAR}');
 * line.key; // 'FOO'
 * line.value; // '${BAR}'
 * line.substitutionKeys; // ['BAR']
 * ```
 */
export class LineText {
  /** The text of the line, exactly as written. */
  public readonly raw: string;

  /** Whether the line holds only whitespace. */
  public readonly isEmpty: boolean;

  /** Whether the first character that is not whitespace is `#`. */
  public readonly isComment: boolean;

  /** Whether the line is neither empty nor a comment, so it should hold an assignment. */
  public readonly isAssignment: boolean;

  /** The `export ` keyword when the assignment starts with it, otherwise an empty string. */
  public readonly exportPrefix: string;

  /**
   * The text before the first `=`, without the surrounding whitespace of the line or an `export `
   * keyword. Whitespace between the key and the `=` is kept. It is `undefined` for a line that is
   * not an assignment.
   */
  public readonly key: string | undefined;

  /**
   * The text after the first `=`, exactly as written. It is `undefined` for a line that is not an
   * assignment or has no `=`.
   */
  public readonly value: string | undefined;

  /**
   * Reads a line.
   * @param raw The text of the line.
   */
  public constructor(raw: string) {
    const trimmed = trim(raw);
    const exported = trimmed.startsWith(EXPORT_KEYWORD);
    const equalSign = raw.indexOf('=');

    this.raw = raw;
    this.isEmpty = isBlank(raw);
    this.isComment = trimmed.startsWith('#');
    this.isAssignment = !this.isEmpty && !this.isComment;
    this.exportPrefix = exported ? EXPORT_KEYWORD : '';
    const stripped = exported
      ? trim(trimmed.slice(EXPORT_KEYWORD.length))
      : trimmed;

    this.key = this.isAssignment ? stripped.split('=', 1)[0] : undefined;
    this.value =
      this.isAssignment && equalSign !== -1
        ? raw.slice(equalSign + 1)
        : undefined;
  }

  /**
   * Whether the line is a comment that holds an ESLint directive, such as
   * `# eslint-disable-next-line dotenv/lowercase-key`.
   * @returns `true` for a directive comment.
   */
  public get isDirective(): boolean {
    const [word = ''] = trim(trim(this.raw).slice(1)).split(WHITESPACE, 1);

    return this.isComment && DIRECTIVES.has(word);
  }

  /**
   * The key without the leading characters that cannot start a key: everything before the first
   * letter or underscore.
   * @returns The cleaned key, or `undefined` for a line that is not an assignment.
   * @example
   * ```ts
   * new LineText('-1&*FOO=BAR').cleanedKey; // 'FOO'
   * ```
   */
  public get cleanedKey(): string | undefined {
    if (this.key === undefined) {
      return undefined;
    }

    const start = this.key.search(KEY_START);

    return start === -1 ? '' : this.key.slice(start);
  }

  /**
   * The names of the variables the value refers to with `$NAME` or `${NAME}`, in order. A
   * single-quoted value refers to nothing, a double-quoted one is read without its quotes, and
   * reading stops at the first reference that has no name.
   * @returns The names of the referenced variables.
   * @example
   * ```ts
   * new LineText('FOO=${BAR}$BAZ').substitutionKeys; // ['BAR', 'BAZ']
   * ```
   */
  public get substitutionKeys(): readonly string[] {
    const value = this.value === undefined ? undefined : trim(this.value);

    if (value === undefined || value.startsWith("'")) {
      return [];
    }

    if (!value.startsWith('"')) {
      return LineText.collect(value);
    }

    const closes =
      value.length > 1 && value.endsWith('"') && !isEscaped(value.slice(0, -1));

    return closes ? LineText.collect(value.slice(1, -1)) : [];
  }

  /**
   * Builds the text of an assignment that keeps the `export ` keyword of this line.
   * @param key The key to write.
   * @param value The value to write.
   * @returns The text `key=value`, with `export ` in front when this line has it.
   * @example
   * ```ts
   * new LineText('export foo=bar').assign('FOO', 'bar'); // 'export FOO=bar'
   * ```
   */
  public assign(key: string, value: string): string {
    return `${this.exportPrefix}${key}=${value}`;
  }

  /**
   * Collects the names of the unescaped variable references of a value.
   * @param value The value to scan.
   * @returns The referenced names, ending at the first reference without a name.
   */
  private static collect(value: string): readonly string[] {
    const dollar = value.indexOf('$');

    if (dollar === -1) {
      return [];
    }

    const afterDollar = value.slice(dollar + 1);

    if (isEscaped(value.slice(0, dollar))) {
      return LineText.collect(afterDollar);
    }

    const close = afterDollar.startsWith('{') ? afterDollar.indexOf('}') : -1;
    const name =
      close === -1
        ? (NAME_START.exec(afterDollar)?.[0] ?? '')
        : afterDollar.slice(1, close);
    const remaining = afterDollar.slice(close === -1 ? name.length : close);

    return name === '' ? [] : [name, ...LineText.collect(remaining)];
  }
}
