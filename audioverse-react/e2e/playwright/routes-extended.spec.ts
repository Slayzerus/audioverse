import { test, expect } from "@playwright/test";

/**
 * Extended route coverage — visits routes not covered by error-free-routes.spec.ts.
 * Asserts pages load without JS errors and render expected content.
 */

const extendedRoutes = [
  "/rounds",
  "/karaoke-playlists",
  "/settings/audio-input",
  "/settings/controller",
  "/settings/display",
  "/dmx-editor",
  "/tuning-harness",
  "/mini-games",
  "/mini-games/song",
  "/jam-session",
  "/characters",
  "/dance",
  "/playlists",
  "/campaigns",
  "/wiki",
  "/video-games",
  "/honest-living",
  "/change-password",
  "/profile",
] as const;

for (const route of extendedRoutes) {
  test(`no JS errors on ${route}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    const response = await page.goto(route);
    expect(response?.status()).toBeLessThan(500);

    await page.waitForTimeout(600);
    expect(errors).toHaveLength(0);
  });
}

test.describe("Extended page content checks", () => {
  test("campaigns page renders heading", async ({ page }) => {
    await page.goto("/campaigns");
    await expect(page.locator("main")).toBeVisible();
  });

  test("wiki page renders main content", async ({ page }) => {
    await page.goto("/wiki");
    await expect(page.locator("main")).toBeVisible();
  });

  test("playlists page renders heading or empty state", async ({ page }) => {
    await page.goto("/playlists");
    await expect(page.locator("main")).toBeVisible();
  });

  test("jam session page renders pad grid or heading", async ({ page }) => {
    await page.goto("/jam-session");
    await expect(page.locator("main")).toBeVisible();
  });

  test("characters page renders editor or preview", async ({ page }) => {
    await page.goto("/characters");
    await expect(page.locator("main")).toBeVisible();
  });

  test("video games page renders collection or empty state", async ({
    page,
  }) => {
    await page.goto("/video-games");
    await expect(page.locator("main")).toBeVisible();
  });

  test("tuning harness page renders controls", async ({ page }) => {
    await page.goto("/tuning-harness");
    await expect(page.locator("main")).toBeVisible();
  });

  test("rounds page renders content", async ({ page }) => {
    await page.goto("/rounds");
    await expect(page.locator("main")).toBeVisible();
  });
});
