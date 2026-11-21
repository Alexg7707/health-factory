import assert from 'node:assert/strict';
import test from 'node:test';
import { describePlan, isPlan, readPlan, storageKey, storePlan } from '../dist/planner.js';

function memoryStorage() {
  const values = new Map();
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  };
}

test('each combination includes a distinct meal and habit', () => {
  const meals = new Set();
  const habits = new Set();
  for (const meal of ['breakfast', 'lunch', 'dinner']) {
    for (const habit of ['walk', 'break', 'water']) {
      assert.ok(isPlan({ meal, habit }));
      const [recipe, suggestion] = describePlan({ meal, habit });
      meals.add(recipe);
      habits.add(suggestion);
      assert.ok(recipe.length && suggestion.length);
    }
  }
  assert.equal(meals.size, 3);
  assert.equal(habits.size, 3);
});

test('reopening restores the latest choice and clearing removes only the plan', () => {
  const storage = memoryStorage();
  storage.setItem('other-site-data', 'keep');
  assert.equal(storePlan(storage, { meal: 'breakfast', habit: 'walk' }), true);
  const updated = { meal: 'lunch', habit: 'water' };
  assert.equal(storePlan(storage, updated), true);
  assert.deepEqual(readPlan(storage), updated);
  assert.equal(storePlan(storage, null), true);
  assert.equal(readPlan(storage), undefined);
  assert.equal(storage.getItem('other-site-data'), 'keep');
});

test('invalid or old stored choices are ignored', () => {
  const storage = memoryStorage();
  for (const invalid of ['{', 'null', '42', '{}', '{"meal":"lunch","habit":"constructor"}', '{"meal":"__proto__","habit":"walk"}']) {
    storage.setItem(storageKey, invalid);
    assert.equal(readPlan(storage), undefined);
  }
});

test('a blocked or full storage does not prevent generating a plan', () => {
  const fail = () => { throw new Error('Access denied'); };
  for (const storage of [undefined, { getItem: fail, setItem: fail, removeItem: fail }]) {
    assert.equal(readPlan(storage), undefined);
    assert.equal(storePlan(storage, { meal: 'lunch', habit: 'walk' }), false);
    assert.equal(storePlan(storage, null), false);
    assert.match(describePlan({ meal: 'lunch', habit: 'walk' })[0], /Обед/);
  }
});
