/**
 * @file Tests for the source code object and the ESLint directives it finds.
 */
import { describe, expect, it } from '@jest/globals';
import { Linter } from 'eslint';
import plugin from '../../src/index.js';
import { DotenvParser } from '../../src/language/parser.js';
import { DotenvSourceCode } from '../../src/language/source-code.js';

/** Matches the message ESLint gives for a directive that suppresses nothing. */
const UNUSED_DIRECTIVE = /unused eslint-disable directive/iu;

/**
 * Builds the source code of a text.
 * @param text The text of the file.
 * @returns The source code.
 */
function sourceCodeOf(text: string): DotenvSourceCode {
  return new DotenvSourceCode({ text, ast: new DotenvParser().parse(text) });
}

/**
 * Lints a text with the given rules switched on.
 * @param text The text of the file.
 * @param rules The rules to switch on.
 * @returns The messages ESLint reports.
 */
function lint(
  text: string,
  rules: string[] = ['lowercase-key'],
): Linter.LintMessage[] {
  return new Linter({ configType: 'flat' }).verify(
    text,
    [
      {
        files: ['**/.env'],
        plugins: { dotenv: plugin as never },
        language: 'dotenv/dotenv',
        rules: Object.fromEntries(
          rules.map((rule) => [`dotenv/${rule}`, 'error']),
        ),
      },
    ],
    { filename: '.env' },
  );
}

/**
 * Lists the problems of a lint run as `line:rule` strings.
 * @param messages The messages ESLint reported.
 * @returns One string per message.
 */
function summarise(messages: Linter.LintMessage[]): string[] {
  return messages.map((message) => `${message.line}:${message.ruleId}`);
}

describe('getInlineConfigNodes', () => {
  it('finds comment lines that hold directives', () => {
    const sourceCode = sourceCodeOf(
      '# note\n# eslint-disable\nA=1\n# eslint dotenv/x: off\n',
    );

    expect(
      sourceCode.getInlineConfigNodes().map((node) => node.number),
    ).toEqual([2, 4]);
  });

  it('returns the same nodes every time', () => {
    const sourceCode = sourceCodeOf('# eslint-disable\n');

    expect(sourceCode.getInlineConfigNodes()).toBe(
      sourceCode.getInlineConfigNodes(),
    );
  });
});

describe('getDisableDirectives', () => {
  it('reads the four kinds of directive', () => {
    const { directives, problems } = sourceCodeOf(
      '# eslint-disable a -- why\n# eslint-enable a\n# eslint-disable-line b\n# eslint-disable-next-line c\n',
    ).getDisableDirectives();

    expect(problems).toEqual([]);
    expect(
      directives.map((directive) => [
        directive.type,
        directive.value,
        directive.justification,
      ]),
    ).toEqual([
      ['disable', 'a', 'why'],
      ['enable', 'a', ''],
      ['disable-line', 'b', ''],
      ['disable-next-line', 'c', ''],
    ]);
  });

  it('ignores inline configuration comments', () => {
    expect(
      sourceCodeOf('# eslint dotenv/x: off\n').getDisableDirectives()
        .directives,
    ).toEqual([]);
  });
});

describe('applyInlineConfig', () => {
  it('reads rule configuration', () => {
    const { configs, problems } = sourceCodeOf(
      '# eslint dotenv/lowercase-key: off\n',
    ).applyInlineConfig();

    expect(problems).toEqual([]);
    expect(configs).toEqual([
      {
        config: { rules: { 'dotenv/lowercase-key': 'off' } },
        loc: expect.anything(),
      },
    ]);
  });

  it('reports configuration it cannot read', () => {
    const { configs, problems } = sourceCodeOf(
      '# eslint dotenv/lowercase-key: [\n',
    ).applyInlineConfig();

    expect(configs).toEqual([]);
    expect(problems).toHaveLength(1);
    expect(problems[0]?.ruleId).toBeNull();
  });

  it('ignores directives that disable rules', () => {
    expect(sourceCodeOf('# eslint-disable\n').applyInlineConfig()).toEqual({
      configs: [],
      problems: [],
    });
  });
});

describe('traversal', () => {
  it('enters and leaves the program around each line', () => {
    const sourceCode = sourceCodeOf('A=1\n# c\n');
    const steps = sourceCode
      .traverse()
      .map((step) => `${step.phase}:${step.target.type}`);

    expect(steps).toEqual([
      '1:Program',
      '1:Entry',
      '2:Entry',
      '1:Comment',
      '2:Comment',
      '1:Blank',
      '2:Blank',
      '2:Program',
    ]);
  });

  it('builds the steps once', () => {
    const sourceCode = sourceCodeOf('A=1\n');

    expect(sourceCode.traverse()).toBe(sourceCode.traverse());
  });

  it('knows the parent of a line', () => {
    const sourceCode = sourceCodeOf('A=1\n');
    const [line] = sourceCode.ast.body;

    expect(line && sourceCode.getParent(line)).toBe(sourceCode.ast);
    expect(sourceCode.getParent(sourceCode.ast)).toBeUndefined();
  });

  it('reads text and locations through the base class', () => {
    const sourceCode = sourceCodeOf('A=1\nB=2');
    const second = sourceCode.ast.body[1];

    expect(second && sourceCode.getText(second)).toBe('B=2');
    expect(second && sourceCode.getRange(second)).toEqual([4, 7]);
    expect(second && sourceCode.getLoc(second).start).toEqual({
      line: 2,
      column: 1,
    });
  });
});

describe('directives while linting', () => {
  it('reports without a directive', () => {
    expect(summarise(lint('a=1\nb=2\n'))).toEqual([
      '1:dotenv/lowercase-key',
      '2:dotenv/lowercase-key',
    ]);
  });

  it('suppresses the next line', () => {
    expect(
      summarise(
        lint('# eslint-disable-next-line dotenv/lowercase-key\na=1\nb=2\n'),
      ),
    ).toEqual(['3:dotenv/lowercase-key']);
  });

  it('suppresses a range of lines', () => {
    expect(
      summarise(
        lint(
          'a=1\n# eslint-disable dotenv/lowercase-key\nb=2\n# eslint-enable dotenv/lowercase-key\nc=3\n',
        ),
      ),
    ).toEqual(['1:dotenv/lowercase-key', '5:dotenv/lowercase-key']);
  });

  it('suppresses every rule when none is named', () => {
    expect(
      summarise(
        lint('# eslint-disable\na=1\n', ['lowercase-key', 'ending-blank-line']),
      ),
    ).toEqual([]);
  });

  it('turns a rule off with inline configuration', () => {
    expect(
      summarise(lint('# eslint dotenv/lowercase-key: off\na=1\n')),
    ).toEqual([]);
  });

  it('reports a directive that suppresses nothing when asked to', () => {
    const messages = new Linter({ configType: 'flat' }).verify(
      '# eslint-disable-next-line dotenv/lowercase-key\nA=1\n',
      [
        {
          files: ['**/.env'],
          plugins: { dotenv: plugin as never },
          language: 'dotenv/dotenv',
          linterOptions: { reportUnusedDisableDirectives: 'error' },
          rules: { 'dotenv/lowercase-key': 'error' },
        },
      ],
      { filename: '.env' },
    );

    expect(messages).toHaveLength(1);
    expect(messages[0]?.message).toMatch(UNUSED_DIRECTIVE);
  });

  it('reports a problem inside a multi-line value on its first line', () => {
    expect(
      summarise(
        lint('# eslint-disable-next-line dotenv/lowercase-key\na="x\ny"\n'),
      ),
    ).toEqual([]);
  });
});
