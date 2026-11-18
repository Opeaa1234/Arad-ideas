import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const appSource = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');

test('GPS watcher stops when leaving the walking map', () => {
  const showScreen = appSource.match(/function showScreen\(name\) \{([\s\S]*?)\n\}/);
  assert.ok(showScreen, 'showScreen function exists');
  assert.match(showScreen[1], /screen === 'app' && name !== 'app'\) stopGPS\(\)/);
});

test('returning to the walking map resumes GPS', () => {
  const showMapScreen = appSource.match(/function showMapScreen\(\) \{([\s\S]*?)\n\}/);
  assert.ok(showMapScreen, 'showMapScreen helper exists');
  assert.match(showMapScreen[1], /showScreen\('app'\)/);
  assert.match(showMapScreen[1], /if \(S\.watchId === null\) startGPS\(\)/);
  assert.match(appSource, /function openMap\(\) \{\s*if \(S\.selectedRouteId && map\) \{ showMapScreen\(\); return; \}/);
  assert.match(appSource, /if \(prevScreen === 'app' && map\) \{ showMapScreen\(\); \}/);
  assert.match(appSource, /case 'backtomap': showMapScreen\(\); break;/);
});


test('pauses GPS in a hidden tab and resumes only for the active walking map', () => {
  const listener = appSource.match(/document\.addEventListener\('visibilitychange', \(\) => \{([\s\S]*?)\n  \}\);/);
  assert.ok(listener, 'visibilitychange listener exists');
  assert.match(listener[1], /if \(document\.hidden\) stopGPS\(\)/);
  assert.match(listener[1], /screen === 'app' && S\.user && !S\.sim && S\.watchId === null/);
  assert.match(listener[1], /startGPS\(\)/);
});

test('simulation mode stops GPS immediately and resumes it on the visible walking map', () => {
  const setSim = appSource.match(/function setSim\(on\) \{([\s\S]*?)\n\}/);
  assert.ok(setSim, 'setSim function exists');
  assert.match(setSim[1], /if \(on\) stopGPS\(\)/);
  assert.match(setSim[1], /if \(!on && screen === 'app' && S\.user && !document\.hidden && S\.watchId === null\) startGPS\(\)/);
});

test('ignores GPS success callbacks queued after leaving the map', () => {
  const onGPS = appSource.match(/function onGPS\(p\) \{([\s\S]*?)\n\}/);
  assert.ok(onGPS, 'onGPS callback exists');
  assert.match(onGPS[1], /screen !== 'app' \|\| !S\.user/);
  assert.match(onGPS[1], /return/);
});

test('ignores GPS errors after leaving the map or entering simulation mode', () => {
  const onGPSErr = appSource.match(/function onGPSErr\(err\) \{([\s\S]*?)\n\}/);
  assert.ok(onGPSErr, 'onGPSErr callback exists');
  assert.match(onGPSErr[1], /screen !== 'app' \|\| !S\.user \|\| S\.sim/);
  assert.match(onGPSErr[1], /return/);
});


test('GPS discovery requires two stable, accurate readings', () => {
  assert.match(appSource, /function hasStableNearbyFix\(p\)/);
  assert.match(appSource, /S\.gpsSamples\.length < 2/);
  assert.match(appSource, /haversine\(a\.lat, a\.lon, b\.lat, b\.lon\) > 25/);
  assert.match(appSource, /!hasStableNearbyFix\(p\)/);
});

test('missing GPS accuracy is preserved as unknown rather than zero', () => {
  assert.match(appSource, /acc: Number\.isFinite\(accuracy\) && accuracy >= 0 \? accuracy : null/);
});


test('stable GPS samples must be recent and from the current watch session', () => {
  assert.match(appSource, /S\.gpsSamples = \[\]/);
  assert.match(appSource, /b\.time - a\.time > 10000/);
  assert.match(appSource, /b\.time < a\.time/);
});
