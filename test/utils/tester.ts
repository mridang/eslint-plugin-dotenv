/**
 * @file A rule tester that lints text with the dotenv language.
 */
import { RuleTester } from 'eslint';
import plugin from '../../src/index.js';

/** The rule tester every rule test uses, set up to read its code as a dotenv file. */
export const ruleTester = new RuleTester({
  plugins: { dotenv: plugin as never },
  language: 'dotenv/dotenv',
});
