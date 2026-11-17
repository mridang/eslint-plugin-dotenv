/**
 * @file Tests for the dotenv parser.
 */
import { describe, expect, it } from '@jest/globals';
import { DotenvParser } from '../../src/language/parser.js';

const parser = new DotenvParser();

/**
 * Summarises the lines of a text as `type number raw` strings.
 * @param text The text to parse.
 * @returns One string per line.
 */
function summarise(text: string): string[] {
  return parser
    .parse(text)
    .body.map(
      (line) => `${line.type} ${line.number} ${JSON.stringify(line.raw)}`,
    );
}

describe('lines', () => {
  it('reads nothing from an empty file', () => {
    const program = parser.parse('');

    expect(program.body).toEqual([]);
    expect(program.range).toEqual([0, 0]);
    expect(program.loc).toEqual({
      start: { line: 1, column: 1 },
      end: { line: 1, column: 1 },
    });
  });

  it('classifies entries, comments and blank lines', () => {
    expect(summarise('A=1\n# note\n\n   \nB')).toEqual([
      'Entry 1 "A=1"',
      'Comment 2 "# note"',
      'Blank 3 ""',
      'Blank 4 "   "',
      'Entry 5 "B"',
    ]);
  });

  it('adds an empty line after a final line break', () => {
    expect(summarise('A=1\n')).toEqual([
      'Entry 1 "A=1"',
      String.raw`Blank 2 "\n"`,
    ]);
    expect(summarise('\n')).toEqual(['Blank 1 ""', String.raw`Blank 2 "\n"`]);
    expect(summarise('A=1\n\n')).toEqual([
      'Entry 1 "A=1"',
      'Blank 2 ""',
      String.raw`Blank 3 "\n"`,
    ]);
  });

  it('does not add a line without a final line break', () => {
    expect(summarise('A=1')).toEqual(['Entry 1 "A=1"']);
  });

  it('drops the carriage return of a Windows line break', () => {
    expect(summarise('A=1\r\nB=2\r\n')).toEqual([
      'Entry 1 "A=1"',
      'Entry 2 "B=2"',
      String.raw`Blank 3 "\n"`,
    ]);
  });

  it('keeps a lone carriage return and one on the last line', () => {
    expect(summarise('A=1\rB=2')).toEqual([String.raw`Entry 1 "A=1\rB=2"`]);
    expect(summarise('A=1\r')).toEqual([String.raw`Entry 1 "A=1\r"`]);
  });

  it('marks the last line', () => {
    expect(parser.parse('A=1\nB=2').body.map((line) => line.isLast)).toEqual([
      false,
      true,
    ]);
    expect(parser.parse('A=1\n').body.map((line) => line.isLast)).toEqual([
      false,
      true,
    ]);
  });
});

describe('positions', () => {
  it('locates each line', () => {
    const [first, second] = parser.parse('AB=1\r\nC=2\n').body;

    expect(first?.range).toEqual([0, 4]);
    expect(first?.loc).toEqual({
      start: { line: 1, column: 1 },
      end: { line: 1, column: 5 },
    });
    expect(second?.range).toEqual([6, 9]);
    expect(second?.head).toEqual({
      start: { line: 2, column: 1 },
      end: { line: 2, column: 4 },
    });
  });

  it('places the empty last line at the end of the text', () => {
    const program = parser.parse('A=1\n');
    const last = program.body.at(-1);

    expect(last?.range).toEqual([4, 4]);
    expect(last?.loc.start).toEqual({ line: 2, column: 1 });
    expect(program.loc.end).toEqual({ line: 2, column: 1 });
  });
});

describe('multi-line values', () => {
  it('merges a quoted value that spans lines', () => {
    expect(summarise('A="one\ntwo\nthree"\nB=2')).toEqual([
      String.raw`Entry 1 "A=\"one\ntwo\nthree\""`,
      'Entry 4 "B=2"',
    ]);
  });

  it('locates the merged line across all its lines', () => {
    const [merged] = parser.parse("A='one\ntwo'\n").body;

    expect(merged?.range).toEqual([0, 11]);
    expect(merged?.loc).toEqual({
      start: { line: 1, column: 1 },
      end: { line: 2, column: 5 },
    });
    expect(merged?.head.end).toEqual({ line: 1, column: 7 });
  });

  it('closes on the first quote, unless it is escaped', () => {
    expect(summarise('A="x\\"y\nz"\nB=2')).toEqual([
      String.raw`Entry 1 "A=\"x\\\"y\nz\""`,
      'Entry 3 "B=2"',
    ]);
  });

  it('does not merge a value that closes on its own line', () => {
    expect(summarise('A="x"\nB="y"')).toEqual([
      String.raw`Entry 1 "A=\"x\""`,
      String.raw`Entry 2 "B=\"y\""`,
    ]);
  });

  it('keeps comments and blank lines inside the value', () => {
    expect(summarise('A="x\n# not a comment\n\ny"')).toEqual([
      String.raw`Entry 1 "A=\"x\n# not a comment\n\ny\""`,
    ]);
  });

  it('leaves a value that never closes as separate lines', () => {
    expect(summarise('A="x\nB=2')).toEqual([
      String.raw`Entry 1 "A=\"x"`,
      'Entry 2 "B=2"',
    ]);
  });

  it('merges values that use single quotes', () => {
    expect(summarise("A='x\ny'")).toEqual([String.raw`Entry 1 "A='x\ny'"`]);
  });

  it('marks a merged last line as the last line', () => {
    expect(parser.parse('A="x\ny"').body.map((line) => line.isLast)).toEqual([
      true,
    ]);
  });

  it('merges a value that opens with a lone quote character', () => {
    expect(summarise("A='\nb'")).toEqual([String.raw`Entry 1 "A='\nb'"`]);
  });

  it('keeps Windows line breaks inside the range of a merged line', () => {
    const [merged] = parser.parse('A="x\r\ny"\r\n').body;

    expect(merged?.raw).toBe('A="x\ny"');
    expect(merged?.range).toEqual([0, 8]);
  });
});
