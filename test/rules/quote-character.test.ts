/**
 * @file Tests for the `quote-character` rule.
 */

import rule from '../../src/rules/quote-character.js';
import { ruleTester } from '../utils/tester.js';

ruleTester.run('quote-character', rule as never, {
  valid: [
    'FOO=BAR',
    "FOO='BAR BAR'",
    'FOO="BAR BAR"',
    'FOO="TLS&SSL"',
    "FOO='TLS&SSL'",
    'FOO="authSource=admin"',
    "FOO='authSource=admin'",
    'BAR="$ABC"',
    `FOO='\${BAR}BAR'`,
    'FOO="with #comment"',
    "FOO='with #comment'",
    'FOO="#only-comment"',
    "FOO='#only-comment'",
    String.raw`FOO="a\nb"`,
    '# FOO="x"',
    'FOO',
  ],
  invalid: [
    {
      code: "FOO='BAR'",
      errors: [{ messageId: 'quoted', line: 1, column: 1 }],
      output: 'FOO=BAR',
    },
    {
      code: `FOO='B"AR'`,
      errors: [{ messageId: 'quoted' }],
      output: 'FOO=BAR',
    },
    {
      code: 'FOO="Bar"',
      errors: [{ messageId: 'quoted' }],
      output: 'FOO=Bar',
    },
    {
      code: `export FOO='x'`,
      errors: [{ messageId: 'quoted' }],
      output: 'export FOO=x',
    },
    {
      code: `ABC="DEF"\n\nFOO='B"AR'\n`,
      errors: [
        { messageId: 'quoted', line: 1 },
        { messageId: 'quoted', line: 3 },
      ],
      output: 'ABC=DEF\n\nFOO=BAR\n',
    },
  ],
});
