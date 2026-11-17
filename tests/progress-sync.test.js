import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeRemoteProgress } from '../js/progress-sync.js';

const valid = new Set(['place-a', 'place-b', 'sidequest-a']);

test('merges remote completions into a device that already has local progress', () => {
  const local = { discovered: ['place-a'], completed: [], custom: true };
  const result = mergeRemoteProgress(local, { 'place-b': 2, 'sidequest-a': 0 }, valid);
  assert.equal(result.changed, true);
  assert.deepEqual(result.progress.discovered, ['place-a', 'place-b', 'sidequest-a']);
  assert.deepEqual(result.progress.completed, ['place-b', 'sidequest-a']);
  assert.equal(result.progress.custom, true);
  assert.deepEqual(local, { discovered: ['place-a'], completed: [], custom: true });
});

test('keeps local progress and ignores unknown or invalid remote results', () => {
  const local = { discovered: ['place-a'], completed: ['place-a'] };
  const result = mergeRemoteProgress(local, {
    'unknown-place': 3,
    'place-b': -1,
    'sidequest-a': 'not-a-score',
  }, valid);
  assert.equal(result.changed, false);
  assert.deepEqual(result.progress, local);
});

test('is idempotent when the remote results have already been merged', () => {
  const first = mergeRemoteProgress(
    { discovered: ['place-a'], completed: [] },
    { 'place-b': 1 },
    valid,
  );
  const second = mergeRemoteProgress(first.progress, { 'place-b': 1 }, valid);
  assert.equal(first.changed, true);
  assert.equal(second.changed, false);
  assert.deepEqual(second.progress, first.progress);
});

test('supports a fresh device and zero-score completed quizzes', () => {
  const result = mergeRemoteProgress(
    { discovered: [], completed: [] },
    { 'place-a': 0 },
    valid,
  );
  assert.equal(result.changed, true);
  assert.deepEqual(result.progress, { discovered: ['place-a'], completed: ['place-a'] });
});
