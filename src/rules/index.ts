/**
 * @file The rules of this plugin, by name.
 */
import duplicatedKey from './duplicated-key.js';
import endingBlankLine from './ending-blank-line.js';
import extraBlankLine from './extra-blank-line.js';
import incorrectDelimiter from './incorrect-delimiter.js';
import keyWithoutValue from './key-without-value.js';
import leadingCharacter from './leading-character.js';
import lowercaseKey from './lowercase-key.js';
import quoteCharacter from './quote-character.js';
import schemaViolation from './schema-violation.js';
import spaceCharacter from './space-character.js';
import substitutionKey from './substitution-key.js';
import trailingWhitespace from './trailing-whitespace.js';
import unorderedKey from './unordered-key.js';
import valueWithoutQuotes from './value-without-quotes.js';

/** Every rule of the plugin, keyed by the name used in a configuration. */
export const rules = {
  'duplicated-key': duplicatedKey,
  'ending-blank-line': endingBlankLine,
  'extra-blank-line': extraBlankLine,
  'incorrect-delimiter': incorrectDelimiter,
  'key-without-value': keyWithoutValue,
  'leading-character': leadingCharacter,
  'lowercase-key': lowercaseKey,
  'quote-character': quoteCharacter,
  'schema-violation': schemaViolation,
  'space-character': spaceCharacter,
  'substitution-key': substitutionKey,
  'trailing-whitespace': trailingWhitespace,
  'unordered-key': unorderedKey,
  'value-without-quotes': valueWithoutQuotes,
} as const;
