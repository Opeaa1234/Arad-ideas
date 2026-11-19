import test from 'node:test';
import assert from 'node:assert/strict';
import { cardinal } from '../js/geo.js';

test('cardinal normalizes bearings at and beyond the compass wraparound', () => {
  assert.equal(cardinal(0), 'nord');
  assert.equal(cardinal(360), 'nord');
  assert.equal(cardinal(720), 'nord');
  assert.equal(cardinal(-22.5), 'nord-nord-vest');
  assert.equal(cardinal(90), 'est');
  assert.equal(cardinal(180), 'sud');
  assert.equal(cardinal(270), 'vest');
});

test('cardinal safely defaults non-finite bearings to north', () => {
  assert.equal(cardinal(Number.NaN), 'nord');
  assert.equal(cardinal(Number.POSITIVE_INFINITY), 'nord');
});


test('GPS positions require explicit finite accuracy within the safety limit', async () => {
  const { isUsablePosition } = await import('../js/geo.js');
  assert.equal(isUsablePosition({ lat: 46, lon: 21, acc: 0 }), true);
  assert.equal(isUsablePosition({ lat: 46, lon: 21, acc: null }), false);
  assert.equal(isUsablePosition({ lat: 46, lon: 21 }), false);
  assert.equal(isUsablePosition({ lat: 46, lon: 21, acc: 36 }), false);
  assert.equal(isUsablePosition({ lat: 46, lon: 21, acc: -1 }), false);
});

test('discovery geofence includes GPS uncertainty conservatively', async () => {
  const { isConfidentlyWithinRadius } = await import('../js/geo.js');
  const target = { lat: 46, lon: 21 };
  assert.equal(isConfidentlyWithinRadius({ ...target, acc: 20 }, target, 72), true);
  assert.equal(isConfidentlyWithinRadius({ lat: 46.0004, lon: 21, acc: 30 }, target, 72), false);
  assert.equal(isConfidentlyWithinRadius({ ...target, acc: null }, target, 72), false);
});
