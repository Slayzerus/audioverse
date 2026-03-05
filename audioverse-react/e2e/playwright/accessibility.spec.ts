import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test('home page has main landmark', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('main')).toBeVisible();
  });

  test('login form has labeled inputs', async ({ page }) => {
    await page.goto('/login');
    // Check inputs have accessible labels
    const usernameInput = page.getByRole('textbox', { name: /username|nazwa/i });
    await expect(usernameInput).toBeVisible();
  });

  test('navbar has accessible navigation', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });

  test('pages have no duplicate main landmarks', async ({ page }) => {
    await page.goto('/');
    // Wait for the layout to render the main landmark
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
    const mainCount = await page.locator('main').count();
    expect(mainCount).toBe(1);
  });
});
