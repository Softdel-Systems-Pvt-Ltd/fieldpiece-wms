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

/** Seeded test identities (backend prisma/seed.ts and the MSW mocks use the same emails). */
const EMAIL: Record<Role, string> = {
  technician: "tech@example.com",
  distributor: "dist@example.com",
  claims_agent: "agent@example.com",
  service_center: "svc@example.com",
  admin: "admin@example.com",
};

export const test = base.extend<{ signInAs: (role: Role) => Promise<void> }>({
  signInAs: async ({ page }, use) => {
    await use(async (role) => {
      await page.goto("/login");
      const picker = page.getByLabel(/sign in as/i);
      await picker.locator(`option[value="${EMAIL[role]}"]`).waitFor({ state: "attached" });
      await picker.selectOption(EMAIL[role]);
      await page.getByRole("button", { name: "Sign in" }).click();
      await page.waitForURL("/");
    });
  },
});

export { expect };
