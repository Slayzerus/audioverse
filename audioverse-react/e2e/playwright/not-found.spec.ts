import { test, expect } from '@playwright/test';

test.describe('404 Not Found Page', () => {
  test('shows 404 page for unknown routes', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-12345');
    await expect(page.getByText('404')).toBeVisible();
    await expect(page.getByRole('heading', { name: /page not found/i })).toBeVisible();
  });

  test('404 page has a link back to homepage', async ({ page }) => {
    await page.goto('/nonexistent-route');
    const homeLink = page.getByRole('link', { name: /go to homepage/i });
    await expect(homeLink).toBeVisible();
    await homeLink.click();
    await expect(page).toHaveURL('/');
  });

  test('404 page has alert role for accessibility', async ({ page }) => {
    await page.goto('/does-not-exist');
    await expect(page.locator('[role="alert"]')).toBeVisible();
  });

  test('404 page has no JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/totally-unknown-path');
    await page.waitForTimeout(1000);
    expect(errors).toHaveLength(0);
  });
});
