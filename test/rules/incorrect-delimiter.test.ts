/**
 * @file Tests for the `incorrect-delimiter` rule.
 */

import rule from '../../src/rules/incorrect-delimiter.js';
import { ruleTester } from '../utils/tester.js';

ruleTester.run('incorrect-delimiter', rule, {
  valid: [
    'FOO_BAR=FOOBAR',
    'F100=BAR',
    'export FOO=BAR',
    '*FOO=BAR',
    'FOO_BAR =FOOBAR',
    'F=BAR',
    '# FOO-BAR=1',
    '',
  ],
  invalid: [
    {
      code: '***F-OOBAR=BAZ',
      errors: [
        {
          messageId: 'incorrect',
          data: { key: '***F-OOBAR' },
          line: 1,
          column: 1,
        },
      ],
      output: '***F_OOBAR=BAZ',
    },
    {
      code: 'FOO*=BAR',
      errors: [{ messageId: 'incorrect', data: { key: 'FOO*' } }],
      output: 'FOO_=BAR',
    },
    {
      code: 'FOO-BAR=FOOBAR',
      errors: [{ messageId: 'incorrect', data: { key: 'FOO-BAR' } }],
      output: 'FOO_BAR=FOOBAR',
    },
    {
      code: 'FOO BAR=FOOBAR',
      errors: [{ messageId: 'incorrect', data: { key: 'FOO BAR' } }],
      output: 'FOO_BAR=FOOBAR',
    },
    {
      code: 'FOO-BAR',
      errors: [{ messageId: 'incorrect', data: { key: 'FOO-BAR' } }],
      output: null,
    },
    {
      code: 'FOO-BAR =x',
      errors: [{ messageId: 'incorrect', data: { key: 'FOO-BAR ' } }],
      output: 'FOO_BAR =x',
    },
    {
      code: 'export FOO-BAR=1',
      errors: [{ messageId: 'incorrect', data: { key: 'FOO-BAR' } }],
      output: 'export FOO_BAR=1',
    },
    {
      code: 'RAILS-ENV=development\n\nSECRET,KEY*=xyz\n',
      errors: [
        { messageId: 'incorrect', data: { key: 'RAILS-ENV' }, line: 1 },
        { messageId: 'incorrect', data: { key: 'SECRET,KEY*' }, line: 3 },
      ],
      output: 'RAILS_ENV=development\n\nSECRET_KEY_=xyz\n',
    },
  ],
});
