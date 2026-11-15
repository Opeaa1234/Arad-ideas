import test from 'node:test';
import assert from 'node:assert/strict';
import { LOC, LOC_TOTAL } from '../js/game/locations.js';

test('pixel game catalogue contains the expected 20 locations', () => {
  assert.equal(LOC_TOTAL, 20);
  assert.equal(Object.keys(LOC).length, LOC_TOTAL);
});

test('every pixel game location has three complete, unambiguous quiz questions', () => {
  for (const [id, place] of Object.entries(LOC)) {
    assert.equal(typeof place.name, 'string', id + ' needs a display name');
    assert.ok(place.name.trim(), id + ' needs a non-empty display name');
    assert.ok(Array.isArray(place.quiz), id + ' needs a quiz');
    assert.equal(place.quiz.length, 3, id + ' must have exactly three questions');

    for (const [index, question] of place.quiz.entries()) {
      assert.ok(Array.isArray(question), id + ' question ' + (index + 1) + ' must be an array');
      assert.equal(question.length, 3, id + ' question ' + (index + 1) + ' must contain prompt, answer and distractors');
      const [prompt, answer, wrongAnswers] = question;
      assert.equal(typeof prompt, 'string', id + ' question ' + (index + 1) + ' needs a prompt');
      assert.ok(prompt.trim(), id + ' question ' + (index + 1) + ' needs a non-empty prompt');
      assert.equal(typeof answer, 'string', id + ' question ' + (index + 1) + ' needs a correct answer');
      assert.ok(answer.trim(), id + ' question ' + (index + 1) + ' needs a non-empty correct answer');
      assert.ok(Array.isArray(wrongAnswers), id + ' question ' + (index + 1) + ' needs wrong-answer options');
      assert.equal(wrongAnswers.length, 3, id + ' question ' + (index + 1) + ' needs exactly three wrong answers');

      const options = [answer, ...wrongAnswers];
      assert.ok(options.every(option => typeof option === 'string' && option.trim()),
        id + ' question ' + (index + 1) + ' options must be non-empty strings');
      assert.equal(new Set(options.map(option => option.trim().toLocaleLowerCase('ro'))).size, 4,
        id + ' question ' + (index + 1) + ' must have four distinct options');
    }
  }
});
