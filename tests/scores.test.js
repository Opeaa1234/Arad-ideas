import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(path, import.meta.url), 'utf8');

test('cross-device scores and leaderboard share place_results', async () => {
  const [sql, scores, store, app] = await Promise.all([
    read('../database/leaderboard.sql'),
    read('../database/scores.js'),
    read('../js/store.js'),
    read('../js/app.js')
  ]);

  assert.match(sql, /create table if not exists public\.place_results/i);
  assert.match(sql, /create or replace function public\.get_my_place_results\(\)/i);
  assert.match(sql, /security invoker[\s\S]*?where r\.user_id = auth\.uid\(\)/i);
  assert.match(sql, /grant execute on function public\.get_my_place_results\(\) to authenticated/i);
  assert.match(sql, /create or replace function public\.record_place_result/i);
  assert.match(sql, /as \$fn\$[\s\S]*?\$fn\$;/);

  assert.match(scores, /rpc\('get_my_place_results'\)/);
  assert.doesNotMatch(scores, /from\('place_scores'\)/);
  assert.match(store, /Number\(r\.best_score\)/);
  assert.match(store, /recordPlaceResult\(placeId, score, maxScore\)/);
  assert.doesNotMatch(store, /saveRemoteScore/);
  assert.doesNotMatch(app, /saveRemoteScore/);
});

test('score RPC allowlist matches every real trail location and question count', async () => {
  const [sql, dataText] = await Promise.all([
    read('../database/leaderboard.sql'),
    read('../data/game-data.json')
  ]);
  const data = JSON.parse(dataText);
  for (const place of data.places) {
    const tuple = `('${place.id}', ${place.trivia.length})`;
    assert.ok(sql.includes(tuple), `missing score allowlist entry: ${tuple}`);
  }
});
