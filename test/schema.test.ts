/**
 * @file Tests for loading and checking schemas.
 */
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from '@jest/globals';
import { DotenvSchema, SchemaEntry } from '../src/schema.js';

/** Matches the error Node gives for a file that does not exist. */
const MISSING_FILE = /ENOENT/u;

/**
 * Writes a schema file in a new directory.
 * @param content The text of the file.
 * @returns The directory and the name of the file.
 */
async function schemaFile(
  content: string,
): Promise<{ directory: string; name: string }> {
  const directory = await mkdtemp(path.join(tmpdir(), 'dotenv-schema-'));

  await writeFile(path.join(directory, 'schema.json'), content);

  return { directory, name: 'schema.json' };
}

describe('SchemaEntry', () => {
  it('reads the rules of a key', () => {
    const entry = SchemaEntry.fromRaw('PORT', {
      type: 'Integer',
      required: true,
    });

    expect(entry.required).toBe(true);
    expect(entry.type).toBe('Integer');
  });

  it('defaults to an optional string', () => {
    const entry = SchemaEntry.fromRaw('ANY', {});

    expect(entry.required).toBe(false);
    expect(entry.type).toBe('String');
    expect(entry.check('anything')).toBeUndefined();
  });

  it('checks a string against its pattern', () => {
    const entry = SchemaEntry.fromRaw('NAME', { regex: '^[A-Z]+$' });

    expect(entry.check('ABC')).toBeUndefined();
    expect(entry.check('abc')).toBe('String');
  });

  it.each([
    ['Integer', 'abc'],
    ['Float', 'abc'],
    ['Boolean', 'maybe'],
    ['Url', 'not a url'],
    ['Email', 'nobody'],
  ])('names the type %s that a value failed to match', (type, value) => {
    expect(SchemaEntry.fromRaw('KEY', { type }).check(value)).toBe(type);
  });

  it('rejects an unknown type', () => {
    expect(() => SchemaEntry.fromRaw('A', { type: 'Date' })).toThrow(
      'The schema entry A has an unknown type: Date.',
    );
  });

  it('rejects a pattern that is not a regular expression', () => {
    expect(() => SchemaEntry.fromRaw('A', { regex: '(' })).toThrow();
  });
});

describe('DotenvSchema', () => {
  it('reads every kind of entry, in order', () => {
    const schema = DotenvSchema.fromRaw({
      version: '1.0.0',
      allow_other_keys: true,
      entries: { NAME: { regex: '^A' }, PORT: { type: 'Integer' }, ANY: {} },
    });

    expect(schema.allowOtherKeys).toBe(true);
    expect([...schema.entries.keys()]).toEqual(['NAME', 'PORT', 'ANY']);
  });

  it('refuses other keys unless told otherwise', () => {
    expect(
      DotenvSchema.fromRaw({ version: '1', entries: {} }).allowOtherKeys,
    ).toBe(false);
  });

  it('rejects a schema without a version or entries', () => {
    const message = '"version" string and an "entries" object';

    expect(() => DotenvSchema.fromRaw({ entries: {} } as never)).toThrow(
      message,
    );
    expect(() => DotenvSchema.fromRaw({ version: '1' } as never)).toThrow(
      message,
    );
  });

  it('loads a schema given as an object', () => {
    expect(
      DotenvSchema.load({ version: '1', entries: {} }, '/').entries.size,
    ).toBe(0);
  });

  it('loads a file, relative to the working directory', async () => {
    const { directory, name } = await schemaFile(
      JSON.stringify({ version: '1', entries: { A: {} } }),
    );

    expect([...DotenvSchema.load(name, directory).entries.keys()]).toEqual([
      'A',
    ]);
  });

  it('fails for a file that does not exist', () => {
    expect(() => DotenvSchema.load('missing.json', tmpdir())).toThrow(
      MISSING_FILE,
    );
  });

  it('fails for a file that is not JSON', async () => {
    const { directory, name } = await schemaFile('{ bad_json }');

    expect(() => DotenvSchema.load(name, directory)).toThrow(SyntaxError);
  });
});
