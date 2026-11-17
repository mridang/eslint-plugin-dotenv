/**
 * @file Tests for the reporter that rules use to report problems and their fixes.
 */
import { describe, expect, it, jest } from '@jest/globals';
import { DotenvParser } from '../../src/language/parser.js';
import { DotenvSourceCode } from '../../src/language/source-code.js';
import { Reporter } from '../../src/rules/reporter.js';
import type { DotenvNode } from '../../src/language/types.js';
import type {
  RuleTextEdit,
  RuleTextEditor,
  ViolationReport,
} from '@eslint/core';

/** The text of the files these tests report on. */
type Messages = 'problem';

/** What a test needs to see of a report. */
interface Seen {
  /** The reporter under test. */
  readonly reporter: Reporter<Messages>;
  /** The reports it made. */
  readonly reports: ViolationReport<DotenvNode, Messages>[];
  /** The lines of the file. */
  readonly source: DotenvSourceCode;
}

/** An editor that returns the edits it is asked for, so a test can read them. */
// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- the editor is a mock that carries only the one method the reporter calls, not the whole ESLint text editor
const editor = {
  replaceTextRange: (range: [number, number], text: string): RuleTextEdit => ({
    range,
    text,
  }),
} as unknown as RuleTextEditor;

/**
 * Sets up a reporter on a text.
 * @param text The text of the file.
 * @returns The reporter, its reports and the source code.
 */
function setup(text: string): Seen {
  const source = new DotenvSourceCode({
    text,
    ast: new DotenvParser().parse(text),
  });
  const reports: ViolationReport<DotenvNode, Messages>[] = [];
  const reporter = new Reporter<Messages>({
    sourceCode: source,
    report: (violation) => reports.push(violation),
  });

  return { reporter, reports, source };
}

describe('Reporter', () => {
  it('exposes the text of the file', () => {
    expect(setup('A=1\n').reporter.text).toBe('A=1\n');
  });

  it('reports on the first physical line of a line', () => {
    const { reporter, reports, source } = setup('A="x\ny"\n');
    const line = source.ast.body.at(0);

    if (line) {
      reporter.report(line, 'problem', { key: 'A' });
    }

    expect(reports).toHaveLength(1);
    expect(reports[0]).toMatchObject({
      messageId: 'problem',
      data: { key: 'A' },
      loc: { start: { line: 1, column: 1 }, end: { line: 1, column: 5 } },
      fix: null,
    });
  });

  it('replaces the text of the line when given new text', () => {
    const { reporter, reports, source } = setup('a=1\n');
    const line = source.ast.body.at(0);

    if (line) {
      reporter.report(line, 'problem', undefined, 'A=1');
    }

    expect(typeof reports[0]?.fix).toBe('function');
    expect(reports[0]?.fix?.(editor)).toEqual({ range: [0, 3], text: 'A=1' });
  });

  it('gives no fix when the text would not change', () => {
    const { reporter, reports, source } = setup('A=1\n');
    const line = source.ast.body.at(0);

    if (line) {
      reporter.report(line, 'problem', undefined, 'A=1');
    }

    expect(reports[0]?.fix).toBeNull();
  });

  it('keeps Windows line breaks inside a multi-line value', () => {
    const { reporter, reports, source } = setup('a="x\r\ny"\r\n');
    const line = source.ast.body.at(0);

    if (line) {
      reporter.report(line, 'problem', undefined, 'A="x\ny"');
    }

    expect(reports[0]?.fix?.(editor)).toEqual({
      range: [0, 8],
      text: 'A="x\r\ny"',
    });
  });

  it('passes a function that edits the file on to ESLint', () => {
    const { reporter, reports, source } = setup('A=1\n');
    const line = source.ast.body.at(0);
    const fix = jest.fn(() => null);

    if (line) {
      reporter.report(line, 'problem', undefined, fix);
    }

    expect(reports[0]?.fix).toBe(fix);
  });

  it('reports at a place that is not a line', () => {
    const { reporter, reports, source } = setup('A=1\n');

    reporter.reportAt(source.ast.loc, 'problem', { key: 'B' });

    expect(reports[0]).toMatchObject({
      loc: source.ast.loc,
      messageId: 'problem',
      data: { key: 'B' },
    });
  });
});
