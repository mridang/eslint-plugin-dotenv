/**
 * @file Tests for the `schema-violation` rule.
 */

import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import rule from '../../src/rules/schema-violation.js';
import { ruleTester } from '../utils/tester.js';

/** A schema that uses every type of value. */
const schema = {
  version: '1.0.0',
  entries: {
    NAME: { type: 'String', regex: '^[A-Z]+$' },
    ANY: {},
    PORT: { type: 'Integer' },
    PRICE: { type: 'Float' },
    SITE: { type: 'Url' },
    MAIL: { type: 'Email' },
    FLAG: { type: 'Boolean' },
    NEEDED: { required: true },
  },
};

const directory = await mkdtemp(path.join(tmpdir(), 'dotenv-schema-'));
const file = path.join(directory, 'schema.json');

await writeFile(file, JSON.stringify(schema));

const base = 'NEEDED=1\n';

ruleTester.run('schema-violation', rule as never, {
  valid: [
    'FOO=BAR',
    { code: 'FOO=BAR', options: [{}] },
    {
      code: `${base}NAME=JOE\nANY=x y\nPORT=8080\nPRICE=1.5\nSITE=https://example.com\nMAIL=a@b.co\nFLAG=true`,
      options: [{ schema: { ...schema, allow_other_keys: true } }],
    },
    { code: `${base}NAME=JOE\nPORT=-42\nPORT=+7`, options: [{ schema }] },
    {
      code: `${base}PRICE=.5\nPRICE=5.\nPRICE=1e10\nPRICE=-inf\nPRICE=NaN\nPRICE=1e999`,
      options: [{ schema }],
    },
    {
      code: `${base}FLAG=yes\nFLAG=NO\nFLAG=1\nFLAG=FALSE`,
      options: [{ schema }],
    },
    { code: `${base}# STRANGE=1`, options: [{ schema }] },
    { code: `${base}PORT\nNAME`, options: [{ schema }] },
    { code: 'NEEDED=1', options: [{ schema: file }] },
  ],
  invalid: [
    {
      code: `${base}EXTRA=1`,
      options: [{ schema }],
      errors: [
        {
          messageId: 'undefinedKey',
          data: { key: 'EXTRA' },
          line: 2,
          column: 1,
        },
      ],
    },
    {
      code: `${base}NAME=joe`,
      options: [{ schema }],
      errors: [{ messageId: 'regex', data: { key: 'NAME' }, line: 2 }],
    },
    {
      code: `${base}PORT=abc\nPORT=3000000000\nPORT=1.5\nPORT= 1\nPORT=`,
      options: [{ schema }],
      errors: [
        { messageId: 'integer', line: 2 },
        { messageId: 'integer', line: 3 },
        { messageId: 'integer', line: 4 },
        { messageId: 'integer', line: 5 },
        { messageId: 'integer', line: 6 },
      ],
    },
    {
      code: `${base}PRICE=abc\nPRICE=.\nPRICE=1_0\nPRICE=0x10\nPRICE=e5`,
      options: [{ schema }],
      errors: [
        { messageId: 'float', line: 2 },
        { messageId: 'float', line: 3 },
        { messageId: 'float', line: 4 },
        { messageId: 'float', line: 5 },
        { messageId: 'float', line: 6 },
      ],
    },
    {
      code: `${base}SITE=not a url`,
      options: [{ schema }],
      errors: [{ messageId: 'url', data: { key: 'SITE' }, line: 2 }],
    },
    {
      code: `${base}MAIL=nobody`,
      options: [{ schema }],
      errors: [{ messageId: 'email', data: { key: 'MAIL' }, line: 2 }],
    },
    {
      code: `${base}FLAG=maybe`,
      options: [{ schema }],
      errors: [{ messageId: 'boolean', data: { key: 'FLAG' }, line: 2 }],
    },
    {
      code: 'ANY=1\n',
      options: [{ schema }],
      errors: [
        { messageId: 'required', data: { key: 'NEEDED' }, line: 2, column: 1 },
      ],
    },
    {
      code: '# only a comment',
      options: [{ schema }],
      errors: [
        { messageId: 'required', data: { key: 'NEEDED' }, line: 1, column: 1 },
      ],
    },
    {
      code: '',
      options: [{ schema }],
      errors: [
        { messageId: 'required', data: { key: 'NEEDED' }, line: 1, column: 1 },
      ],
    },
    {
      code: 'EXTRA=1',
      options: [{ schema: file }],
      errors: [
        { messageId: 'undefinedKey', data: { key: 'EXTRA' }, line: 1 },
        { messageId: 'required', data: { key: 'NEEDED' }, line: 1 },
      ],
    },
  ],
});
