# ESLint Plugin for dotenv files

An [ESLint](https://eslint.org) plugin that lints `.env` files. It teaches ESLint
to read dotenv files and ports every check of
[dotenv-linter](https://github.com/dotenv-linter/dotenv-linter) to an ESLint
rule, with the same autofixes, so `.env` files are checked by the lint run you
already have: in your editor, in CI and in the same report as the rest of your
code.

### Why?

`.env` files are the one kind of configuration file ESLint cannot lint on its
own. The standalone dotenv-linter binary checks them, but it needs its own
installation step, its own CI step and its own suppression comments, and its
findings do not show up next to the rest of your lint results.

This plugin brings those checks into ESLint: a duplicated key, an unquoted
value with spaces, keys out of order or a missing final newline are reported
and fixed like any other problem, and are silenced with ESLint's own
`eslint-disable` comments.

## Installation

Install using NPM by using the following command:

```sh
npm install --save-dev @mridang/eslint-plugin-dotenv
```

The plugin needs ESLint 9.15 or newer, because it adds a language to ESLint.

## Usage

Add the recommended configuration to your `eslint.config.js`. It switches on
every rule for the files dotenv-linter itself would check: names that start
with `.env` or end with `.env`, except `.envrc` and backup files that end in
`.bak`.

```javascript
import dotenv from '@mridang/eslint-plugin-dotenv';

export default [...dotenv.configs.recommended];
```

To change a rule, add an object after it that matches the same files:

```javascript
import dotenv from '@mridang/eslint-plugin-dotenv';

export default [
  ...dotenv.configs.recommended,
  {
    files: ['**/.env*'],
    rules: {
      'dotenv/unordered-key': 'off',
      'dotenv/schema-violation': ['error', { schema: 'dotenv.schema.json' }],
    },
  },
];
```

To use the rules on other file names, set the language yourself:

```javascript
import dotenv from '@mridang/eslint-plugin-dotenv';

export default [
  {
    files: ['config/*.vars'],
    plugins: { dotenv },
    language: 'dotenv/dotenv',
    rules: { 'dotenv/lowercase-key': 'error' },
  },
];
```

## Suppressing problems

Problems are suppressed with ESLint's own comments, written in a `#` comment on
a line of its own:

```sh
# eslint-disable-next-line dotenv/lowercase-key
my_key=value

# eslint-disable dotenv/duplicated-key, dotenv/unordered-key
A=1
A=2
# eslint-enable dotenv/duplicated-key, dotenv/unordered-key
```

`eslint-disable`, `eslint-enable`, `eslint-disable-line` and
`eslint-disable-next-line` work, as do inline rule settings such as
`# eslint dotenv/lowercase-key: off`, and `--report-unused-disable-directives`
reports a comment that suppresses nothing. A directive is only read from a
comment that is a whole line, because dotenv-linter treats everything after the
`=` as the value, and so does this plugin.

A directive comment also ends a group of keys for `unordered-key`, as a blank
line does.

## Rules

Every rule is in the recommended configuration. A rule marked as fixable is
fixed by `eslint --fix`.

| Rule                                          | What it checks                                    | Fixable |
| --------------------------------------------- | ------------------------------------------------- | ------- |
| [duplicated-key](#duplicated-key)             | A key is assigned more than once                  | Yes     |
| [ending-blank-line](#ending-blank-line)       | The file ends with a line break                   | Yes     |
| [extra-blank-line](#extra-blank-line)         | There are no two blank lines in a row             | Yes     |
| [incorrect-delimiter](#incorrect-delimiter)   | Keys use only letters, digits and underscores     | Yes     |
| [key-without-value](#key-without-value)       | Every key has an equal sign                       | Yes     |
| [leading-character](#leading-character)       | Every line starts with a letter or an underscore  | Yes     |
| [lowercase-key](#lowercase-key)               | Keys are in uppercase                             | Yes     |
| [quote-character](#quote-character)           | Values have no quotes they do not need            | Yes     |
| [schema-violation](#schema-violation)         | The file follows a schema                         | No      |
| [space-character](#space-character)           | There are no spaces around the equal sign         | Yes     |
| [substitution-key](#substitution-key)         | Variable references are well formed               | Yes     |
| [trailing-whitespace](#trailing-whitespace)   | Lines do not end with a space                     | Yes     |
| [unordered-key](#unordered-key)               | Keys are in alphabetical order within their group | Yes     |
| [value-without-quotes](#value-without-quotes) | Values with whitespace are quoted                 | Yes     |

### duplicated-key

Reports the second and later assignments of a key. The key is read without an
`export ` prefix, so `export A=1` and `A=2` clash. The fix comments the repeated
line out.

### ending-blank-line

Reports a file whose last line is not followed by a line break. The fix adds it,
using the line breaks the file already uses.

### extra-blank-line

Reports a blank line that follows another blank line, including a blank line
before the end of the file. The fix removes it.

### incorrect-delimiter

Reports a key that has anything but letters, digits and underscores after its
first valid character, such as `RAILS-ENV`. The fix replaces each such
character with an underscore.

### key-without-value

Reports a line that has no `=`. The fix adds the `=`.

### leading-character

Reports a line that does not start with a letter or an underscore, including
one that starts with a space. The fix removes the leading characters that are
not valid.

### lowercase-key

Reports a key that is not in uppercase. The fix uppercases it.

### quote-character

Reports a value with quotes it does not need, such as `A='b'`. Quotes are left
alone when the value has whitespace, an escaped newline, or any of `$`, `#`, `&`
and `=`. The fix removes the quotes.

### schema-violation

Checks the file against a dotenv-linter schema. It does nothing without the
`schema` option, which is either a path to a schema file, relative to the
directory ESLint runs in, or the schema itself:

```javascript
{
  'dotenv/schema-violation': ['error', { schema: 'dotenv.schema.json' }],
}
```

A schema is the same JSON file dotenv-linter reads with `--schema`:

```json
{
  "version": "1.0.0",
  "allow_other_keys": false,
  "entries": {
    "NAME": { "type": "String", "regex": "^[A-Z]+$", "required": true },
    "PORT": { "type": "Integer" },
    "PRICE": { "type": "Float" },
    "SITE": { "type": "Url" },
    "CONTACT": { "type": "Email" },
    "DEBUG": { "type": "Boolean" }
  }
}
```

The rule reports a key the schema does not list (unless `allow_other_keys` is
`true`), a value that does not match its type and a required key that is
missing. An `Integer` is a number that fits in 32 bits, a `Float` is any number
Rust parses as a float (including `inf` and `NaN`), a `Boolean` is one of
`true`, `false`, `yes`, `no`, `1` and `0` in lowercase or uppercase, and a `String`
with a `regex` has to match it somewhere. There is no fix.

### space-character

Reports a line with a space just before or just after its only `=`. The fix
removes the spaces.

### substitution-key

Reports a reference to a variable with unbalanced braces or a name with invalid
characters, such as `${BAR`, `$BAR}` or `${BAR!}`. References in single-quoted
values and escaped ones (`\$BAR`) are ignored. The fix wraps a name in braces
where that is enough; a reference it cannot repair is reported without a fix.

### trailing-whitespace

Reports a line that ends with a space. The fix removes the trailing whitespace.

### unordered-key

Reports a key that should go before a key above it. Keys are compared within a
group, which ends at a blank line, at an ESLint directive comment, and before a
line whose value refers to a key of the group (so a reference never ends up
above the key it uses). Comments directly above a key travel with it. The fix
sorts the group.

### value-without-quotes

Reports a value that holds whitespace but is not quoted. The fix wraps the value
in double quotes.

## How it differs from dotenv-linter

The checks report the same problems on the same lines with the same messages;
this was compared with dotenv-linter on its own test inputs and on well over a thousand
generated files. Where the plugin behaves differently, it is on purpose:

- **Suppression** uses ESLint's comments. dotenv-linter's own
  `# dotenv-linter:off` and `# dotenv-linter:on` comments are not read.
- **A rule that is switched off for a stretch of lines still sees them**, so
  a key seen on a suppressed line still counts for `duplicated-key`.
- **Fixes keep `export`.** Where dotenv-linter's fix writes `KEY=value` for
  `export key=value`, the fix here writes `export KEY=value`.
- **Fixes keep the line breaks of the file**, where dotenv-linter writes `\n`.
- **`duplicated-key`** comments out every line of a duplicated multi-line
  value, not just the first.
- **`incorrect-delimiter`** leaves the whitespace before the `=` alone, where
  dotenv-linter turns it into an underscore.
- **`substitution-key`** keeps the text that follows the last reference.
- **`unordered-key`** does not add a `# Unordered because` comment, and a fix
  never reorders a file that has no unordered keys.
- **`extra-blank-line`** and **`ending-blank-line`** converge in one run of
  `eslint --fix`, so a fix never leaves a blank line that another rule then
  reports.
- **`schema-violation`** takes the schema from the rule options, and reports a
  missing required key on the last line of the file.

## Known Issues

- **Multi-line values** are read the way dotenv-linter reads them: a quoted
  value that is not closed on its own line runs on until the next line that
  contains the same quote. A quote that never closes does not swallow the rest
  of the file.
- **Email addresses** are checked by a JavaScript validator, where
  dotenv-linter uses a Rust crate that implements RFC 5322 more completely, so
  an unusual but valid address may be reported.
- **A schema with the same key twice** is accepted, and the last one wins,
  where dotenv-linter refuses to load it.

## Useful links

- **[dotenv-linter](https://github.com/dotenv-linter/dotenv-linter):** The
  tool whose checks this plugin ports.
- **[ESLint custom languages](https://eslint.org/docs/latest/extend/languages):**
  How a plugin adds a language to ESLint.

## Contributing

If you have suggestions for how this app could be improved, or
want to report a bug, open an issue - we'd love all and any
contributions.

## License

Apache License 2.0 © 2024 Mridang Agarwalla
