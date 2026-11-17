/**
 * @file Tests for the class that reads the parts of a dotenv line.
 */
import { describe, expect, it } from '@jest/globals';
import { LineText } from '../../src/language/line-text.js';

describe('line kinds', () => {
  it('knows an empty line', () => {
    const line = new LineText('  \t');

    expect(line.isEmpty).toBe(true);
    expect(line.isComment).toBe(false);
    expect(line.isAssignment).toBe(false);
  });

  it('knows a comment', () => {
    const line = new LineText('   # Comment');

    expect(line.isEmpty).toBe(false);
    expect(line.isComment).toBe(true);
    expect(line.isAssignment).toBe(false);
  });

  it('knows an assignment', () => {
    const line = new LineText('NotComment');

    expect(line.isEmpty).toBe(false);
    expect(line.isComment).toBe(false);
    expect(line.isAssignment).toBe(true);
  });
});

describe('key', () => {
  it.each([
    ['', undefined],
    ['# FOO=BAR', undefined],
    ['export FOO=BAR', 'FOO'],
    ['FOO=BAR', 'FOO'],
    ['FOO=', 'FOO'],
    ['FOOBAR', 'FOOBAR'],
    ['   FOO=BAR  ', 'FOO'],
    ['FOO =BAR', 'FOO '],
    ['export  FOO=BAR', 'FOO'],
    ['export\tFOO=BAR', 'export\tFOO'],
    ['exportFOO=BAR', 'exportFOO'],
    ['A=B=C', 'A'],
  ])('reads the key of %j as %j', (raw, expected) => {
    expect(new LineText(raw).key).toBe(expected);
  });
});

describe('value', () => {
  it.each([
    ['', undefined],
    ['# FOO=BAR', undefined],
    ['FOO=BAR', 'BAR'],
    ["FOO='BAR'", "'BAR'"],
    ['FOO="BAR"', '"BAR"'],
    ['=BAR', 'BAR'],
    ['FOO=', ''],
    ['FOOBAR', undefined],
    ['FOO= BAR ', ' BAR '],
    ['A=B=C', 'B=C'],
  ])('reads the value of %j as %j', (raw, expected) => {
    expect(new LineText(raw).value).toBe(expected);
  });
});

describe('exportPrefix and assign', () => {
  it('finds the keyword', () => {
    expect(new LineText('export FOO=BAR').exportPrefix).toBe('export ');
    expect(new LineText('  export FOO=BAR').exportPrefix).toBe('export ');
    expect(new LineText('FOO=BAR').exportPrefix).toBe('');
  });

  it('writes an assignment that keeps the keyword', () => {
    expect(new LineText('export foo=bar').assign('FOO', 'bar')).toBe(
      'export FOO=bar',
    );
    expect(new LineText('foo=bar').assign('FOO', 'bar')).toBe('FOO=bar');
  });
});

describe('cleanedKey', () => {
  it.each([
    ['-1&*FOO=1', 'FOO'],
    ['***FOO-BAR=1', 'FOO-BAR'],
    ['FOO=1', 'FOO'],
    ['_FOO=1', '_FOO'],
    ['123=1', ''],
    ['é1=1', 'é1'],
    ['export *FOO=1', 'FOO'],
    ['', undefined],
    ['# FOO=1', undefined],
  ])('cleans the key of %j into %j', (raw, expected) => {
    expect(new LineText(raw).cleanedKey).toBe(expected);
  });
});

describe('isDirective', () => {
  it.each([
    ['# eslint-disable', true],
    ['  #   eslint-disable-next-line dotenv/lowercase-key', true],
    ['# eslint-enable', true],
    ['# eslint-disable-line', true],
    ['# eslint dotenv/lowercase-key: off', true],
    ['# eslint-disabled', false],
    ['# eslintrc', false],
    ['# a comment', false],
    ['FOO=# eslint-disable', false],
  ])('judges %j as %j', (raw, expected) => {
    expect(new LineText(raw).isDirective).toBe(expected);
  });
});

describe('substitutionKeys', () => {
  it.each([
    ['', []],
    ['FOO=$BAR', ['BAR']],
    ['FOO=$BAR # comment', ['BAR']],
    [`FOO=\${BAR}`, ['BAR']],
    ['FOO=$BAR}', ['BAR']],
    ['FOO=${BAR', []],
    ['FOO="$BAR"', ['BAR']],
    ['FOO=$BAR"', ['BAR']],
    ['FOO="$BAR', []],
    [String.raw`FOO="$BAR\"`, []],
    [String.raw`FOO="\"`, []],
    [`FOO="\${BAR}\\\\"`, ['BAR']],
    ["FOO='$BAR'", []],
    [`FOO=TEST_\${BAR}_\\'`, ['BAR']],
    [String.raw`FOO=\$BAR`, []],
    [String.raw`FOO=\\$BAR`, ['BAR']],
    [String.raw`FOO=\\\$BAR`, []],
    [`DATABASE=postgres://\${USER}@localhost/database`, ['USER']],
    ['FOO=$BAR$BAR', ['BAR', 'BAR']],
    [`FOO=\${BAR}\${BAR}`, ['BAR', 'BAR']],
    [`FOO=\${BAR}\${BAZ}`, ['BAR', 'BAZ']],
    ['FOO=${BAR $BAZ', []],
    ['FOO=$', []],
    ['FOO', []],
    ['# FOO=$BAR', []],
  ])('lists the variables of %j', (raw, expected) => {
    expect(new LineText(raw).substitutionKeys).toEqual(expected);
  });
});
