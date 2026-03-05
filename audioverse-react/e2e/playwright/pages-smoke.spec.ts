import { test, expect } from "@playwright/test";

test.describe("Music Player Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/music-player");
  });

  test("music player page loads", async ({ page }) => {
    await expect(page.locator("main")).toBeVisible();
  });

  test("music player page has no JS errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/music-player");
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });
});

test.describe("Display Settings Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/display-settings");
  });

  test("display settings page loads", async ({ page }) => {
    await expect(page.locator("main")).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Karaoke Song Browser Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/karaoke-songs");
  });

  test("karaoke song browser page loads", async ({ page }) => {
    await expect(page.locator("main")).toBeVisible({ timeout: 5000 });
  });

  test("karaoke song browser has no JS errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/karaoke-songs");
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });
});
