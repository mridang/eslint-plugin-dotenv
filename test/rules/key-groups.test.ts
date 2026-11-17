/**
 * @file Tests for the groups of keys that are sorted on their own.
 */
import { describe, expect, it } from '@jest/globals';
import { DotenvParser } from '../../src/language/parser.js';
import { KeyGroup } from '../../src/rules/key-groups.js';

/**
 * Splits a text into groups and lists the raw lines of each.
 * @param text The text of the file.
 * @returns The lines of every group.
 */
function groupsOf(text: string): string[][] {
  return KeyGroup.split(new DotenvParser().parse(text).body).map((group) =>
    group.lines.map((line) => line.raw),
  );
}

describe('split', () => {
  it('finds nothing in an empty file', () => {
    expect(groupsOf('')).toEqual([]);
  });

  it('keeps consecutive keys together', () => {
    expect(groupsOf('B=1\nA=2')).toEqual([['B=1', 'A=2']]);
  });

  it('ends a group at a blank line', () => {
    expect(groupsOf('B=1\n\nA=2')).toEqual([['B=1'], ['A=2']]);
  });

  it('ends a group at an ESLint directive comment', () => {
    expect(groupsOf('B=1\n# eslint-enable\nA=2')).toEqual([['B=1'], ['A=2']]);
  });

  it('leaves comments below the last key out of the group', () => {
    expect(groupsOf('A=1\n# note\n\nB=2')).toEqual([['A=1'], ['B=2']]);
  });

  it('keeps comments above a key in the group', () => {
    expect(groupsOf('# note\nA=1\nB=2')).toEqual([['# note', 'A=1', 'B=2']]);
  });

  it('ends a group before a line that refers to a key of the group', () => {
    expect(groupsOf('A=1\nB=$A\nC=3')).toEqual([['A=1'], ['C=3']]);
  });

  it('keeps a line whose reference is to a key outside the group', () => {
    expect(groupsOf('A=1\n\nB=$A\nC=3')).toEqual([['A=1'], ['B=$A', 'C=3']]);
  });
});

describe('findMisplacements', () => {
  it('finds nothing in order', () => {
    const group = KeyGroup.split(
      new DotenvParser().parse('A=1\nB=2\n').body,
    ).at(0);

    expect(group?.findMisplacements()).toEqual([]);
  });

  it('names the key each misplaced key should go before', () => {
    const group = KeyGroup.split(
      new DotenvParser().parse('C=1\nB=2\nA=3\n').body,
    ).at(0);

    expect(
      group?.findMisplacements().map(({ key, other }) => [key, other]),
    ).toEqual([
      ['B', 'C'],
      ['A', 'B'],
    ]);
  });
});

describe('sortedText', () => {
  it('sorts the keys, keeping the comments above each one with it', () => {
    const text = 'C=1\n# above A\nA=2\nB=3\n';
    const group = KeyGroup.split(new DotenvParser().parse(text).body).at(0);

    expect(group?.sortedText(text)).toBe('# above A\nA=2\nB=3\nC=1');
  });

  it('uses the line breaks of the file', () => {
    const text = 'B=1\r\nA=2\r\n';
    const group = KeyGroup.split(new DotenvParser().parse(text).body).at(0);

    expect(group?.sortedText(text)).toBe('A=2\r\nB=1');
  });
});
