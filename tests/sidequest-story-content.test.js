import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const data = JSON.parse(await readFile(new URL('../data/game-data.json', import.meta.url), 'utf8'));

test('side quests have stories unless the location is explicitly unverified', () => {
  const byId = new Map(data.places.map(place => [place.id, place]));
  const intentionallyUnverified = new Set(['ar-ski-shop']);
  for (const quest of data.sidequests) {
    if (intentionallyUnverified.has(quest.id)) continue;
    const place = byId.get(quest.id);
    assert.ok(place && Array.isArray(place.text) && place.text.length >= 1, quest.id + ' has a side-quest story');
    assert.ok(place.text.every(paragraph => typeof paragraph === 'string' && paragraph.trim().length > 40), quest.id + ' story paragraphs are useful');
  }
});

test('Agora Arad quiz reflects currently advertised entertainment', () => {
  const place = data.places.find(item => item.id === 'agora-mall');
  assert.equal(place.trivia[0].a, 1);
  assert.equal(place.trivia[0].o[place.trivia[0].a], 'Bowling');
  assert.doesNotMatch(place.trivia[0].q, /subsol/i);
});

test('Gloria quiz points to the public athletics track, not unavailable throwing sectors', () => {
  const place = data.places.find(item => item.id === 'stadion-gloria');
  assert.equal(place.trivia[0].o[place.trivia[0].a], 'Alergarea');
});
