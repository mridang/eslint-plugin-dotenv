/**
 * @file Tests for the `trailing-whitespace` rule.
 */

import rule from '../../src/rules/trailing-whitespace.js';
import { ruleTester } from '../utils/tester.js';

ruleTester.run('trailing-whitespace', rule as never, {
  valid: ['DEBUG_HTTP=true', '# comment ', '', 'A=1\t', '\n'],
  invalid: [
    {
      code: 'DEBUG_HTTP=true  ',
      errors: [{ messageId: 'trailing', line: 1, column: 1, endColumn: 18 }],
      output: 'DEBUG_HTTP=true',
    },
    {
      code: 'A=1\n  \nB=2',
      errors: [{ messageId: 'trailing', line: 2 }],
      output: 'A=1\n\nB=2',
    },
    {
      code: 'ABC=DEF \n\nFOO=BAR   \n',
      errors: [
        { messageId: 'trailing', line: 1 },
        { messageId: 'trailing', line: 3 },
      ],
      output: 'ABC=DEF\n\nFOO=BAR\n',
    },
  ],
});
