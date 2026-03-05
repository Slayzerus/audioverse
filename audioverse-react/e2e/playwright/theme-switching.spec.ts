import { test, expect } from '@playwright/test';

test.describe('Theme Switching', () => {
  test('page has data-theme attribute', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    const theme = await html.getAttribute('data-theme');
    expect(theme).toBeTruthy();
    expect(['dark', 'light']).toContain(theme);
  });

  test('theme picker button is visible', async ({ page }) => {
    await page.goto('/');
    // Theme picker button shows an emoji for the current theme
    const themeBtn = page.getByRole('button', { name: /zmień skórkę|theme/i });
    await expect(themeBtn).toBeVisible();
  });

  test('clicking theme picker shows theme options', async ({ page }) => {
    await page.goto('/');
    const themeBtn = page.getByRole('button', { name: /zmień skórkę|theme/i });
    await themeBtn.click();
    // Should show a grid of theme buttons — look for known theme names
    const daylight = page.getByRole('button', { name: /daylight/i });
    const midnight = page.getByRole('button', { name: /midnight/i });
    const hasDaylight = await daylight.isVisible().catch(() => false);
    const hasMidnight = await midnight.isVisible().catch(() => false);
    expect(hasDaylight || hasMidnight).toBeTruthy();
  });

  test('selecting a light theme changes data-theme to light', async ({ page }) => {
    await page.goto('/');
    const themeBtn = page.getByRole('button', { name: /zmień skórkę|theme/i });
    await themeBtn.click();
    // Try to click Daylight theme
    const daylight = page.getByRole('button', { name: /daylight/i });
    if (await daylight.isVisible().catch(() => false)) {
      await daylight.click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    }
  });

  test('selecting a dark theme changes data-theme to dark', async ({ page }) => {
    await page.goto('/');
    const themeBtn = page.getByRole('button', { name: /zmień skórkę|theme/i });
    await themeBtn.click();
    const midnight = page.getByRole('button', { name: /midnight/i });
    if (await midnight.isVisible().catch(() => false)) {
      await midnight.click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    }
  });

  test('theme persists across navigation', async ({ page }) => {
    await page.goto('/');
    const themeBtn = page.getByRole('button', { name: /zmień skórkę|theme/i });
    await themeBtn.click();
    // Pick any available theme and record data-skin
    const daylight = page.getByRole('button', { name: /daylight/i });
    if (await daylight.isVisible().catch(() => false)) {
      await daylight.click();
      const skin = await page.locator('html').getAttribute('data-skin');
      // Navigate away and back
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('html')).toHaveAttribute('data-skin', skin!);
    }
  });
});
