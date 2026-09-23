import { render, screen } from "@testing-library/react";
import { ClaimStatusBadge, WarrantyStatusBadge } from "./StatusBadge";

describe("status badges", () => {
  it("always shows a text label, not just colour", () => {
    render(<ClaimStatusBadge status="NEEDS_INFO" />);
    const badge = screen.getByText("Needs info");
    expect(badge.className).toContain("bg-warning-bg");
    expect(badge.className).toContain("text-warning");
  });

  it("strikes through VOID warranties", () => {
    render(<WarrantyStatusBadge status="VOID" />);
    expect(screen.getByText("Void").className).toContain("line-through");
  });
});
