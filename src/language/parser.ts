/**
 * @file Turns the text of a dotenv file into a syntax tree, reading lines the same way
 * dotenv-linter does: line breaks, the empty line after a final line break, and quoted values
 * that span several physical lines.
 */
import { LineText } from './line-text.js';
import { isEscaped, trim } from './text.js';
import type { LineNode, ProgramNode } from './types.js';

/** A physical line of the text, before quoted multi-line values are merged. */
interface PhysicalLine {
  /** The number of the line, starting at 1. */
  readonly number: number;
  /** The text of the line without its line break. */
  readonly raw: string;
  /** The offset where the line starts. */
  readonly start: number;
  /** The offset where the line ends, before its line break. */
  readonly end: number;
}

/** One or more physical lines that dotenv-linter reads as a single line. */
interface MergedLine {
  /** The first physical line. */
  readonly first: PhysicalLine;
  /** The last physical line. */
  readonly last: PhysicalLine;
  /** The text of the line, with `\n` between physical lines. */
  readonly raw: string;
  /** Whether the merged line ends the file. */
  readonly isLast: boolean;
}

/** A quoted value that has been opened and not yet closed. */
interface OpenValue {
  /** The number of the line the value starts on. */
  readonly number: number;
  /** The quote character that closes it. */
  readonly quote: string;
}

/** The state of the scan that finds quoted values spanning several lines. */
interface MultilineScan {
  /** The value being read, while one is open. */
  readonly open: OpenValue | null;
  /** The first and last line numbers of every value that has been closed. */
  readonly ranges: [number, number][];
}

/** The quote characters that can open a value, single quote first. */
const QUOTES = ["'", '"'] as const;

/**
 * Reads the text of a dotenv file into a syntax tree. The parser has no state, so one instance
 * can read any number of files.
 * @example
 * ```ts
 * const program = new DotenvParser().parse('FOO=BAR\n');
 * program.body.map((line) => line.type); // ['Entry', 'Blank']
 * ```
 */
export class DotenvParser {
  /**
   * Reads a file. Any text is valid dotenv text, so reading never fails.
   * @param text The text of the file.
   * @returns The syntax tree of the file.
   */
  public parse(text: string): ProgramNode {
    const physical = this.splitPhysicalLines(text);
    const last = physical.at(-1);

    return {
      type: 'Program',
      body: this.mergeMultilineValues(physical).map((line) =>
        this.createNode(line),
      ),
      range: [0, text.length],
      loc: {
        start: { line: 1, column: 1 },
        end: last
          ? { line: last.number, column: text.length - last.start + 1 }
          : { line: 1, column: 1 },
      },
    };
  }

  /**
   * Splits the text into physical lines the way dotenv-linter reads a file: a line ends at `\n`, a
   * `\r` before it is dropped, and a final line break adds an extra line holding just `\n`.
   * @param text The text of the file.
   * @returns The physical lines, none for an empty file.
   */
  private splitPhysicalLines(text: string): readonly PhysicalLine[] {
    if (text === '') {
      return [];
    }

    const parts = text.split('\n');
    const offsets = parts.reduce<number[]>(
      (starts, part) => {
        starts.push((starts.at(-1) ?? 0) + part.length + 1);

        return starts;
      },
      [0],
    );

    return parts.map((part, index) => {
      const number = index + 1;
      const isFinal = number === parts.length;
      const start = offsets[index];

      if (isFinal && text.endsWith('\n')) {
        return { number, raw: '\n', start: text.length, end: text.length };
      }

      const raw = !isFinal && part.endsWith('\r') ? part.slice(0, -1) : part;

      return { number, raw, start, end: start + raw.length };
    });
  }

  /**
   * Finds the quote that opens a value which is not closed on the same line.
   * @param value The trimmed value.
   * @returns The quote character, or `undefined` when the value does not open a quoted block.
   */
  private findOpeningQuote(value: string): string | undefined {
    return QUOTES.find(
      (quote) =>
        value.startsWith(quote) &&
        (value.length === 1 ||
          !value.endsWith(quote) ||
          isEscaped(value.slice(0, -1))),
    );
  }

  /**
   * Finds the quoted values that span several lines. A value is closed by the first line after it
   * that holds its quote character, unless that quote is escaped.
   * @param lines The physical lines.
   * @returns The number of the last line of each value, by the number of its first line.
   */
  private findMultilineRanges(
    lines: readonly PhysicalLine[],
  ): ReadonlyMap<number, number> {
    const { ranges } = lines.reduce<MultilineScan>(
      (scan, line) => {
        if (scan.open === null) {
          const value = new LineText(line.raw).value;
          const quote =
            value === undefined
              ? undefined
              : this.findOpeningQuote(trim(value));

          return {
            open: quote === undefined ? null : { number: line.number, quote },
            ranges: scan.ranges,
          };
        }

        const index = line.raw.indexOf(scan.open.quote);
        const closes = index !== -1 && !isEscaped(line.raw.slice(0, index));

        if (!closes) {
          return scan;
        }

        scan.ranges.push([scan.open.number, line.number]);

        return { open: null, ranges: scan.ranges };
      },
      { open: null, ranges: [] },
    );

    return new Map(ranges);
  }

  /**
   * Merges the physical lines of each multi-line quoted value into one line.
   * @param lines The physical lines.
   * @returns The lines, each possibly spanning several physical lines.
   */
  private mergeMultilineValues(
    lines: readonly PhysicalLine[],
  ): readonly MergedLine[] {
    const ranges = this.findMultilineRanges(lines);
    const continuations = new Set(
      [...ranges].flatMap(([start, end]) =>
        Array.from({ length: end - start }, (_, offset) => start + offset + 1),
      ),
    );

    return lines
      .filter((line) => !continuations.has(line.number))
      .map((first) => {
        const endNumber = ranges.get(first.number) ?? first.number;
        const group = lines.slice(first.number - 1, endNumber);

        return {
          first,
          last: group.at(-1) ?? first,
          raw: group.map((member) => member.raw).join('\n'),
          isLast: endNumber === lines.length,
        };
      });
  }

  /**
   * Builds the node of a line, telling an assignment from a comment and a blank line.
   * @param line The merged line.
   * @returns The node.
   */
  private createNode({ first, last, raw, isLast }: MergedLine): LineNode {
    const text = new LineText(raw);
    const type =
      (
        [
          ['Entry', text.isAssignment],
          ['Comment', text.isComment],
        ] as const
      ).find(([, matches]) => matches)?.[0] ?? 'Blank';

    return {
      type,
      number: first.number,
      raw,
      isLast,
      range: [first.start, last.end],
      loc: {
        start: { line: first.number, column: 1 },
        end: { line: last.number, column: last.end - last.start + 1 },
      },
      head: {
        start: { line: first.number, column: 1 },
        end: { line: first.number, column: first.end - first.start + 1 },
      },
    };
  }
}
