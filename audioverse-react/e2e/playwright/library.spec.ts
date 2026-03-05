import { test, expect } from '@playwright/test';

test.describe('Library', () => {
  test('library page loads', async ({ page }) => {
    await page.goto('/library');
    await expect(page.locator('main')).toBeVisible();
  });

  test('explore page loads', async ({ page }) => {
    await page.goto('/explore');
    await expect(page.locator('main')).toBeVisible();
  });
});
