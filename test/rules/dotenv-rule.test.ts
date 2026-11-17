/**
 * @file Tests for the base classes of the rules.
 */
import { describe, expect, it, jest } from '@jest/globals';
import { DotenvParser } from '../../src/language/parser.js';
import { DotenvSourceCode } from '../../src/language/source-code.js';
import { LineRule, ProgramRule } from '../../src/rules/dotenv-rule.js';
import type { LineNode, ProgramNode } from '../../src/language/types.js';
import type { LineText } from '../../src/language/line-text.js';
import type { RuleVisitor } from '@eslint/core';
import type { DotenvRuleContext } from '../../src/rules/dotenv-rule.js';
import type { Reporter } from '../../src/rules/reporter.js';

/** The lines every line rule in these tests sees. */
const seenLines: string[] = [];

/** A line rule that records the lines it is given. */
class RecordingLineRule extends LineRule<'seen'> {
  /** The types of line the rule checks. */
  protected override readonly lineTypes = ['Entry', 'Comment'] as const;

  /** Creates the rule. */
  public constructor() {
    super({
      name: 'recording-line',
      description: 'Records lines.',
      type: 'suggestion',
      messages: { seen: 'Seen' },
    });
  }

  /**
   * Records a line.
   * @param line The line to check.
   * @param text What can be read from the line.
   */
  protected check(line: LineNode, text: LineText): void {
    seenLines.push(`${line.type}:${text.raw}`);
  }
}

/** A line rule that keeps the default line types. */
class DefaultLineRule extends LineRule<'seen'> {
  /** Creates the rule. */
  public constructor() {
    super({
      name: 'default-line',
      description: 'Checks assignments.',
      type: 'problem',
      fixable: 'code',
      messages: { seen: 'Seen' },
    });
  }

  /**
   * Records a line.
   * @param line The line to check.
   */
  protected check(line: LineNode): void {
    seenLines.push(line.raw);
  }
}

/** A program rule that records the lines of the file, and the options it was given. */
class RecordingProgramRule extends ProgramRule<
  'seen',
  [{ readonly level: number }?]
> {
  /** What the rule saw. */
  public readonly seen: string[] = [];

  /** Creates the rule. */
  public constructor() {
    super({
      name: 'recording-program',
      description: 'Records a program.',
      type: 'problem',
      schema: [{ type: 'object' }],
      defaultOptions: [{ level: 1 }],
      messages: { seen: 'Seen' },
    });
  }

  /**
   * Records the lines of the file and the options.
   * @param program The lines of the file.
   * @param reporter Reports the problems of the file.
   * @param context What the rule gets from ESLint.
   */
  protected check(
    program: ProgramNode,
    reporter: Reporter<'seen'>,
    context: DotenvRuleContext<'seen', [{ readonly level: number }?]>,
  ): void {
    this.seen.push(
      `${program.body.length}:${reporter.text.length}:${JSON.stringify(context.options)}`,
    );
  }
}

/**
 * Builds the context ESLint would give a rule for a text.
 * @param text The text of the file.
 * @param options The options of the rule.
 * @returns The context.
 */
function contextOf<Options extends unknown[]>(
  text: string,
  options: Options,
): DotenvRuleContext<'seen', Options> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- the context is a mock that carries only the members these base classes read, not the whole ESLint rule context
  return {
    options,
    cwd: '/',
    sourceCode: new DotenvSourceCode({
      text,
      ast: new DotenvParser().parse(text),
    }),
    report: jest.fn(),
  } as unknown as DotenvRuleContext<'seen', Options>;
}

/**
 * Calls the visitor entries for a type of node.
 * @param visitor The visitor.
 * @param type The type of node.
 * @param nodes The nodes to visit.
 */
function visit(
  visitor: RuleVisitor,
  type: string,
  nodes: readonly unknown[],
): void {
  for (const node of nodes) {
    visitor[type]?.(node);
  }
}

describe('DotenvLintRule', () => {
  it('describes the rule to ESLint', () => {
    const { meta } = new DefaultLineRule();

    expect(meta).toMatchObject({
      type: 'problem',
      fixable: 'code',
      schema: [],
      messages: { seen: 'Seen' },
      docs: {
        description: 'Checks assignments.',
        recommended: true,
        url: 'https://github.com/mridang/eslint-plugin-dotenv#default-line',
      },
    });
  });

  it('passes on a schema and default options', () => {
    const { meta } = new RecordingProgramRule();

    expect(meta.schema).toEqual([{ type: 'object' }]);
    expect(meta.defaultOptions).toEqual([{ level: 1 }]);
  });
});

describe('LineRule', () => {
  it('checks assignments unless told otherwise', () => {
    const text = 'A=1\n# note\n\nB=2\n';
    const context = contextOf<[]>(text, []);
    const visitor = new DefaultLineRule().create(context);

    seenLines.length = 0;
    visit(
      visitor,
      'Entry',
      context.sourceCode.ast.body.filter((line) => line.type === 'Entry'),
    );

    expect(Object.keys(visitor)).toEqual(['Entry']);
    expect(seenLines).toEqual(['A=1', 'B=2']);
  });

  it('checks the types of line it names', () => {
    const context = contextOf<[]>('A=1\n# note\n', []);
    const visitor = new RecordingLineRule().create(context);

    seenLines.length = 0;
    for (const line of context.sourceCode.ast.body) {
      visitor[line.type]?.(line);
    }

    expect(Object.keys(visitor)).toEqual(['Entry', 'Comment']);
    expect(seenLines).toEqual(['Entry:A=1', 'Comment:# note']);
  });
});

describe('ProgramRule', () => {
  it('checks the whole file when ESLint reaches its root', () => {
    const rule = new RecordingProgramRule();
    const context = contextOf<[{ readonly level: number }?]>('A=1\nB=2\n', [
      { level: 3 },
    ]);
    const visitor = rule.create(context);

    visitor.Program?.(context.sourceCode.ast);

    expect(Object.keys(visitor)).toEqual(['Program']);
    expect(rule.seen).toEqual(['3:8:[{"level":3}]']);
  });
});
