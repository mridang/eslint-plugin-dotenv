/**
 * @file The syntax tree of a dotenv file, and the options of the dotenv language.
 */

/** A position in the text; both the line and the column start at 1. */
export interface Position {
  /** The line, starting at 1. */
  readonly line: number;
  /** The column, starting at 1. */
  readonly column: number;
}

/** A span of text between two positions. */
export interface SourceLocation {
  /** Where the span starts. */
  readonly start: Position;
  /** Where the span ends. */
  readonly end: Position;
}

/** A span of text between two offsets, the end being exclusive. */
export type SourceRange = [number, number];

/** The properties every line of a dotenv file has. */
export interface LineBase {
  /**
   * The number of the first physical line of this line. A quoted value that spans several
   * physical lines is a single line starting here.
   */
  readonly number: number;
  /**
   * The text of the line the way dotenv-linter reads it: physical lines joined with `\n` when a
   * quoted value spans several, and `\n` alone for the empty line after a final line break.
   */
  readonly raw: string;
  /** Whether this is the last line of the file. */
  readonly isLast: boolean;
  /** The offsets of the line in the text, without its line break. */
  readonly range: SourceRange;
  /** The location of the whole line, which spans several physical lines for a multi-line value. */
  readonly loc: SourceLocation;
  /** The location of the first physical line, where problems are reported. */
  readonly head: SourceLocation;
}

/** A line holding an assignment, or something that should be one. */
export interface EntryNode extends LineBase {
  /** The node type. */
  readonly type: 'Entry';
}

/** A line whose first non-blank character is `#`. */
export interface CommentNode extends LineBase {
  /** The node type. */
  readonly type: 'Comment';
}

/** A line with nothing but whitespace. */
export interface BlankNode extends LineBase {
  /** The node type. */
  readonly type: 'Blank';
}

/** Any line of a dotenv file. */
export type LineNode = EntryNode | CommentNode | BlankNode;

/** The root of the syntax tree: the lines of the file, in order. */
export interface ProgramNode {
  /** The node type. */
  readonly type: 'Program';
  /** The lines of the file. */
  readonly body: readonly LineNode[];
  /** The offsets covered by the file. */
  readonly range: SourceRange;
  /** The location covered by the file. */
  readonly loc: SourceLocation;
}

/** Every kind of node in the syntax tree. */
export type DotenvNode = LineNode | ProgramNode;

/** The language options of the dotenv language, which has none. */
export type DotenvLanguageOptions = Record<string, never>;
