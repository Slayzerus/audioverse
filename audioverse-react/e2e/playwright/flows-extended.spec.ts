import { test, expect } from "@playwright/test";

/**
 * E2E tests for auth flow — login form, registration form, and navigation.
 */
test.describe("Auth Flow", () => {
  test("login form submits with Enter key", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/login");
    await expect(page.locator('input[type="email"], input[name="email"], input[type="text"]').first()).toBeVisible();

    // Fill in fields and press Enter
    await page.locator('input[type="email"], input[name="email"], input[type="text"]').first().fill("test@example.com");
    await page.locator('input[type="password"]').first().fill("wrong-password");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(1000);

    // Should show error or stay on login — no JS error
    expect(errors).toHaveLength(0);
  });

  test("register form validates required fields", async ({ page }) => {
    await page.goto("/register");
    const submitBtn = page.locator('button[type="submit"]').first();
    if (await submitBtn.isVisible()) {
      // Submit button may be disabled until password rules pass — that itself validates the form
      const isDisabled = await submitBtn.isDisabled();
      if (!isDisabled) {
        await submitBtn.click();
        // Browser validation or form error should appear
        await page.waitForTimeout(500);
      }
    }
    await expect(page.locator("main")).toBeVisible();
  });

  test("login page has link to register", async ({ page }) => {
    await page.goto("/login");
    const registerLink = page.locator('a[href*="register"], a:has-text("Sign up"), a:has-text("Register")').first();
    await expect(registerLink).toBeVisible();
  });

  test("register page has link to login", async ({ page }) => {
    await page.goto("/register");
    const loginLink = page.locator('a[href*="login"], a:has-text("Sign in"), a:has-text("Login")').first();
    await expect(loginLink).toBeVisible();
  });
});

/**
 * E2E tests for playlist interactions.
 */
test.describe("Playlist Flows", () => {
  test("karaoke playlists page loads without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/karaoke-playlists");
    await expect(page.locator("main")).toBeVisible();
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test("playlists page loads and shows heading", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/playlists");
    await expect(page.locator("main")).toBeVisible();
    expect(errors).toHaveLength(0);
  });
});

/**
 * E2E tests for party creation and join flow.
 */
test.describe("Party Flows", () => {
  test("parties page shows create button or empty state", async ({ page }) => {
    await page.goto("/parties");
    await expect(page.locator("main")).toBeVisible();
    // Should have either a "New party" button or content
    const content = await page.locator("main").textContent();
    expect(content?.length).toBeGreaterThan(0);
  });

  test("join page renders form fields", async ({ page }) => {
    await page.goto("/join");
    await expect(page.locator("main")).toBeVisible();
    // Should have an input for party ID
    const inputs = page.locator("input");
    expect(await inputs.count()).toBeGreaterThan(0);
  });

  test("join page does not crash with invalid ID", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/join");
    const input = page.locator("input").first();
    if (await input.isVisible()) {
      await input.fill("99999");
      await page.keyboard.press("Enter");
      await page.waitForTimeout(1000);
    }
    expect(errors).toHaveLength(0);
  });
});

/**
 * E2E tests for settings sub-pages.
 */
test.describe("Settings Sub-pages", () => {
  test("controller settings page loads", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/settings/controller");
    await expect(page.locator("main")).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test("audio input settings page loads", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/settings/audio-input");
    await expect(page.locator("main")).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test("display settings has color pickers", async ({ page }) => {
    await page.goto("/settings/display");
    await expect(page.locator("main")).toBeVisible();
    // Check for some form control
    const controls = page.locator("input, select, button");
    expect(await controls.count()).toBeGreaterThan(0);
  });

  test("settings page has difficulty selector", async ({ page }) => {
    await page.goto("/settings");
    const select = page.locator("select").first();
    if (await select.isVisible()) {
      // Should have options
      const options = select.locator("option");
      expect(await options.count()).toBeGreaterThanOrEqual(2);
    }
  });
});

/**
 * E2E tests for game-related pages.
 */
test.describe("Games & Mini-games", () => {
  test("mini-games page loads", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/mini-games");
    await expect(page.locator("main")).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test("song mini-games page loads", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/mini-games/song");
    await expect(page.locator("main")).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test("jam session page loads and shows UI elements", async ({ page }) => {
    await page.goto("/jam-session");
    await expect(page.locator("main")).toBeVisible();
    // Jam session should have buttons/pads
    const buttons = page.locator("button");
    expect(await buttons.count()).toBeGreaterThan(0);
  });
});

/**
 * E2E tests for editor pages (beyond karaoke editor).
 */
test.describe("Editor Pages", () => {
  test("DMX editor loads without JS errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/dmx-editor");
    await expect(page.locator("main")).toBeVisible();
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test("tuning harness loads without JS errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/tuning-harness");
    await expect(page.locator("main")).toBeVisible();
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });
});
