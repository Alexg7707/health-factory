import { Journal, dateKey, habits, isDay, shiftDate, summarize, validDate, weekDates, type Habit } from './journal-model.js';

const form = document.querySelector<HTMLFormElement>('#day-form')!;
const date = form.querySelector<HTMLInputElement>('[name="date"]')!;
const boxes = Array.from(form.querySelectorAll<HTMLInputElement>('[name="habit"]'));
const remove = document.querySelector<HTMLButtonElement>('#delete-day')!;
const status = document.querySelector<HTMLElement>('#journal-status')!;
const daysPanel = document.querySelector<HTMLElement>('#week-days')!;
const countList = document.querySelector<HTMLElement>('#week-counts')!;
const shortDay = new Intl.DateTimeFormat('ru', { weekday: 'short', timeZone: 'UTC' });
const fullDay = new Intl.DateTimeFormat('ru', { dateStyle: 'long', timeZone: 'UTC' });
const names: Record<Habit, string> = { breakfast: 'Завтрак', lunch: 'Обед', dinner: 'Ужин', snack: 'Перекус', move: 'Движение', hobby: 'Хобби' };
let storage: Storage | undefined;
try { storage = window.localStorage; } catch { /* Private browsing can restrict storage. */ }
const journal = new Journal(storage);
let selected = dateKey(new Date());

function render() {
  date.value = selected;
  const entry = journal.get(selected);
  for (const box of boxes) box.checked = entry?.habits.some(habit => habit === box.value) ?? false;
  remove.hidden = !entry;
  const dates = weekDates(selected);
  const entries = dates.map(key => journal.get(key));
  const summary = summarize(entries);
  const label = (key: string) => fullDay.format(new Date(key + 'T12:00:00Z'));
  document.querySelector('#week-range')!.textContent = label(dates[0]!) + ' — ' + label(dates[6]!);
  daysPanel.replaceChildren(...dates.map((key, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.date = key;
    button.className = entries[index] ? 'week-day has-entry' : 'week-day';
    button.setAttribute('aria-pressed', String(key === selected));
    button.setAttribute('aria-label', label(key) + (entries[index] ? ', есть запись' : ', без записи'));
    const weekday = document.createElement('small');
    weekday.textContent = shortDay.format(new Date(key + 'T12:00:00Z'));
    const number = document.createElement('strong');
    number.textContent = String(Number(key.slice(-2)));
    button.append(weekday, number);
    return button;
  }));
  const caption = document.querySelector('#week-caption')!;
  caption.textContent = summary.entries ? `Дней с записью: ${summary.entries} из 7.` : 'Пока нет записей за эту неделю. Выберите день и добавьте отметку.';
  countList.replaceChildren(...habits.map(habit => {
    const item = document.createElement('li');
    const total = document.createElement('strong');
    total.textContent = `${summary.counts[habit]} / 7`;
    item.append(names[habit], total);
    return item;
  }));
}

function selectDay(key: string) {
  if (!validDate(key)) return;
  selected = key;
  status.textContent = '';
  render();
}

form.addEventListener('submit', event => event.preventDefault());
date.addEventListener('change', () => {
  if (validDate(date.value)) selectDay(date.value);
  else { date.value = selected; status.textContent = 'Выберите существующую дату.'; }
});

form.addEventListener('change', event => {
  if (event.target === date) return;
  const day = { habits: boxes.filter(box => box.checked).map(box => box.value) };
  if (!isDay(day)) return;
  const persisted = journal.set(selected, day.habits.length ? day : null);
  render();
  status.textContent = persisted ? 'Сохранено в этом браузере.' : 'Изменения доступны в этой вкладке. Хранилище браузера недоступно.';
});

remove.addEventListener('click', () => {
  const persisted = journal.set(selected, null);
  render();
  status.textContent = persisted ? 'Запись за этот день удалена.' : 'Запись скрыта в этой вкладке. Хранилище браузера недоступно.';
  date.focus();
});

daysPanel.addEventListener('click', event => {
  if (!(event.target instanceof Element)) return;
  const key = event.target.closest('button')?.dataset.date;
  if (!key) return;
  selectDay(key);
  daysPanel.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus();
});

document.querySelector('#prev-week')!.addEventListener('click', () => selectDay(shiftDate(selected, -7)));
document.querySelector('#next-week')!.addEventListener('click', () => selectDay(shiftDate(selected, 7)));
window.addEventListener('storage', render);
render();
