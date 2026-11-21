import { describePlan, isPlan, readPlan, storePlan, type Plan } from './planner.js';

const form = document.querySelector<HTMLFormElement>('#plan-form')!;
const meal = form.querySelector<HTMLSelectElement>('[name="meal"]')!;
const habit = form.querySelector<HTMLSelectElement>('[name="habit"]')!;
const result = document.querySelector<HTMLElement>('#plan-result')!;
const clear = document.querySelector<HTMLButtonElement>('#clear-plan')!;

let storage: Storage | undefined;
try {
  storage = window.localStorage;
} catch {
  // Browser privacy settings can deny access even to the storage getter.
}

function showPlan(plan: Plan, deviceSaved: boolean) {
  const title = document.createElement('strong');
  title.textContent = 'Your meal and habit';
  const paragraphs = describePlan(plan).map(text => {
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    return paragraph;
  });
  result.replaceChildren(title, ...paragraphs);
  if (!deviceSaved) {
    const note = document.createElement('small');
    note.textContent = 'Browser storage is unavailable. Your selection lasts until you leave this page.';
    result.append(note);
  }
  clear.hidden = false;
}

const previous = readPlan(storage);
if (previous) {
  meal.value = previous.meal;
  habit.value = previous.habit;
  showPlan(previous, true);
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const plan = { meal: meal.value, habit: habit.value };
  if (!isPlan(plan)) {
    result.textContent = 'Choose a meal and a habit from the lists.';
    return;
  }
  showPlan(plan, storePlan(storage, plan));
});

clear.addEventListener('click', () => {
  const removed = storePlan(storage, null);
  form.reset();
  clear.hidden = true;
  result.textContent = removed ? 'Selection cleared.' : 'Selection cleared from this page. Browser storage is unavailable.';
  meal.focus();
});
