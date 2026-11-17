/**
 * @file Tests for the `leading-character` rule.
 */

import rule from '../../src/rules/leading-character.js';
import { ruleTester } from '../utils/tester.js';

ruleTester.run('leading-character', rule, {
  valid: ['FOO=BAR', '', '_FOO=BAR', '# .FOO=BAR', 'export FOO=1', 'éclair=1'],
  invalid: [
    {
      code: '.FOO=BAR',
      errors: [{ messageId: 'invalid', line: 1, column: 1 }],
      output: 'FOO=BAR',
    },
    { code: '*FOO=BAR', errors: [{ messageId: 'invalid' }], output: 'FOO=BAR' },
    { code: '1FOO=BAR', errors: [{ messageId: 'invalid' }], output: 'FOO=BAR' },
    { code: ' FOO=BAR', errors: [{ messageId: 'invalid' }], output: 'FOO=BAR' },
    {
      code: '  FOO=BAR',
      errors: [{ messageId: 'invalid' }],
      output: 'FOO=BAR',
    },
    {
      code: '\tFOO=BAR',
      errors: [{ messageId: 'invalid' }],
      output: 'FOO=BAR',
    },
    {
      code: ' export FOO=1',
      errors: [{ messageId: 'invalid' }],
      output: 'export FOO=1',
    },
    { code: '.FOO', errors: [{ messageId: 'invalid' }], output: null },
    {
      code: '*BAR=BAZ\n.ABC=DEF\n1QUX=QUUX\n_FOO=BAR\n',
      errors: [
        { messageId: 'invalid', line: 1 },
        { messageId: 'invalid', line: 2 },
        { messageId: 'invalid', line: 3 },
      ],
      output: 'BAR=BAZ\nABC=DEF\nQUX=QUUX\n_FOO=BAR\n',
    },
  ],
});
