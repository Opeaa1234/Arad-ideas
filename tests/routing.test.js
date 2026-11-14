import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchRoute } from '../js/routing.js';

function mockTimers(t) {
  const originalSetTimeout = globalThis.setTimeout;
  const originalClearTimeout = globalThis.clearTimeout;
  const cleared = [];
  let nextId = 1;
  globalThis.setTimeout = () => nextId++;
  globalThis.clearTimeout = id => cleared.push(id);
  t.after(() => {
    globalThis.setTimeout = originalSetTimeout;
    globalThis.clearTimeout = originalClearTimeout;
  });
  return cleared;
}

test('clears the request timeout when a routing server rejects', async t => {
  const cleared = mockTimers(t);
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    throw new Error('network unavailable');
  };
  t.after(() => { globalThis.fetch = originalFetch; });

  const result = await fetchRoute(
    { lat: 46.17, lon: 21.32 },
    { lat: 46.18, lon: 21.33 }
  );

  assert.equal(result, null);
  assert.equal(calls, 3);
  assert.deepEqual(cleared, [1, 2, 3]);
});

test('clears the request timeout after a successful route response', async t => {
  const cleared = mockTimers(t);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({
      code: 'Ok',
      routes: [{
        geometry: { coordinates: [[21.32, 46.17], [21.33, 46.18]] },
        distance: 1200,
        duration: 900,
        legs: [{ steps: [] }]
      }]
    })
  });
  t.after(() => { globalThis.fetch = originalFetch; });

  const result = await fetchRoute(
    { lat: 46.17, lon: 21.32 },
    { lat: 46.18, lon: 21.33 }
  );

  assert.equal(result.label, 'Traseu pietonal');
  assert.deepEqual(result.coords, [[46.17, 21.32], [46.18, 21.33]]);
  assert.deepEqual(cleared, [1]);
});
