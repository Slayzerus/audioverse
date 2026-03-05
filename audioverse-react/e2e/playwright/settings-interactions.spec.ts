import { test, expect } from '@playwright/test';

test.describe('Settings Page Interactions', () => {
  test('settings page has difficulty selector', async ({ page }) => {
    await page.goto('/settings');
    const select = page.locator('select.form-select');
    await expect(select).toBeVisible();
    // Should have easy/normal/hard options
    const options = select.locator('option');
    const count = await options.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('difficulty selector changes value', async ({ page }) => {
    await page.goto('/settings');
    const select = page.locator('select.form-select');
    await select.selectOption('hard');
    await expect(select).toHaveValue('hard');
    await select.selectOption('easy');
    await expect(select).toHaveValue('easy');
  });

  test('settings page links navigate to sub-pages', async ({ page }) => {
    await page.goto('/settings');
    // Display settings link
    const displayLink = page.getByRole('link', { name: /display settings/i });
    await expect(displayLink).toBeVisible();
    // Audio input link
    const audioLink = page.getByRole('link', { name: /audio input/i });
    await expect(audioLink).toBeVisible();
  });

  test('display settings link navigates correctly', async ({ page }) => {
    await page.goto('/settings');
    const displayLink = page.getByRole('link', { name: /display settings/i });
    await displayLink.click();
    await expect(page).toHaveURL(/display/);
    await expect(page.getByRole('heading', { name: /display settings/i })).toBeVisible();
  });
});

test.describe('Display Settings Page', () => {
  test('display settings page loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/settings/display');
    await page.waitForTimeout(1000);
    expect(errors).toHaveLength(0);
  });

  test('display settings has gradient preset buttons', async ({ page }) => {
    await page.goto('/settings/display');
    // Should have gradient color preset buttons
    const customBtn = page.getByRole('button', { name: /custom/i });
    await expect(customBtn).toBeVisible();
  });

  test('display settings has animation mode buttons', async ({ page }) => {
    await page.goto('/settings/display');
    // Should have animation mode buttons
    const ballTrail = page.getByRole('button', { name: /ball.*trail/i });
    const wipe = page.getByRole('button', { name: /wipe/i });
    const hasBall = await ballTrail.isVisible().catch(() => false);
    const hasWipe = await wipe.isVisible().catch(() => false);
    expect(hasBall || hasWipe).toBeTruthy();
  });

  test('clicking custom gradient shows color pickers', async ({ page }) => {
    await page.goto('/settings/display');
    const customBtn = page.getByRole('button', { name: /custom/i });
    await customBtn.click();
    // Should show color picker inputs
    const colorPickers = page.locator('input[type="color"]');
    const count = await colorPickers.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('animation mode buttons toggle active state', async ({ page }) => {
    await page.goto('/settings/display');
    // Find all animation buttons and click one
    const wipe = page.getByRole('button', { name: /wipe/i });
    if (await wipe.isVisible().catch(() => false)) {
      await wipe.click();
      // After click, verify the button gets primary/active styling
      const classes = await wipe.getAttribute('class');
      expect(classes).toContain('btn-primary');
    }
  });

  test('display settings has font selection', async ({ page }) => {
    await page.goto('/settings/display');
    // Wait for font section heading to ensure DOM is ready
    await expect(page.getByRole('heading', { name: /karaoke font/i })).toBeVisible();
    // Should have font buttons
    const fontButtons = page.locator('button').filter({ hasText: /quick brown fox/i });
    const count = await fontButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('settings saved toast appears after change', async ({ page }) => {
    await page.goto('/settings/display');
    // Click on a gradient preset (not custom)
    const buttons = page.locator('button.btn-outline-secondary, button.btn-primary');
    const count = await buttons.count();
    if (count > 0) {
      await buttons.first().click();
      // Should show a "Settings saved" toast
      const toast = page.getByText(/settings saved/i);
      await expect(toast).toBeVisible({ timeout: 3000 });
    }
  });
});

test.describe('Language Switching', () => {
  test('language switcher is visible', async ({ page }) => {
    await page.goto('/');
    const langBtn = page.getByRole('button', { name: /change language|język/i });
    await expect(langBtn).toBeVisible();
  });

  test('clicking language switcher shows options', async ({ page }) => {
    await page.goto('/');
    const langBtn = page.getByRole('button', { name: /change language|język/i });
    await langBtn.click();
    // Should show language options
    const options = page.getByRole('button').filter({ hasText: /english|polski|en|pl/i });
    const count = await options.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
