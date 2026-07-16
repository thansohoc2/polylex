import { authenticate, expect, mockApi, test } from './fixtures';

test.beforeEach(async ({ page }) => {
  await mockApi(page);
  await authenticate(page);
  await page.goto('/dashboard');
  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible();
});

test('five primary tabs preserve active nested routes and browser history', async ({ page }) => {
  const tabs = [
    ['Home', '/dashboard'], ['Roadmap', '/roadmap'], ['Videos', '/videos'], ['Review', '/review'], ['Profile', '/profile'],
  ] as const;

  for (const [name, path] of tabs) {
    await page.getByRole('button', { name, exact: true }).click();
    await expect(page).toHaveURL(path === '/review' ? /\/review\/(all|path)$/ : new RegExp(`${path}$`));
    await expect(page.getByRole('button', { name, exact: true })).toHaveAttribute('aria-current', 'page');
  }

  await page.goto('/review/path/path-e2e');
  await expect(page.getByRole('button', { name: 'Review', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/profile$/);
  await page.goForward();
  await expect(page).toHaveURL(/\/review\/path\/path-e2e$/);
});

test('home shortcuts and protected deep links remain available', async ({ page }) => {
  await page.getByRole('button', { name: /Vocabulary.*Browse/i }).click();
  await expect(page).toHaveURL(/\/vocabulary$/);

  await page.goto('/dashboard');
  await page.getByRole('button', { name: /Quick Notes/i }).click();
  await expect(page).toHaveURL(/\/review\/quicknotes$/);

  await page.goto('/roadmap');
  await expect(page.getByText('Japanese Foundations')).toBeVisible();
});
