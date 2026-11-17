/**
 * @file Tests for the `extra-blank-line` rule.
 */

import rule from '../../src/rules/extra-blank-line.js';
import { ruleTester } from '../utils/tester.js';

ruleTester.run('extra-blank-line', rule, {
  valid: ['A=B\nC=D', 'A=B\n\nC=D', 'A=B\n', 'A=B\n\n# c\n\nC=D', ''],
  invalid: [
    {
      code: 'A=B\n\n\nC=D',
      errors: [{ messageId: 'extra', line: 3, column: 1 }],
      output: 'A=B\n\nC=D',
    },
    {
      code: 'ABC=DEF\n\n\nFOO=BAR\n',
      errors: [{ messageId: 'extra', line: 3 }],
      output: 'ABC=DEF\n\nFOO=BAR\n',
    },
    {
      code: 'A=B\n  \n\nC=D',
      errors: [{ messageId: 'extra', line: 3 }],
      output: 'A=B\n  \nC=D',
    },
    {
      code: 'A=B\n\n',
      errors: [{ messageId: 'extra', line: 3 }],
      output: 'A=B\n',
    },
    {
      code: 'A=B\n   \n',
      errors: [{ messageId: 'extra', line: 3 }],
      output: 'A=B\n',
    },
    {
      code: 'A=B\r\n\r\n',
      errors: [{ messageId: 'extra', line: 3 }],
      output: 'A=B\r\n',
    },
    {
      code: 'A=B\r\n\r\n\r\nC=D',
      errors: [{ messageId: 'extra', line: 3 }],
      output: 'A=B\r\n\r\nC=D',
    },
    {
      code: 'A=B\n\n\n\nC=D',
      errors: [
        { messageId: 'extra', line: 3 },
        { messageId: 'extra', line: 4 },
      ],
      output: 'A=B\n\n\nC=D',
    },
  ],
});
