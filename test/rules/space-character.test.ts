/**
 * @file Tests for the `space-character` rule.
 */

import rule from '../../src/rules/space-character.js';
import { ruleTester } from '../utils/tester.js';

ruleTester.run('space-character', rule as never, {
  valid: [
    'DEBUG_HTTP=true',
    ' DEBUG_HTTP=true',
    'DEBUG_HTTP=true ',
    '',
    'DEBUG_HTTP true',
    'A = b=c',
    '# A = b',
  ],
  invalid: [
    {
      code: 'DEBUG_HTTP = true',
      errors: [{ messageId: 'spaces', line: 1, column: 1 }],
      output: 'DEBUG_HTTP=true',
    },
    {
      code: 'DEBUG_HTTP =true',
      errors: [{ messageId: 'spaces' }],
      output: 'DEBUG_HTTP=true',
    },
    {
      code: 'DEBUG_HTTP= true',
      errors: [{ messageId: 'spaces' }],
      output: 'DEBUG_HTTP=true',
    },
    {
      code: 'export A = b',
      errors: [{ messageId: 'spaces' }],
      output: 'export A=b',
    },
    {
      code: 'ABC = DEF\n\nFOO= BAR\n',
      errors: [
        { messageId: 'spaces', line: 1 },
        { messageId: 'spaces', line: 3 },
      ],
      output: 'ABC=DEF\n\nFOO=BAR\n',
    },
  ],
});
