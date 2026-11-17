import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const data = JSON.parse(await readFile(new URL('../data/game-data.json', import.meta.url), 'utf8'));

test('Casa Pianului has a sourced story while remaining outside assigned routes and sidequests', () => {
  const place = data.places.find(item => item.id === 'casa-pianului');
  assert.ok(place, 'Casa Pianului exists in the catalogue');
  assert.ok(Array.isArray(place.text) && place.text.length >= 1);
  assert.ok(place.text.every(paragraph => typeof paragraph === 'string' && paragraph.trim().length > 40));
  assert.equal(data.routes.some(route => route.locationIds.includes('casa-pianului')), false);
  assert.equal(data.sidequests.some(quest => quest.id === 'casa-pianului'), false);
});
