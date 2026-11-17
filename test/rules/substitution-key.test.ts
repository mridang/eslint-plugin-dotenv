/**
 * @file Tests for the `substitution-key` rule.
 */

import rule from '../../src/rules/substitution-key.js';
import { ruleTester } from '../utils/tester.js';

ruleTester.run('substitution-key', rule as never, {
  valid: [
    'ABC=$BAR',
    `FOO=\${BAR}`,
    'FOO="$BAR"',
    `ABC=\${BAR}$XYZ`,
    `FOO=$ABC{\${BAR}`,
    'BIZ=$FOO-$ABC',
    String.raw`ABC=\${BAR`,
    String.raw`FOO=\$BAR}`,
    String.raw`FOO="\${BAR"`,
    String.raw`FOO="\$BAR}`,
    "FOO='${BAR'",
    'FOO=BAR',
    '# FOO=${BAR',
  ],
  invalid: [
    {
      code: 'ABC=${BAR',
      errors: [
        { messageId: 'incorrect', data: { key: 'ABC' }, line: 1, column: 1 },
      ],
      output: `ABC=\${BAR}`,
    },
    {
      code: 'XYZ=$BAR}',
      errors: [{ messageId: 'incorrect', data: { key: 'XYZ' } }],
      output: `XYZ=\${BAR}`,
    },
    {
      code: `FOO=\${BAR!}`,
      errors: [{ messageId: 'incorrect', data: { key: 'FOO' } }],
      output: null,
    },
    {
      code: `ABC=\${BAR$XYZ}`,
      errors: [{ messageId: 'incorrect', data: { key: 'ABC' } }],
      output: null,
    },
    {
      code: `FOO=\${ABC-$BAR}`,
      errors: [{ messageId: 'incorrect', data: { key: 'FOO' } }],
      output: null,
    },
    {
      code: `XYZ=\${FOO\${BAR}`,
      errors: [{ messageId: 'incorrect', data: { key: 'XYZ' } }],
      output: null,
    },
    {
      code: 'export ABC=${BAR',
      errors: [{ messageId: 'incorrect', data: { key: 'ABC' } }],
      output: `export ABC=\${BAR}`,
    },
    {
      code: `ABC=\${A}tail$B}`,
      errors: [{ messageId: 'incorrect', data: { key: 'ABC' } }],
      output: `ABC=\${A}tail\${B}`,
    },
  ],
});
