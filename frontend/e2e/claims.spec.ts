import { expect, expectNoA11yViolations, test } from "./fixtures";

// Section 13 e2e targets: register product, file claim, agent approve -> RMA, public check.
// This covers the agent path; add register-product and file-claim specs as those screens land.

test.describe("claims", () => {
  test("agent reviews and approves a claim", async ({ page, signInAs }) => {
    await signInAs("claims_agent");
    await expectNoA11yViolations(page);

    await page.goto("/claims?status=IN_REVIEW");
    await expectNoA11yViolations(page);
    await page.getByRole("link", { name: /^CLM-/ }).first().click();

    await page.getByRole("button", { name: "Approve" }).click();
    const dialog = page.getByRole("dialog", { name: "Approve" });
    await expect(dialog).toBeVisible();
    await expectNoA11yViolations(page);
    await dialog.getByRole("button", { name: "Approve" }).click();

    await expect(page.getByText("Approved", { exact: true }).first()).toBeVisible();
  });

  test("technician can't see the reports screen", async ({ page, signInAs }) => {
    await signInAs("technician");
    await page.goto("/reports");
    await expect(page.getByText(/you don't have access/i)).toBeVisible();
  });
});
