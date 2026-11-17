import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const data = JSON.parse(await readFile(new URL('../data/game-data.json', import.meta.url), 'utf8'));

test('every stop on the third route has a visitor-facing story', () => {
  const byId = new Map(data.places.map(place => [place.id, place]));
  const route = data.routes.find(item => item.id === 'traseu-3');
  assert.ok(route, 'third route exists');
  for (const id of route.locationIds) {
    const place = byId.get(id);
    assert.ok(place, 'route place ' + id + ' exists');
    assert.ok(Array.isArray(place.text) && place.text.length >= 1, id + ' has story paragraphs');
    assert.ok(place.text.every(paragraph => typeof paragraph === 'string' && paragraph.trim().length > 40), id + ' story paragraphs are useful text');
  }
});
