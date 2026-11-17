import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MIN_PASSWORD,
  validateDisplayName,
  validateEmail,
  validatePassword,
} from '../js/auth.js';

test('display names are trimmed and internal whitespace is normalized', () => {
  assert.deepEqual(validateDisplayName('  Ana   Maria  '), { name: 'Ana Maria' });
});

test('display names support Romanian letters and documented punctuation', () => {
  assert.deepEqual(validateDisplayName('Ștefan-Ion.2'), { name: 'Ștefan-Ion.2' });
});

test('display names reject empty, too-short, too-long and unsupported characters', () => {
  assert.ok(validateDisplayName('').error);
  assert.ok(validateDisplayName('A').error);
  assert.ok(validateDisplayName('A'.repeat(25)).error);
  assert.ok(validateDisplayName('Ana<script>').error);
});

test('email validation trims surrounding whitespace and rejects malformed addresses', () => {
  assert.deepEqual(validateEmail('  ana@example.com  '), { email: 'ana@example.com' });
  assert.ok(validateEmail('ana.example.com').error);
  assert.ok(validateEmail('ana@').error);
});

test('password validation enforces the configured minimum without changing the value', () => {
  assert.equal(MIN_PASSWORD, 6);
  assert.deepEqual(validatePassword('secret'), { password: 'secret' });
  assert.ok(validatePassword('short').error);
});
