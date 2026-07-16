import AxeBuilder from '@axe-core/playwright';
import { authenticate, expect, mockApi, test } from './fixtures';

const protectedPages = ['/dashboard', '/roadmap', '/review/path', '/profile'];

for (const path of ['/login', ...protectedPages]) {
  test(`${path} has no serious or critical axe violations`, async ({ page }) => {
    await mockApi(page);
    if (path !== '/login') await authenticate(page);
    await page.goto(path);
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''));
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);

    if (path !== '/login') {
      const skipLink = page.getByRole('link', { name: 'Skip to main content' });
      await skipLink.focus();
      await expect(skipLink).toBeVisible();
      await skipLink.press('Enter');
      await expect(page.locator('#main-content')).toBeFocused();
    }
  });
}
