import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(path, import.meta.url), 'utf8');

test('offline shell caches only the explicit public app asset allowlist', async () => {
  const sw = await read('../sw.js');
  assert.match(sw, /const SHELL_ASSETS = \[/);
  assert.match(sw, /data\/game-data\.json/);
  assert.match(sw, /vendor\/leaflet\/leaflet\.js/);
  assert.match(sw, /ALLOWED_PATHS\.has\(url\.pathname\)/);
  assert.match(sw, /url\.origin !== self\.location\.origin/);
  assert.match(sw, /request\.method !== 'GET'/);
  assert.match(sw, /Never intercept cross-origin traffic/);
  assert.match(sw, /prevents caching auth\/session\/API responses/);
});

test('offline registration is optional and requires a secure context', async () => {
  const app = await read('../js/app.js');
  assert.match(app, /function registerOfflineShell\(\)[\s\S]*?window\.isSecureContext[\s\S]*?navigator\.serviceWorker\.register\('\.\/sw\.js'\)/);
  assert.match(app, /registerOfflineShell\(\);/);
  assert.match(app, /console\.warn\(.*app shell registration failed/);
});
