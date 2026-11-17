/**
 * @file The source code object ESLint hands to rules: the text, the syntax tree, how to walk it
 * and which comments hold ESLint directives.
 */
import {
  ConfigCommentParser,
  Directive,
  TextSourceCodeBase,
  VisitNodeStep,
} from '@eslint/plugin-kit';
import { LineText } from './line-text.js';
import { trim } from './text.js';
import type { DirectiveType } from '@eslint/core';
import type {
  CommentNode,
  DotenvLanguageOptions,
  DotenvNode,
  ProgramNode,
} from './types.js';

/** The parser of the comments that carry ESLint directives. */
const commentParser = new ConfigCommentParser();

/** The directive labels that switch rules on and off, with the type of directive each one is. */
const DIRECTIVE_TYPES = new Map<string, DirectiveType>([
  ['eslint-disable', 'disable'],
  ['eslint-enable', 'enable'],
  ['eslint-disable-next-line', 'disable-next-line'],
  ['eslint-disable-line', 'disable-line'],
]);

/** A step of the walk over the tree, which visits one node when entering or leaving it. */
class DotenvTraversalStep extends VisitNodeStep {
  /** The node this step visits. */
  declare target: DotenvNode;

  /**
   * Creates a step.
   * @param options The step.
   * @param options.target The node the step visits.
   * @param options.phase 1 when entering the node, 2 when leaving it.
   * @param options.args The arguments passed to the rule's visitor.
   */
  public constructor({
    target,
    phase,
    args,
  }: {
    target: DotenvNode;
    phase: 1 | 2;
    args: unknown[];
  }) {
    super({ target, phase, args });
    this.target = target;
  }
}

/**
 * Reads the text of a comment line without the leading `#`.
 * @param comment The comment line.
 * @returns The text of the comment.
 */
function getCommentValue(comment: CommentNode): string {
  return trim(comment.raw).slice(1);
}

/**
 * The source code of a dotenv file, with its syntax tree and the ESLint directives found in its
 * comments.
 */
export class DotenvSourceCode extends TextSourceCodeBase<{
  LangOptions: DotenvLanguageOptions;
  RootNode: ProgramNode;
  SyntaxElementWithLoc: DotenvNode;
  ConfigNode: CommentNode;
}> {
  /** The steps of the walk, built once because the tree never changes. */
  #steps: DotenvTraversalStep[] | undefined;

  /** The parent of each node. */
  readonly #parents = new WeakMap<DotenvNode, DotenvNode>();

  /** The comments that hold directives, found once. */
  #inlineConfigNodes: CommentNode[] | undefined;

  /**
   * Creates the source code.
   * @param options The text and its syntax tree.
   * @param options.text The text of the file.
   * @param options.ast The syntax tree of the file.
   */
  public constructor({ text, ast }: { text: string; ast: ProgramNode }) {
    super({ text, ast });
  }

  /**
   * Lists the comment lines that hold an ESLint directive or inline configuration.
   * @returns The comment nodes.
   * @example
   * ```ts
   * sourceCode.getInlineConfigNodes(); // the nodes of '# eslint-disable' lines
   * ```
   */
  public getInlineConfigNodes(): CommentNode[] {
    this.#inlineConfigNodes ??= this.ast.body.filter(
      (line): line is CommentNode =>
        line.type === 'Comment' && new LineText(line.raw).isDirective,
    );

    return this.#inlineConfigNodes;
  }

  /**
   * Reads the directives that switch rules on and off.
   * @returns The directives, and the problems found while reading them.
   * @example
   * ```ts
   * const { directives } = sourceCode.getDisableDirectives();
   * ```
   */
  public getDisableDirectives() {
    const directives = this.getInlineConfigNodes().flatMap((comment) => {
      const parsed = commentParser.parseDirective(getCommentValue(comment));

      const type =
        parsed === undefined ? undefined : DIRECTIVE_TYPES.get(parsed.label);

      return parsed !== undefined && type !== undefined
        ? [
            new Directive({
              type,
              node: comment,
              value: parsed.value,
              justification: parsed.justification,
            }),
          ]
        : [];
    });

    return { problems: [], directives };
  }

  /**
   * Reads the rule configuration given in `# eslint rule: value` comments.
   * @returns The configurations, and the problems found while reading them.
   * @example
   * ```ts
   * const { configs } = sourceCode.applyInlineConfig();
   * ```
   */
  public applyInlineConfig() {
    const results = this.getInlineConfigNodes().flatMap((comment) => {
      const parsed = commentParser.parseDirective(getCommentValue(comment));

      return parsed?.label === 'eslint'
        ? [{ comment, result: commentParser.parseJSONLikeConfig(parsed.value) }]
        : [];
    });
    const configs = results.flatMap(({ comment, result }) =>
      result.ok ? [{ config: { rules: result.config }, loc: comment.loc }] : [],
    );
    const problems = results.flatMap(({ comment, result }) =>
      result.ok
        ? []
        : [{ ruleId: null, message: result.error.message, loc: comment.loc }],
    );

    return { problems, configs };
  }

  /**
   * Finds the parent of a node.
   * @param node The node.
   * @returns The parent, or `undefined` for the root.
   * @example
   * ```ts
   * sourceCode.getParent(line); // the program node
   * ```
   */
  public getParent(node: DotenvNode): DotenvNode | undefined {
    this.traverse();

    return this.#parents.get(node);
  }

  /**
   * Walks the tree, entering and leaving each node.
   * @returns The steps of the walk.
   * @example
   * ```ts
   * for (const step of sourceCode.traverse()) { // visit step.target }
   * ```
   */
  public traverse(): DotenvTraversalStep[] {
    if (this.#steps) {
      return this.#steps;
    }

    const root = this.ast;
    const steps = [
      new DotenvTraversalStep({ target: root, phase: 1, args: [root] }),
      ...root.body.flatMap((line) => {
        this.#parents.set(line, root);

        return [
          new DotenvTraversalStep({
            target: line,
            phase: 1,
            args: [line, root],
          }),
          new DotenvTraversalStep({
            target: line,
            phase: 2,
            args: [line, root],
          }),
        ];
      }),
      new DotenvTraversalStep({ target: root, phase: 2, args: [root] }),
    ];

    this.#steps = steps;

    return steps;
  }
}
