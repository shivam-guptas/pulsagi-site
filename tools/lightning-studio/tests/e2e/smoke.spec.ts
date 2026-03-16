import { expect, test } from "@playwright/test";

test("home page loads and links to tools", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "LIGHTNING STUDIO" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Explore tools/i })).toBeVisible();
});
