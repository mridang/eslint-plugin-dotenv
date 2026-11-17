/**
 * @file The `schema-violation` rule, which checks a file against a dotenv-linter schema.
 */
import { LineText } from '../language/line-text.js';
import type { ProgramNode } from '../language/types.js';
import { DotenvSchema } from '../schema.js';
import type { SchemaInput, SchemaValueType } from '../schema.js';
import { ProgramRule } from './dotenv-rule.js';
import type { DotenvRuleContext } from './dotenv-rule.js';
import type { Reporter } from './reporter.js';
import type { DotenvRule } from './types.js';

/** The options of the rule. */
export interface SchemaViolationOptions {
  /** A path to a schema file, or the schema itself. Without it the rule checks nothing. */
  readonly schema?: SchemaInput;
}

/** The messages of the rule, by id. */
const MESSAGES = {
  undefinedKey: 'The {{key}} key is not defined in the schema',
  regex: 'The {{key}} key does not match the regex',
  integer: 'The {{key}} key is not an integer',
  float: 'The {{key}} key is not a valid float',
  boolean: 'The {{key}} key is not a valid boolean',
  url: 'The {{key}} key is not a valid URL',
  email: 'The {{key}} key is not a valid email address',
  required: 'The {{key}} key is required',
} as const;

/** The id of one of the messages of the rule. */
type MessageId = keyof typeof MESSAGES;

/** The message to report for each type a value can fail to match. */
const TYPE_MESSAGES: Readonly<Record<SchemaValueType, MessageId>> = {
  String: 'regex',
  Integer: 'integer',
  Float: 'float',
  Boolean: 'boolean',
  Url: 'url',
  Email: 'email',
};

/**
 * Reports keys the schema does not allow, values that do not match their type and required keys
 * that are missing. A missing key is reported on the last line of the file. There is no fix.
 */
class SchemaViolationRule extends ProgramRule<
  MessageId,
  [SchemaViolationOptions?]
> {
  /** Creates the rule. */
  public constructor() {
    super({
      name: 'schema-violation',
      description: 'Require the file to follow a schema.',
      type: 'problem',
      schema: [
        {
          type: 'object',
          properties: {
            schema: { oneOf: [{ type: 'string' }, { type: 'object' }] },
          },
          additionalProperties: false,
        },
      ],
      defaultOptions: [{}],
      messages: MESSAGES,
    });
  }

  /**
   * Checks the file against the schema of the options.
   * @param program The lines of the file.
   * @param reporter Reports the problems of the file.
   * @param context What the rule gets from ESLint.
   */
  protected check(
    program: ProgramNode,
    reporter: Reporter<MessageId>,
    context: DotenvRuleContext<MessageId, [SchemaViolationOptions?]>,
  ): void {
    const [{ schema: input } = {}] = context.options;

    if (input === undefined) {
      return;
    }

    const schema = DotenvSchema.load(input, context.cwd);
    const lines = program.body
      .filter((line) => line.type !== 'Comment')
      .map((line) => ({ line, text: new LineText(line.raw) }));

    for (const { line, text } of lines) {
      const problem = this.findProblem(schema, text);

      if (problem !== undefined) {
        reporter.report(line, problem.messageId, { key: problem.key });
      }
    }

    const seen = new Set(lines.map(({ text }) => text.key));
    const last = lines.at(-1)?.line;

    for (const [key, entry] of schema.entries) {
      if (entry.required && !seen.has(key)) {
        reporter.reportAt(last?.head ?? program.loc, 'required', { key });
      }
    }
  }

  /**
   * Finds what is wrong with a line, if anything.
   * @param schema The schema to check against.
   * @param text What can be read from the line.
   * @returns The message to report and the key it is about, or `undefined` when the line is fine
   * or has nothing to check.
   */
  private findProblem(
    schema: DotenvSchema,
    { key, value }: LineText,
  ): { messageId: MessageId; key: string } | undefined {
    if (key === undefined || value === undefined) {
      return undefined;
    }

    const entry = schema.entries.get(key);

    if (entry === undefined) {
      return schema.allowOtherKeys
        ? undefined
        : { messageId: 'undefinedKey', key };
    }

    const type = entry.check(value);

    return type === undefined
      ? undefined
      : { messageId: TYPE_MESSAGES[type], key };
  }
}

const rule: DotenvRule<MessageId, [SchemaViolationOptions?]> =
  new SchemaViolationRule();

export default rule;
