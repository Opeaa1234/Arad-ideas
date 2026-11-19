import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(path, import.meta.url), 'utf8');

test('session storage lookup errors are not interpreted as a signed-out account', async () => {
  const [dbAuth, auth] = await Promise.all([
    read('../database/auth.js'), read('../js/auth.js')
  ]);
  assert.match(dbAuth, /error: sessionError[\\s\\S]*?if \\(sessionError\\) throw sessionError[\\s\\S]*?if \\(!sessionData\\.session\\) return null/);
  assert.match(auth, /async getCurrentUser\(\)[\s\S]*?could not verify the current session[\s\S]*?throw new Error\(authFailure\(e\)\)/);
  assert.doesNotMatch(auth, /catch \(e\) \{ console\.warn\('\[auth\] no session', e\); return null; \}/);
});

test('failed sign-out preserves the current account until the server confirms logout', async () => {
  const [auth, app] = await Promise.all([
    read('../js/auth.js'), read('../js/app.js')
  ]);
  assert.match(auth, /async signOut\(\)[\s\S]*?await b\.signOut\(\)[\s\S]*?throw new Error\(authFailure\(e\)\)/);
  const signOut = app.slice(app.indexOf('async function signOut()'), app.indexOf('function toggleMenu'));
  assert.ok(signOut.indexOf('await auth.signOut()') < signOut.indexOf('S.user = null'));
  assert.match(signOut, /catch \(err\)[\s\S]*?return;/);
});

test('profile lookup failure remains a display-name fallback, not a session failure', async () => {
  const auth = await read('../js/auth.js');
  assert.match(auth, /const p = await b\.getMyProfile\(\)[\s\S]*?catch \{ \/\* profile row may not exist yet \*\/ \}/);
});
