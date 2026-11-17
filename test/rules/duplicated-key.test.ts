/**
 * @file Tests for the `duplicated-key` rule.
 */

import rule from '../../src/rules/duplicated-key.js';
import { ruleTester } from '../utils/tester.js';

ruleTester.run('duplicated-key', rule as never, {
  valid: [
    'FOO=BAR\nBAR=FOO',
    'FOO=BAR\nFoo=FOO',
    '# FOO=1\nFOO=2',
    'export FOO=1\nBAR=2',
    '',
  ],
  invalid: [
    {
      code: 'FOO=BAR\nFOO=BAR',
      errors: [
        {
          messageId: 'duplicated',
          data: { key: 'FOO' },
          line: 2,
          column: 1,
          endLine: 2,
          endColumn: 8,
        },
      ],
      output: 'FOO=BAR\n# FOO=BAR',
    },
    {
      code: 'FOO=BAR\nFOO=BAR\nBAR=FOO\nBAR=FOO',
      errors: [
        { messageId: 'duplicated', data: { key: 'FOO' }, line: 2 },
        { messageId: 'duplicated', data: { key: 'BAR' }, line: 4 },
      ],
      output: 'FOO=BAR\n# FOO=BAR\nBAR=FOO\n# BAR=FOO',
    },
    {
      code: 'ABC=DEF\nABC=XYZ\nFOO=BAR\nFOO=BAZ\n',
      errors: [
        { messageId: 'duplicated', data: { key: 'ABC' }, line: 2 },
        { messageId: 'duplicated', data: { key: 'FOO' }, line: 4 },
      ],
      output: 'ABC=DEF\n# ABC=XYZ\nFOO=BAR\n# FOO=BAZ\n',
    },
    {
      code: 'export FOO=1\nFOO=2',
      errors: [{ messageId: 'duplicated', data: { key: 'FOO' }, line: 2 }],
      output: 'export FOO=1\n# FOO=2',
    },
    {
      code: 'A=1\nA="x\ny"\nB=1',
      errors: [
        {
          messageId: 'duplicated',
          data: { key: 'A' },
          line: 2,
          endLine: 2,
          endColumn: 5,
        },
      ],
      output: 'A=1\n# A="x\n# y"\nB=1',
    },
    {
      code: 'A=1\r\nA=2\r\n',
      errors: [{ messageId: 'duplicated', data: { key: 'A' }, line: 2 }],
      output: 'A=1\r\n# A=2\r\n',
    },
  ],
});
