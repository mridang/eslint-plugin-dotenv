/**
 * @file Tests for the `unordered-key` rule.
 */

import rule from '../../src/rules/unordered-key.js';
import { ruleTester } from '../utils/tester.js';

ruleTester.run('unordered-key', rule as never, {
  valid: [
    '',
    'FOO=BAR',
    'A=1\nB=2\nC=3',
    'FOO=BAR\n\nBAR=FOO',
    'FOO=BAR\n# eslint-enable\nBar=FOO',
    '# a comment\nA=1\n# another\nB=2',
    'ABC=XYZ\nKEY=VALUE\nFOO=$KEY # Unordered, FOO uses KEY\nBAR=FOO\nBOO=$FOO\nXYZ=ABC',
    [
      'BBB=XYZ',
      'HHH=VAL',
      'ZZZ=VALUE',
      'CCC=$NNN$HHH # Unordered, CCC uses HHH',
      'BAR=FOOD',
      'BIG=FOOT',
      'WWW=$XYZ$TTT',
      'YYY=FOO',
      'BOO=$BAR$BBB$ZZZ # Unordered, BOO uses BAR',
      'TTT=BIG',
      'XYZ=G',
    ].join('\n'),
    'B=2\n\nA=1',
    'B=1\n# eslint-disable-next-line dotenv/key-without-value\nA=0',
    'B=2\na=1\n\uFF21=4\n\u{10000}=3',
    'FOO=BAR\nFOO=BAZ',
  ],
  invalid: [
    {
      code: 'FOO=BAR\nBAR=FOO',
      errors: [
        {
          messageId: 'unordered',
          data: { key: 'BAR', other: 'FOO' },
          line: 2,
          column: 1,
        },
      ],
      output: 'BAR=FOO\nFOO=BAR',
    },
    {
      code: 'FOO=BAR\nBAR=FOO\nABC=BAR',
      errors: [
        { messageId: 'unordered', data: { key: 'BAR', other: 'FOO' }, line: 2 },
        { messageId: 'unordered', data: { key: 'ABC', other: 'BAR' }, line: 3 },
      ],
      output: 'ABC=BAR\nBAR=FOO\nFOO=BAR',
    },
    {
      code: 'FOO=BAR\nBAR=FOO\nDDD=BAR',
      errors: [
        { messageId: 'unordered', data: { key: 'BAR', other: 'FOO' }, line: 2 },
        { messageId: 'unordered', data: { key: 'DDD', other: 'FOO' }, line: 3 },
      ],
      output: 'BAR=FOO\nDDD=BAR\nFOO=BAR',
    },
    {
      code: 'FOO=BAR\nBAR=FOO\nDDD=BAR\nZOO=BAR',
      errors: [
        { messageId: 'unordered', data: { key: 'BAR', other: 'FOO' }, line: 2 },
        { messageId: 'unordered', data: { key: 'DDD', other: 'FOO' }, line: 3 },
      ],
      output: 'BAR=FOO\nDDD=BAR\nFOO=BAR\nZOO=BAR',
    },
    {
      code: 'export B=1\nA=2',
      errors: [
        { messageId: 'unordered', data: { key: 'A', other: 'B' }, line: 2 },
      ],
      output: 'A=2\nexport B=1',
    },
    {
      code: 'B=1\r\nA=2\r\n',
      errors: [
        { messageId: 'unordered', data: { key: 'A', other: 'B' }, line: 2 },
      ],
      output: 'A=2\r\nB=1\r\n',
    },
    {
      code: 'B="x\ny"\nA=2',
      errors: [
        { messageId: 'unordered', data: { key: 'A', other: 'B' }, line: 3 },
      ],
      output: 'A=2\nB="x\ny"',
    },
    {
      code: '\u{10000}=3\n\uFF21=4',
      errors: [
        {
          messageId: 'unordered',
          data: { key: '\uFF21', other: '\u{10000}' },
          line: 2,
        },
      ],
      output: '\uFF21=4\n\u{10000}=3',
    },
    {
      code: 'HHH=VAL\nZZZ=VALUE\nBBB=$XYZ\nCCC=$HHH # Unordered, CCC uses HHH\nTTT=BIG\nXYZ=G\nGGG=JJJ\nAAA=$ZZZ\nMMM=$GGG$ZZZ # Unordered, MMM uses GGG',
      errors: [
        { messageId: 'unordered', data: { key: 'BBB', other: 'HHH' }, line: 3 },
        { messageId: 'unordered', data: { key: 'GGG', other: 'TTT' }, line: 7 },
        { messageId: 'unordered', data: { key: 'AAA', other: 'GGG' }, line: 8 },
      ],
      output:
        'BBB=$XYZ\nHHH=VAL\nZZZ=VALUE\nCCC=$HHH # Unordered, CCC uses HHH\nAAA=$ZZZ\nGGG=JJJ\nTTT=BIG\nXYZ=G\nMMM=$GGG$ZZZ # Unordered, MMM uses GGG',
    },
    {
      code: '# comment\n\nC=B\n# A comment\nA=B\nX=Y\n# more comments\n\n# middle comment\n\nM=123\n# K comment\nK=123\n# I comment\n# I comment\nI=123\n\nA1=1\nB1=1\n\n# end comment\n',
      errors: [
        { messageId: 'unordered', data: { key: 'A', other: 'C' }, line: 5 },
        { messageId: 'unordered', data: { key: 'K', other: 'M' }, line: 13 },
        { messageId: 'unordered', data: { key: 'I', other: 'K' }, line: 16 },
      ],
      output:
        '# comment\n\n# A comment\nA=B\nC=B\nX=Y\n# more comments\n\n# middle comment\n\n# I comment\n# I comment\nI=123\n# K comment\nK=123\nM=123\n\nA1=1\nB1=1\n\n# end comment\n',
    },
  ],
});
