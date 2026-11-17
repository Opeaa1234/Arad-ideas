import test from 'node:test';
import assert from 'node:assert/strict';
import { createUserStore } from '../js/store.js';

test('clears cached scores for every requested place without touching another account', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const values = new Map();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: key => values.has(key) ? values.get(key) : null,
      setItem: (key, value) => values.set(key, String(value)),
      removeItem: key => values.delete(key),
    },
  });

  try {
    const current = createUserStore('current-user');
    const other = createUserStore('other-user');
    current.setBest('route-one-place', 3);
    current.setBest('route-two-place', 2);
    other.setBest('route-one-place', 1);

    current.clearBests(['route-one-place', 'route-two-place']);

    assert.equal(current.getBest('route-one-place'), undefined);
    assert.equal(current.getBest('route-two-place'), undefined);
    assert.equal(other.getBest('route-one-place'), 1);
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor);
    else delete globalThis.localStorage;
  }
});
