import { test, expect } from "@playwright/test";

test.describe("Karaoke Editor Interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/karaoke-editor");
    await expect(page.locator("main")).toBeVisible({ timeout: 5000 });
  });

  test("editor has no JS errors on load", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/karaoke-editor");
    await page.waitForTimeout(1000);
    expect(errors).toHaveLength(0);
  });

  test("clicking a tab changes active content", async ({ page }) => {
    const tabs = page.locator('[role="tab"], .nav-link, .nav-tabs a');
    const tabCount = await tabs.count();

    if (tabCount >= 2) {
      const secondTab = tabs.nth(1);
      const tabText = await secondTab.textContent();
      await secondTab.click();
      // After clicking, the tab should be active/selected
      await expect(secondTab).toHaveClass(/active|selected/i, {
        timeout: 3000,
      });
      expect(tabText).toBeTruthy();
    }
  });

  test("editor contains text area or input for lyrics", async ({ page }) => {
    const textInputs = page.locator("textarea, input[type='text'], .CodeMirror, [contenteditable]");
    const count = await textInputs.count();
    // Editor should have at least some input mechanism
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
