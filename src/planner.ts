const meals = {
  breakfast: 'While your oats simmer, dice an apple. Top the oats with the apple, a spoonful of yogurt and a pinch of cinnamon.',
  lunch: 'Toss cooked buckwheat with chickpeas, strips of roasted pepper and chopped parsley. Add your favorite dressing just before lunch.',
  snack: 'For a crunchy snack, cut an apple into wedges. Dip the apple wedges in plain yogurt with a pinch of cinnamon.',
  dinner: 'Roast chopped vegetables on a sheet pan. Fold in cooked white beans near the end so they warm through while the vegetables finish browning.',
} as const;

const habits = {
  walk: 'Take a short walk to a familiar landmark and back. Pick a route that fits the time you have.',
  break: 'Between tasks, put your phone down and spend a moment away from the screen. Look out the window or step outside.',
  water: 'Set a glass of water where you usually take a break, so it is within reach when you want a drink.',
} as const;

export interface Plan {
  meal: keyof typeof meals;
  habit: keyof typeof habits;
}

export const storageKey = 'health-factory.plan.v1';

export function isPlan(value: unknown): value is Plan {
  return typeof value === 'object' && value !== null &&
    'meal' in value && typeof value.meal === 'string' && Object.hasOwn(meals, value.meal) &&
    'habit' in value && typeof value.habit === 'string' && Object.hasOwn(habits, value.habit);
}

export function describePlan(plan: Plan): readonly [string, string] {
  return [meals[plan.meal], habits[plan.habit]];
}

type PlanStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function readPlan(storage: PlanStorage | undefined): Plan | undefined {
  try {
    const saved = storage?.getItem(storageKey);
    if (!saved) return;
    const plan: unknown = JSON.parse(saved);
    return isPlan(plan) ? { meal: plan.meal, habit: plan.habit } : undefined;
  } catch {
    return;
  }
}

export function storePlan(storage: PlanStorage | undefined, plan: Plan | null): boolean {
  if (!storage) return false;
  try {
    if (plan === null) storage.removeItem(storageKey);
    else storage.setItem(storageKey, JSON.stringify(plan));
    return true;
  } catch {
    return false;
  }
}
