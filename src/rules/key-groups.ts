/**
 * @file Groups of keys that are sorted on their own: the groups the `unordered-key` rule checks and
 * fixes.
 */
import { LineText } from '../language/line-text.js';
import { compareCodePoints, getLineBreak } from '../language/text.js';
import type { LineNode } from '../language/types.js';

/** A key that sits after a key it should go before. */
export interface Misplacement {
  /** The line of the misplaced key. */
  readonly line: LineNode;
  /** The misplaced key. */
  readonly key: string;
  /** The key it should go before. */
  readonly other: string;
}

/** Where a scan of the lines of a file has got to. */
interface GroupScan {
  /** The index of the first line of the current group. */
  readonly start: number;
  /** The index after the last key line of the current group, once it has one. */
  readonly end: number | null;
  /** The groups found so far. */
  readonly groups: KeyGroup[];
}

/**
 * Lines that are sorted together: key lines, and the comments right above them. The comments above
 * a key travel with it when the group is sorted.
 * @example
 * ```ts
 * const [group] = KeyGroup.split(program.body);
 * group?.findMisplacements();
 * ```
 */
export class KeyGroup {
  /**
   * Creates a group.
   * @param lines The lines of the group, from its first line to its last key line.
   */
  public constructor(public readonly lines: readonly LineNode[]) {}

  /**
   * Splits the lines of a file into groups. A group ends at a blank line, at an ESLint directive
   * comment, and before a line that refers to a key of its own group, so a reference never ends up
   * above the key it uses.
   * @param body The lines of the file.
   * @returns The groups, in the order they appear.
   */
  public static split(body: readonly LineNode[]): readonly KeyGroup[] {
    return body.reduce<GroupScan>(
      (scan, line, index) => {
        const dependent = KeyGroup.dependsOnGroup(body, scan.start, index);
        const end = line.type === 'Entry' && !dependent ? index + 1 : scan.end;
        const closes =
          line.type === 'Blank' ||
          index === body.length - 1 ||
          new LineText(line.raw).isDirective ||
          dependent;

        if (!closes) {
          return { start: scan.start, end, groups: scan.groups };
        }

        return {
          start: index + 1,
          end: null,
          groups:
            end === null
              ? scan.groups
              : [...scan.groups, new KeyGroup(body.slice(scan.start, end))],
        };
      },
      { start: 0, end: null, groups: [] },
    ).groups;
  }

  /**
   * Tells whether a line refers to a key that is set earlier in the same group.
   * @param body The lines of the file.
   * @param start The index of the first line of the group.
   * @param index The index of the line to test.
   * @returns `true` when the line uses a key of its group.
   */
  private static dependsOnGroup(
    body: readonly LineNode[],
    start: number,
    index: number,
  ): boolean {
    const references = new LineText(body[index].raw).substitutionKeys;

    if (references.length === 0) {
      return false;
    }

    const keys = new Set(
      body.slice(start, index).map((line) => new LineText(line.raw).key),
    );

    return references.some((reference) => keys.has(reference));
  }

  /**
   * Finds the keys that go after a key they should go before. Each key is compared with the keys
   * above it, so a key is reported when the keys so far are no longer in order.
   * @returns The misplaced keys, in the order they appear.
   */
  public findMisplacements(): readonly Misplacement[] {
    const entries = this.lines.flatMap((line) => {
      const key =
        line.type === 'Entry' ? new LineText(line.raw).key : undefined;

      return key === undefined ? [] : [{ line, key }];
    });

    return entries.flatMap(({ line, key }, index) => {
      const keys = entries.slice(0, index + 1).map((entry) => entry.key);
      const sorted = keys.toSorted(compareCodePoints);
      const other = sorted.at(sorted.indexOf(key) + 1);
      const inOrder = sorted.every(
        (value, position) => value === keys[position],
      );

      return inOrder || other === undefined ? [] : [{ line, key, other }];
    });
  }

  /**
   * Builds the text of the group once it is sorted: every key line with the comments above it,
   * ordered by key.
   * @param text The text of the file.
   * @returns The sorted text, joined with the line breaks the file uses.
   */
  public sortedText(text: string): string {
    const pieces = this.lines.reduce<LineNode[][]>((found, line) => {
      const open = found.at(-1);

      return open === undefined || open.at(-1)?.type !== 'Comment'
        ? [...found, [line]]
        : [...found.slice(0, -1), [...open, line]];
    }, []);

    return pieces
      .toSorted((left, right) =>
        compareCodePoints(KeyGroup.keyOf(left), KeyGroup.keyOf(right)),
      )
      .flat()
      .map((line) => text.slice(...line.range))
      .join(getLineBreak(text));
  }

  /**
   * Finds the key a piece is sorted by: the key of its last line.
   * @param piece A key line and the comments above it.
   * @returns The key.
   */
  private static keyOf(piece: readonly LineNode[]): string {
    const last = piece.at(-1);

    return (last === undefined ? undefined : new LineText(last.raw).key) ?? '';
  }
}
