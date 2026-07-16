import { expect, mockApi, test } from './fixtures';

test('demo learner completes onboarding, creates a path, submits review, and returns home', async ({ page }) => {
  await mockApi(page);
  await page.addInitScript(() => localStorage.setItem('polylex-locale', 'en'));
  await page.goto('/login');

  await page.getByRole('button', { name: 'Experience now' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto('/onboarding');
  await page.getByLabel('Native language').selectOption('en');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Language to learn').selectOption('ja');
  await page.getByRole('button', { name: 'Travel' }).click();
  await page.getByRole('button', { name: 'Create path and start' }).click();
  await expect(page).toHaveURL(/\/roadmap$/);
  await expect(page.getByText('Japanese Foundations')).toBeVisible();

  await page.goto('/review/path');
  await expect(page.getByText('こんにちは', { exact: true })).toBeVisible();
  await page.getByText('こんにちは', { exact: true }).click();
  await page.getByRole('button', { name: /Easy/i }).click();
  await expect(page.getByText(/session complete/i)).toBeVisible();

  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});
