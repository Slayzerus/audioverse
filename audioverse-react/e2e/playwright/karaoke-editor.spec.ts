import { test, expect } from '@playwright/test';

test.describe('Karaoke Editor', () => {
  test('editor page loads with tabs', async ({ page }) => {
    await page.goto('/karaoke-editor');
    await expect(page.locator('main')).toBeVisible();
    // Editor should show tab buttons inside main content
    const buttons = page.locator('main button');
    await expect(buttons.first()).toBeVisible({ timeout: 5000 });
  });

  test('editor has backup/restore buttons', async ({ page }) => {
    await page.goto('/karaoke-editor');
    // Check for backup-related buttons
    const backupBtn = page.locator('main').getByRole('button', { name: /backup|save/i });
    await expect(backupBtn.first()).toBeVisible({ timeout: 5000 });
  });

  test('browse songs button exists', async ({ page }) => {
    await page.goto('/karaoke-editor');
    const browseBtn = page.locator('main').getByRole('button', { name: /browse|przeglądaj/i });
    await expect(browseBtn).toBeVisible({ timeout: 5000 });
  });
});
