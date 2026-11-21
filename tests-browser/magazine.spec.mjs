import { readdir } from 'node:fs/promises';
import { expect, test as base } from '@playwright/test';

const test = base.extend({
  baseURL: async ({}, use) => use(process.env.HEALTH_FACTORY_TEST_URL),
});

for (const [name, width] of [['desktop', 1440], ['mobile', 390]]) {
  test(`the ${name} cover opens a magazine article`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1170 });
    await page.goto('/');
    await page.locator('.hero-image img').evaluate(image => image.decode());
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Then run.');
    await page.screenshot({ path: testInfo.outputPath(`${name}-cover.png`), animations: 'disabled' });
    await page.getByRole('link', { name: 'Read the running guide' }).click();
    await expect(page).toHaveURL(/\/running\.html$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your first run starts with a walk');
  });
}

test('a snack and habit survive reload and can be cleared', async ({ page }) => {
  await page.goto('/');
  const meal = page.getByRole('combobox', { name: 'Meal' });
  const habit = page.getByRole('combobox', { name: 'Habit' });
  const result = page.locator('#plan-result');
  await meal.selectOption('snack');
  await habit.selectOption('water');
  await page.getByRole('button', { name: 'Show my pairing' }).click();
  await expect(result).toContainText(/snack/i);
  await expect(result).toContainText(/water/i);
  await page.reload();
  await expect(meal).toHaveValue('snack');
  await expect(habit).toHaveValue('water');
  await expect(result).toContainText(/snack/i);
  await page.getByRole('button', { name: 'Clear selection' }).click();
  await page.reload();
  await expect(result).not.toContainText(/snack/i);
  await expect(page.locator('#clear-plan')).toBeHidden();
});

test('weekly diary persists, counts and clears a day', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-18T12:00:00Z'));
  await page.goto('/journal.html');
  const snack = page.getByRole('checkbox', { name: 'Snack' });
  const caption = page.locator('#week-caption');
  const emptyCaption = await caption.innerText();
  expect(emptyCaption.trim()).toBeTruthy();
  await snack.check();
  await expect(caption).not.toHaveText(emptyCaption);
  await expect(page.locator('#week-counts li').filter({ hasText: 'Snack' })).toContainText('1 / 7');
  await page.reload();
  await expect(snack).toBeChecked();
  await page.locator('#next-week').click();
  await expect(caption).toHaveText(emptyCaption);
  await page.locator('#prev-week').click();
  await expect(snack).toBeChecked();
  await page.locator('#delete-day').click();
  await page.reload();
  await expect(snack).not.toBeChecked();
  await expect(caption).toHaveText(emptyCaption);
});

test('every public page is in English and fits phone, tablet and desktop widths', async ({ page }) => {
  const pages = (await readdir(new URL('../public/', import.meta.url))).filter(file => file.endsWith('.html'));
  expect(pages).toContain('index.html');
  for (const width of [320, 390, 760, 980, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const file of pages) {
      await page.goto('/' + file);
      if (width === 320) {
        await expect(page.locator('html')).toHaveAttribute('lang', 'en');
        await expect(page.locator('body')).not.toContainText(/\p{Script=Cyrillic}/u);
      }
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, file + ' at ' + width + 'px').toBeLessThanOrEqual(0);
    }
  }
});
