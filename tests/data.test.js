import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadTrail } from '../js/data.js';

const source = await readFile(new URL('../data/game-data.json', import.meta.url), 'utf8');
const fixture = () => ({
  routes: [{ id: 'route-1', name: 'Route 1', locationIds: ['place-1'] }],
  places: [{
    id: 'place-1', name: 'Place 1', lat: 46.17, lon: 21.32,
    trivia: [{ q: 'Question?', o: ['A', 'B'], a: 1 }]
  }],
  sidequests: [{ id: 'place-1', category: 'bonus' }]
});

async function withData(t, data) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: true, json: async () => data });
  t.after(() => { globalThis.fetch = originalFetch; });
  return loadTrail();
}

test('loads the complete Arad catalogue and preserves intentional placeholders', async t => {
  const originalFetch = globalThis.fetch;
  const data = JSON.parse(source);
  globalThis.fetch = async () => ({ ok: true, json: async () => data });
  t.after(() => { globalThis.fetch = originalFetch; });

  const result = await loadTrail();
  assert.equal(result.places.length, 31);
  assert.equal(result.routes.length, 3);
  assert.equal(result.sidequests.length, 10);
  const pianoHouse = result.places.find(place => place.id === 'casa-pianului');
  assert.match(pianoHouse.trivia[0].q, /primului fotoclub din Arad/i);
  assert.equal(pianoHouse.trivia[0].o[pianoHouse.trivia[0].a], '1906');
  assert.equal(pianoHouse.trivia[0].placeholder, undefined);
});

test('rejects duplicate location ids', async t => {
  const data = fixture();
  data.places.push({ ...data.places[0] });
  await assert.rejects(withData(t, data), /Duplicate location id/);
});

test('rejects coordinates outside geographic bounds', async t => {
  const data = fixture();
  data.places[0].lat = 91;
  await assert.rejects(withData(t, data), /valid latitude and longitude/);
});

test('rejects invalid answer indexes but accepts marked placeholders', async t => {
  const data = fixture();
  data.places[0].trivia[0].a = 3;
  await assert.rejects(withData(t, data), /valid answer index/);

  const placeholderData = fixture();
  placeholderData.places[0].trivia = [{ q: 'Draft question', o: [], a: -1, placeholder: true }];
  const result = await withData(t, placeholderData);
  assert.equal(result.places[0].trivia[0].placeholder, true);
});

test('rejects unknown and duplicate route locations', async t => {
  const unknown = fixture();
  unknown.routes[0].locationIds = ['missing'];
  await assert.rejects(withData(t, unknown), /Unknown location/);

  const duplicate = fixture();
  duplicate.routes[0].locationIds = ['place-1', 'place-1'];
  await assert.rejects(withData(t, duplicate), /Duplicate location/);
});

test('rejects unknown side quests', async t => {
  const data = fixture();
  data.sidequests[0].id = 'missing';
  await assert.rejects(withData(t, data), /Unknown side quest location/);
});


test('rejects non-text photo metadata before rendering a place', async t => {
  for (const field of ['photo', 'photoCredit', 'wikipedia']) {
    const data = fixture();
    data.places[0][field] = { unexpected: true };
    await assert.rejects(withData(t, data), new RegExp('invalid "' + field + '" field'));
  }
});

test('rejects malformed visitor-facing story text', async t => {
  for (const text of [{ unexpected: true }, ['A valid paragraph', 42], ['   ']]) {
    const data = fixture();
    data.places[0].text = text;
    await assert.rejects(withData(t, data), /story text as an array of non-empty strings/);
  }
});

test('rejects malformed trivia containers instead of silently hiding questions', async t => {
  const data = fixture();
  data.places[0].trivia = { q: 'Question?', o: ['A', 'B'], a: 0 };
  await assert.rejects(withData(t, data), /needs trivia as an array/);
});

test('accepts missing optional story text and normalizes it to an empty array', async t => {
  const data = fixture();
  delete data.places[0].text;
  const result = await withData(t, data);
  assert.deepEqual(result.places[0].text, []);
});
