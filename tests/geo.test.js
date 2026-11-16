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
