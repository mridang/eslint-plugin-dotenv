/**
 * @file Tests for the `ending-blank-line` rule.
 */

import rule from '../../src/rules/ending-blank-line.js';
import { ruleTester } from '../utils/tester.js';

ruleTester.run('ending-blank-line', rule, {
  valid: ['', '\n', 'FOO=BAR\n', 'FOO=BAR\r\n', '# comment\n', 'A="x\ny"\n'],
  invalid: [
    {
      code: 'FOO=BAR',
      errors: [
        { messageId: 'missing', line: 1, column: 1, endLine: 1, endColumn: 8 },
      ],
      output: 'FOO=BAR\n',
    },
    {
      code: 'ABC=DEF\nFOO=BAR',
      errors: [{ messageId: 'missing', line: 2 }],
      output: 'ABC=DEF\nFOO=BAR\n',
    },
    {
      code: 'A=1\r\nB=2',
      errors: [{ messageId: 'missing', line: 2 }],
      output: 'A=1\r\nB=2\r\n',
    },
    {
      code: '# comment',
      errors: [{ messageId: 'missing', line: 1 }],
      output: '# comment\n',
    },
    {
      code: 'A="x\ny"',
      errors: [{ messageId: 'missing', line: 1, endLine: 1 }],
      output: 'A="x\ny"\n',
    },
  ],
});
