/**
 * @file The dotenv-linter schema: which keys a file may or must have, and what their values look
 * like. The format is the one dotenv-linter reads with its `--schema` option.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  BooleanValidator,
  EmailValidator,
  FloatValidator,
  IntegerValidator,
  PatternValidator,
  UrlValidator,
} from './validators.js';
import type { ValueValidator } from './validators.js';

/** The types a value can be required to have. */
export type SchemaValueType =
  'String' | 'Integer' | 'Float' | 'Boolean' | 'Url' | 'Email';

/** The rules of one key, as written in a schema file. */
export interface RawSchemaEntry {
  /** The key the entry is about, which dotenv-linter does not read. */
  readonly key?: string;
  /** Whether the key must appear in the file. */
  readonly required?: boolean;
  /** The type of the value, `String` when it is missing. */
  readonly type?: string;
  /** A pattern a `String` value must match somewhere. */
  readonly regex?: string;
}

/** The schema as written in its JSON file. */
export interface RawSchema {
  /** The version of the schema format. */
  readonly version: string;
  /** Whether keys that the schema does not list are accepted. */
  readonly allow_other_keys?: boolean;
  /** The rules of each key. */
  readonly entries: Readonly<Record<string, RawSchemaEntry>>;
}

/** What to validate against: a path to a schema file, or the schema itself. */
export type SchemaInput = string | RawSchema;

/** The class that checks the values of each type, by type. */
const VALIDATORS: Readonly<
  Record<SchemaValueType, new (pattern: RegExp | undefined) => ValueValidator>
> = {
  String: PatternValidator,
  Integer: IntegerValidator,
  Float: FloatValidator,
  Boolean: BooleanValidator,
  Url: UrlValidator,
  Email: EmailValidator,
};

/**
 * The rules of one key of a schema.
 * @example
 * ```ts
 * const entry = SchemaEntry.fromRaw('PORT', { type: 'Integer' });
 * entry.check('abc'); // 'Integer'
 * ```
 */
export class SchemaEntry {
  /**
   * Creates an entry.
   * @param required Whether the key must appear in the file.
   * @param type The type of the value.
   * @param validator The check that the value is of that type.
   */
  public constructor(
    public readonly required: boolean,
    public readonly type: SchemaValueType,
    private readonly validator: ValueValidator,
  ) {}

  /**
   * Reads an entry of a schema file.
   * @param key The key the entry is about.
   * @param raw The entry as written.
   * @returns The entry.
   * @throws {TypeError} When the type is not one of the known types.
   */
  public static fromRaw(key: string, raw: RawSchemaEntry): SchemaEntry {
    const type = raw.type ?? 'String';

    if (!Object.hasOwn(VALIDATORS, type)) {
      throw new TypeError(
        `The schema entry ${key} has an unknown type: ${type}.`,
      );
    }

    const valueType = type as SchemaValueType;
    const pattern =
      raw.regex === undefined ? undefined : new RegExp(raw.regex, 'u');

    return new SchemaEntry(
      raw.required ?? false,
      valueType,
      new VALIDATORS[valueType](pattern),
    );
  }

  /**
   * Checks a value against the type of the key.
   * @param value The value, exactly as written after the `=`.
   * @returns The type the value failed to match, or `undefined` when it is valid.
   */
  public check(value: string): SchemaValueType | undefined {
    return this.validator.isValid(value) ? undefined : this.type;
  }
}

/**
 * A schema, ready to validate a file.
 * @example
 * ```ts
 * const schema = DotenvSchema.load('dotenv.schema.json', process.cwd());
 * schema.entries.get('PORT')?.check('abc'); // 'Integer'
 * ```
 */
export class DotenvSchema {
  /**
   * Creates a schema.
   * @param allowOtherKeys Whether keys that the schema does not list are accepted.
   * @param entries The rules of each listed key, in the order the schema lists them.
   */
  public constructor(
    public readonly allowOtherKeys: boolean,
    public readonly entries: ReadonlyMap<string, SchemaEntry>,
  ) {}

  /**
   * Builds a schema from the JSON of a schema file.
   * @param raw The parsed JSON.
   * @returns The schema.
   * @throws {TypeError} When the JSON is not a valid schema.
   */
  public static fromRaw(raw: RawSchema): DotenvSchema {
    if (typeof raw.version !== 'string' || typeof raw.entries !== 'object') {
      throw new TypeError(
        'The schema must have a "version" string and an "entries" object.',
      );
    }

    return new DotenvSchema(
      raw.allow_other_keys ?? false,
      new Map(
        Object.entries(raw.entries).map(([key, entry]) => [
          key,
          SchemaEntry.fromRaw(key, entry),
        ]),
      ),
    );
  }

  /**
   * Loads a schema from the option of a rule.
   * @param input A path to a schema file, or the schema itself.
   * @param cwd The directory a relative path is resolved against.
   * @returns The schema.
   * @throws {Error} When the file cannot be read or is not a valid schema.
   */
  public static load(input: SchemaInput, cwd: string): DotenvSchema {
    if (typeof input !== 'string') {
      return DotenvSchema.fromRaw(input);
    }

    // eslint-disable-next-line n/no-sync -- ESLint creates a rule synchronously, so the schema file has to be read synchronously
    const content = readFileSync(path.resolve(cwd, input), 'utf8');

    return DotenvSchema.fromRaw(JSON.parse(content) as RawSchema);
  }
}
