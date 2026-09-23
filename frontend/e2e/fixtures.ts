import AxeBuilder from "@axe-core/playwright";
import { expect, test as base, type Page } from "@playwright/test";

// Section 10: axe on every page. Call `await expectNoA11yViolations(page)` after each navigation.
export async function expectNoA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

type Role = "technician" | "distributor" | "claims_agent" | "service_center" | "admin";

export const test = base.extend<{ signInAs: (role: Role) => Promise<void> }>({
  signInAs: async ({ page }, use) => {
    await use(async (role) => {
      await page.goto("/login");
      await page.getByLabel("Email").fill(`${role}@example.com`);
      await page.getByLabel("Password").fill("mock-password");
      await page.getByLabel(/sign in as/i).selectOption(role);
      await page.getByRole("button", { name: "Sign in" }).click();
      await page.waitForURL("/");
    });
  },
});

export { expect };
