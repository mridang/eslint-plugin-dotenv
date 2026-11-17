/**
 * @file Tests for the `value-without-quotes` rule.
 */

import rule from '../../src/rules/value-without-quotes.js';
import { ruleTester } from '../utils/tester.js';

ruleTester.run('value-without-quotes', rule, {
  valid: [
    'FOO=BAR',
    'FOO="BAR BAZ"',
    "FOO='BAR BAR'",
    'FOO=',
    'FOO= ',
    'FOO',
    '# FOO=BAR BAZ',
  ],
  invalid: [
    {
      code: 'FOO=BAR BAZ',
      errors: [{ messageId: 'unquoted', line: 1, column: 1 }],
      output: 'FOO="BAR BAZ"',
    },
    {
      code: 'FOO=BAR\tBAZ',
      errors: [{ messageId: 'unquoted' }],
      output: 'FOO="BAR\tBAZ"',
    },
    {
      code: 'export FOO=a b',
      errors: [{ messageId: 'unquoted' }],
      output: 'export FOO="a b"',
    },
    {
      code: 'A=ok\nFOO=BAR BAZ\n',
      errors: [{ messageId: 'unquoted', line: 2 }],
      output: 'A=ok\nFOO="BAR BAZ"\n',
    },
  ],
});
