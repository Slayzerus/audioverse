import { test, expect } from "@playwright/test";

test.describe("Settings Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings");
  });

  test("settings page loads with main content", async ({ page }) => {
    await expect(page.locator("main")).toBeVisible();
  });

  test("settings page has no JS errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/settings");
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test("settings page contains form controls", async ({ page }) => {
    // Wait for settings page content to fully render
    await expect(page.locator("main")).toBeVisible({ timeout: 10000 });
    // Look for form controls inside main content only
    const main = page.locator("main");
    const controls = main.locator(
      'select, input, [role="switch"], [role="slider"]'
    );
    await expect(controls.first()).toBeVisible({ timeout: 10000 });
    const count = await controls.count();
    expect(count).toBeGreaterThan(0);
  });
});
