import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const appSource = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');

test('GPS watcher stops when leaving the walking map', () => {
  const showScreen = appSource.match(/function showScreen\(name\) \{([\s\S]*?)\n\}/);
  assert.ok(showScreen, 'showScreen function exists');
  assert.match(showScreen[1], /screen === 'app' && name !== 'app'\) stopGPS\(\)/);
});

test('returning to the walking map resumes GPS after the screen is visible', () => {
  const showMapScreen = appSource.match(/function showMapScreen\(\) \{([\s\S]*?)\n\}/);
  assert.ok(showMapScreen, 'showMapScreen helper exists');
  assert.match(showMapScreen[1], /showScreen\('app'\)/);
  assert.match(showMapScreen[1], /if \(S\.watchId === null\) startGPS\(\)/);
  assert.match(appSource, /function openMap\(\) \{\s*if \(S\.selectedRouteId && map\) \{ showMapScreen\(\); return; \}/);
  assert.match(appSource, /if \(prevScreen === 'app' && map\) \{ showMapScreen\(\); \}/);
  assert.match(appSource, /case 'backtomap': showMapScreen\(\); break;/);
});
