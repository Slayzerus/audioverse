import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('home page loads with title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/AudioVerse|Karaoke/i);
  });

  test('main landmark exists', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('main')).toBeVisible();
  });

  test('navbar is visible with navigation links', async ({ page }) => {
    await page.goto('/');
    const navbar = page.locator('nav');
    await expect(navbar).toBeVisible();
  });

  test.describe('public routes load without error', () => {
    const publicRoutes = [
      { path: '/', name: 'Home' },
      { path: '/login', name: 'Login' },
      { path: '/register', name: 'Register' },
      { path: '/play', name: 'Play Hub' },
      { path: '/explore', name: 'Explore' },
      { path: '/enjoy', name: 'Enjoy' },
      { path: '/features', name: 'Features' },
      { path: '/join', name: 'Join Party' },
    ];

    for (const route of publicRoutes) {
      test(`${route.name} (${route.path}) loads`, async ({ page }) => {
        const response = await page.goto(route.path);
        expect(response?.status()).toBeLessThan(400);
        await expect(page.locator('main')).toBeVisible();
        // No uncaught errors
        const errors: string[] = [];
        page.on('pageerror', (err) => errors.push(err.message));
        await page.waitForTimeout(500);
        expect(errors).toHaveLength(0);
      });
    }
  });
});
