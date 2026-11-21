export const habits = ['breakfast', 'lunch', 'dinner', 'snack', 'move', 'hobby'] as const;
export type Habit = typeof habits[number];
export interface Day { habits: Habit[] }

export function isDay(value: unknown): value is Day {
  if (!value || typeof value !== 'object' || !('habits' in value)) return false;
  return Array.isArray(value.habits) &&
    value.habits.every(item => habits.some(habit => habit === item)) &&
    new Set(value.habits).size === value.habits.length;
}

export function dateKey(date: Date): string {
  return [String(date.getFullYear()).padStart(4, '0'), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

export function validDate(key: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const date = new Date(key + 'T12:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === key;
}

export function shiftDate(key: string, offset: number): string {
  const date = new Date(key + 'T12:00:00Z');
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

export function weekDates(key: string): string[] {
  const day = new Date(key + 'T12:00:00Z').getUTCDay();
  const monday = shiftDate(key, -((day + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => shiftDate(monday, index));
}

export function summarize(days: readonly (Day | undefined)[]) {
  const counts: Record<Habit, number> = { breakfast: 0, lunch: 0, dinner: 0, snack: 0, move: 0, hobby: 0 };
  let entries = 0;
  for (const day of days) {
    if (!day) continue;
    entries++;
    for (const habit of day.habits) counts[habit]++;
  }
  return { entries, counts };
}

type JournalStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
const prefix = 'health-factory.journal.v1.';
export class Journal {
  private readonly fallback = new Map<string, Day | null>();
  constructor(private readonly storage?: JournalStorage) {}

  get(key: string): Day | undefined {
    if (!validDate(key)) return;
    if (this.fallback.has(key)) return this.fallback.get(key) ?? undefined;
    try {
      const raw = this.storage?.getItem(prefix + key);
      if (!raw) return;
      const entry: unknown = JSON.parse(raw);
      return isDay(entry) ? entry : undefined;
    } catch { return; }
  }

  set(key: string, entry: Day | null): boolean {
    if (!validDate(key) || (entry !== null && !isDay(entry))) return false;
    try {
      if (this.storage) {
        if (entry === null) this.storage.removeItem(prefix + key);
        else this.storage.setItem(prefix + key, JSON.stringify(entry));
        this.fallback.delete(key);
        return true;
      }
    } catch { /* Keep this session's changes when storage is blocked or full. */ }
    this.fallback.set(key, entry);
    return false;
  }
}

