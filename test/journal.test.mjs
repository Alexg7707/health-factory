import assert from 'node:assert/strict';
import test from 'node:test';
import { Journal, isDay, validDate, weekDates, summarize } from '../dist/journal-model.js';

const entry = { habits: ['breakfast', 'hobby'] };
test('Monday–Sunday weeks cross month and year boundaries correctly', () => {
  assert.deepEqual(weekDates('2027-01-03'), ['2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02', '2027-01-03']);
  assert.equal(weekDates('2026-11-01')[0], '2026-10-26');
  assert.equal(validDate('2027-02-29'), false);
  assert.equal(validDate('2028-02-29'), true);
});

test('weekly counts describe only days and habits actually recorded', () => {
  assert.deepEqual(summarize([entry, undefined, { habits: ['hobby', 'move'] }]),
    { entries: 2, counts: { breakfast: 1, lunch: 0, dinner: 0, snack: 0, move: 1, hobby: 2 } });
});

test('a day saved by the previous edition still contributes to weekly counts', () => {
  const storage = new Map([['health-factory.journal.v1.2026-11-21', '{"habits":["snack","hobby"]}']]);
  const journal = new Journal({ getItem: key => storage.get(key) ?? null });
  const week = weekDates('2026-11-21').map(key => journal.get(key));
  const { entries, counts } = summarize(week);
  assert.equal(entries, 1);
  assert.equal(counts.snack, 1);
  assert.equal(counts.hobby, 1);
});

test('each date survives reopening and removing it preserves other entries', () => {
  const map = new Map();
  const storage = { getItem: k => map.get(k), setItem: (k,v) => map.set(k,v), removeItem: k => map.delete(k) };
  const journal = new Journal(storage);
  assert.equal(journal.set('2026-11-21', entry), true);
  new Journal(storage).set('2026-11-22', { habits: ['snack'] });
  assert.deepEqual(new Journal(storage).get('2026-11-21'), entry);
  journal.set('2026-11-21', null);
  assert.equal(journal.get('2026-11-21'), undefined);
  assert.deepEqual(journal.get('2026-11-22'), { habits: ['snack'] });
});

test('damaged entries are ignored and session data remains usable when storage throws', () => {
  assert.equal(isDay({ habits: ['breakfast','breakfast'] }), false);
  const fail = () => { throw new Error('Denied'); };
  for (const raw of ['{', '{"habits":["constructor"]}', 'null']) {
    const journal = new Journal({ getItem: () => raw, setItem: fail, removeItem: fail });
    assert.equal(journal.get('2026-11-21'), undefined);
    assert.equal(journal.set('2026-11-21', entry), false);
    assert.deepEqual(journal.get('2026-11-21'), entry);
    journal.set('2026-11-21', null);
    assert.equal(journal.get('2026-11-21'), undefined);
  }
});

