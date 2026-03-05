import { test, expect } from "@playwright/test";

/**
 * Comprehensive error-free navigation tests.
 * Visits each route and asserts no uncaught JS errors occur.
 */

const routes = [
  "/",
  "/login",
  "/register",
  "/play",
  "/explore",
  "/enjoy",
  "/features",
  "/join",
  "/settings",
  "/library",
  "/parties",
  "/karaoke-editor",
  "/karaoke-songs",
  "/music-player",
  "/display-settings",
  "/board-games",
  "/couch-games",
] as const;

for (const route of routes) {
  test(`no JS errors on ${route}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    const response = await page.goto(route);
    expect(response?.status()).toBeLessThan(500);

    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });
}

test.describe("Keyboard navigation basics", () => {
  test("Tab key moves focus between interactive elements", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("main")).toBeVisible();

    // Press Tab and check that focus moves to an interactive element
    await page.keyboard.press("Tab");
    const focusedTag = await page.evaluate(() =>
      document.activeElement?.tagName.toLowerCase()
    );
    expect(["input", "button", "a", "select", "textarea"]).toContain(
      focusedTag
    );
  });

  test("Escape key does not throw errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    expect(errors).toHaveLength(0);
  });
});
