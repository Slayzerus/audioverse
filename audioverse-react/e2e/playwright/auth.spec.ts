import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('login page renders form fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('textbox', { name: /username/i })).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /login|zaloguj/i })).toBeVisible();
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: /username/i }).fill('invalid_user');
    await page.locator('input[type="password"]').fill('wrong_password');
    await page.getByRole('button', { name: /login|zaloguj/i }).click();
    // Should show an error message
    await expect(page.locator('[role="alert"], .alert, .error')).toBeVisible({ timeout: 10000 });
  });

  test('register page renders form fields', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('textbox', { name: /username/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /register|zarejestruj/i })).toBeVisible();
  });

  test('navigate between login and register', async ({ page }) => {
    await page.goto('/login');
    const registerLink = page.getByRole('link', { name: /register|zarejestruj|sign up/i });
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await expect(page).toHaveURL(/register/);
    }
  });
});
