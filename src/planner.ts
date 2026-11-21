const meals = {
  breakfast: 'Завтрак: овсянка с яблоком, корицей и ложкой йогурта. Нарежьте яблоко, пока варятся хлопья.',
  lunch: 'Обед: гречка с нутом, огурцом и зеленью. Добавьте любимую заправку перед подачей.',
  dinner: 'Ужин: запечённые овощи с белой фасолью. Добавьте фасоль к овощам в конце приготовления.',
} as const;

const habits = {
  walk: 'Прогулка: выберите короткий маршрут, который впишется в ваш день.',
  break: 'Перерыв: между делами отложите телефон и ненадолго переключитесь на занятие вне экрана.',
  water: 'Вода: поставьте стакан или бутылку там, где вы обычно делаете перерыв.',
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
