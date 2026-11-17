/**
 * @file Tests for the `key-without-value` rule.
 */

import rule from '../../src/rules/key-without-value.js';
import { ruleTester } from '../utils/tester.js';

ruleTester.run('key-without-value', rule as never, {
  valid: ['FOO=BAR', '', 'FOO=', '# FOO', 'export FOO='],
  invalid: [
    {
      code: 'FOO',
      errors: [
        {
          messageId: 'missing',
          data: { key: 'FOO' },
          line: 1,
          column: 1,
          endColumn: 4,
        },
      ],
      output: 'FOO=',
    },
    {
      code: 'export FOO',
      errors: [{ messageId: 'missing', data: { key: 'FOO' } }],
      output: 'export FOO=',
    },
    {
      code: 'FOO\n\nBAR=\n\nBAZ=QUX\n',
      errors: [{ messageId: 'missing', data: { key: 'FOO' }, line: 1 }],
      output: 'FOO=\n\nBAR=\n\nBAZ=QUX\n',
    },
  ],
});
