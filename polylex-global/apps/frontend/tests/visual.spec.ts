import { authenticate, disableMotion, expect, mockApi, test } from './fixtures';

const viewports = [
  { name: '320', width: 320, height: 720 },
  { name: '375', width: 375, height: 812 },
  { name: '430', width: 430, height: 932 },
  { name: '768', width: 768, height: 1024 },
  { name: '1024', width: 1024, height: 768 },
] as const;

const pages = [
  { name: 'login', path: '/login', authenticated: false },
  { name: 'dashboard', path: '/dashboard', authenticated: true },
  { name: 'roadmap', path: '/roadmap', authenticated: true },
  { name: 'review', path: '/review/path', authenticated: true },
] as const;

for (const target of pages) {
  for (const viewport of viewports) {
    test(`${target.name} at ${viewport.name}px`, async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'Visual baselines use Chromium for deterministic rendering.');
      await mockApi(page);
      if (target.authenticated) await authenticate(page);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(target.path);
      await disableMotion(page);
      await expect(page).toHaveScreenshot(`${target.name}-${viewport.name}.png`, { fullPage: true });
    });
  }
}
