import { test, expect } from '@playwright/test';

test.describe('Parties', () => {
  test('parties page loads', async ({ page }) => {
    await page.goto('/parties');
    await expect(page.locator('main')).toBeVisible();
  });

  test('parties list renders filter controls', async ({ page }) => {
    await page.goto('/parties');
    // Wait for content to load
    await page.waitForTimeout(1000);
    // Check for filter inputs or select elements
    const hasFilters = await page.locator('input, select').first().isVisible();
    expect(hasFilters).toBeTruthy();
  });

  test('play hub shows navigation cards', async ({ page }) => {
    await page.goto('/play');
    await expect(page.locator('main')).toBeVisible();
    // Play page has card-based navigation
    const cards = page.locator('[style*="cursor: pointer"], .card, a[href]');
    await expect(cards.first()).toBeVisible({ timeout: 5000 });
  });
});
