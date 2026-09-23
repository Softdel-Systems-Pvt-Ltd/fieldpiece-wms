import { expect, expectNoA11yViolations, test } from "./fixtures";

test.describe("public warranty check", () => {
  test("finds a registered unit without signing in", async ({ page }) => {
    await page.goto("/check");
    await expectNoA11yViolations(page);

    await page.getByLabel(/serial number/i).fill("sc680-100037");
    await page.getByRole("button", { name: "Check warranty" }).click();

    await expect(page.getByRole("heading", { name: "Clamp meter" })).toBeVisible();
    await expect(page.getByRole("link", { name: /file a claim/i })).toBeVisible();
    await expectNoA11yViolations(page);
  });
});
