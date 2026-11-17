import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const catalogue = JSON.parse(await readFile(new URL('../data/game-data.json', import.meta.url), 'utf8'));
const sql = await readFile(new URL('../database/leaderboard.sql', import.meta.url), 'utf8');

test('leaderboard SQL allowlist exactly matches the live place catalogue and quiz sizes', () => {
  const section = sql.match(/from\s*\(values([\s\S]*?)\)\s+as allowed\(place_id, question_count\)/i);
  assert.ok(section, 'record_place_result contains a place/question allowlist');

  const allowed = [...section[1].matchAll(/\(\s*'([^']+)'\s*,\s*(\d+)\s*\)/g)]
    .map(([, id, count]) => [id, Number(count)])
    .sort(([a], [b]) => a.localeCompare(b));
  const expected = catalogue.places
    .map(place => [place.id, (place.trivia || []).length])
    .sort(([a], [b]) => a.localeCompare(b));

  assert.deepEqual(allowed, expected,
    'Update database/leaderboard.sql whenever a place or its question count changes');
  assert.equal(new Set(allowed.map(([id]) => id)).size, allowed.length,
    'the SQL allowlist must not contain duplicate place IDs');
});
