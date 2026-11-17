/**
 * @file Tests for the `lowercase-key` rule.
 */

import rule from '../../src/rules/lowercase-key.js';
import { ruleTester } from '../utils/tester.js';

ruleTester.run('lowercase-key', rule as never, {
  valid: ['FOO=BAR', 'export FOO=BAR', '# foo=bar', 'FOO_1=x', ''],
  invalid: [
    {
      code: 'foo_bar=FOOBAR',
      errors: [
        {
          messageId: 'lowercase',
          data: { key: 'foo_bar' },
          line: 1,
          column: 1,
        },
      ],
      output: 'FOO_BAR=FOOBAR',
    },
    {
      code: 'FOo_BAR=FOOBAR',
      errors: [{ messageId: 'lowercase', data: { key: 'FOo_BAR' } }],
      output: 'FOO_BAR=FOOBAR',
    },
    {
      code: 'export foo=bar',
      errors: [{ messageId: 'lowercase', data: { key: 'foo' } }],
      output: 'export FOO=bar',
    },
    {
      code: 'foo',
      errors: [{ messageId: 'lowercase', data: { key: 'foo' } }],
      output: null,
    },
    {
      code: 'straße=1',
      errors: [{ messageId: 'lowercase', data: { key: 'straße' } }],
      output: 'STRASSE=1',
    },
    {
      code: 'abc=DEF\n\nfOO=BAR\n',
      errors: [
        { messageId: 'lowercase', data: { key: 'abc' }, line: 1 },
        { messageId: 'lowercase', data: { key: 'fOO' }, line: 3 },
      ],
      output: 'ABC=DEF\n\nFOO=BAR\n',
    },
  ],
});
