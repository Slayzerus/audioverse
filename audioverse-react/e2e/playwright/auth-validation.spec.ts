import { test, expect } from '@playwright/test';

test.describe('Auth Form Validation', () => {
  test.describe('Login form', () => {
    test('empty login form shows HTML5 validation', async ({ page }) => {
      await page.goto('/login');
      const submitBtn = page.getByRole('button', { name: /login|zaloguj/i });
      await submitBtn.click();
      // HTML5 required attribute prevents submission — check input validity
      const username = page.getByRole('textbox', { name: /username/i });
      const isInvalid = await username.evaluate(
        (el: HTMLInputElement) => !el.validity.valid
      );
      expect(isInvalid).toBeTruthy();
    });

    test('login form accepts keyboard input', async ({ page }) => {
      await page.goto('/login');
      const username = page.getByRole('textbox', { name: /username/i });
      await username.fill('testuser');
      await expect(username).toHaveValue('testuser');
      const password = page.locator('input[type="password"]');
      await password.fill('testpass123');
      await expect(password).toHaveValue('testpass123');
    });

    test('login form submits with Enter key', async ({ page }) => {
      await page.goto('/login');
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));
      await page.getByRole('textbox', { name: /username/i }).fill('user');
      await page.locator('input[type="password"]').fill('pass');
      await page.locator('input[type="password"]').press('Enter');
      // Should not crash, even though login will fail without backend
      await page.waitForTimeout(2000);
      expect(errors).toHaveLength(0);
    });
  });

  test.describe('Registration form', () => {
    test('register form has required fields', async ({ page }) => {
      await page.goto('/register');
      const username = page.getByRole('textbox', { name: /username/i });
      const email = page.locator('input[type="email"]');
      const password = page.locator('input[type="password"]');
      await expect(username).toBeVisible();
      await expect(email).toBeVisible();
      await expect(password).toBeVisible();
      // Check required attribute
      await expect(username).toHaveAttribute('required', '');
      await expect(email).toHaveAttribute('required', '');
      await expect(password).toHaveAttribute('required', '');
    });

    test('register button disabled until password rules pass', async ({ page }) => {
      await page.goto('/register');
      const submitBtn = page.getByRole('button', { name: /register|zarejestruj/i });
      // Initially disabled (no password entered yet)
      await expect(submitBtn).toBeDisabled();
    });

    test('typing a strong password enables submit button', async ({ page }) => {
      await page.goto('/register');
      const password = page.locator('input[type="password"]');
      const submitBtn = page.getByRole('button', { name: /register|zarejestruj/i });
      // Type a weak password — should stay disabled
      await password.fill('abc');
      await expect(submitBtn).toBeDisabled();
      // Type a strong password meeting all rules
      await password.fill('StrongP@ss1');
      await page.waitForTimeout(500);
      await expect(submitBtn).toBeEnabled();
    });

    test('password strength indicator shows rules', async ({ page }) => {
      await page.goto('/register');
      // Wait for the registration form to fully render
      await expect(page.getByRole('button', { name: /register|zarejestruj/i })).toBeVisible({ timeout: 5000 });
      // Should show password strength rules as list items
      const rules = page.locator('ul li');
      await expect(rules.first()).toBeVisible({ timeout: 5000 });
      const count = await rules.count();
      expect(count).toBeGreaterThan(0);
    });

    test('email field validates format', async ({ page }) => {
      await page.goto('/register');
      const email = page.locator('input[type="email"]');
      await email.fill('not-an-email');
      const isInvalid = await email.evaluate(
        (el: HTMLInputElement) => !el.validity.valid
      );
      expect(isInvalid).toBeTruthy();
      await email.fill('valid@example.com');
      const isValid = await email.evaluate(
        (el: HTMLInputElement) => el.validity.valid
      );
      expect(isValid).toBeTruthy();
    });
  });
});
