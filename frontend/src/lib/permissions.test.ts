import { can, hasRole, isStaff } from "./permissions";

describe("permissions", () => {
  it("gives distributors bulk registration but not technicians", () => {
    expect(can("distributor", "registrations:bulk")).toBe(true);
    expect(can("technician", "registrations:bulk")).toBe(false);
  });

  it("keeps internal notes away from customers", () => {
    expect(can("technician", "claims:internal_notes")).toBe(false);
    expect(can("distributor", "claims:internal_notes")).toBe(false);
    expect(can("claims_agent", "claims:internal_notes")).toBe(true);
  });

  it("denies everything without a role", () => {
    expect(can(undefined, "claims:view")).toBe(false);
    expect(hasRole(null, ["admin"])).toBe(false);
  });

  it("checks role lists", () => {
    expect(hasRole("admin", ["admin", "claims_agent"])).toBe(true);
    expect(hasRole("technician", ["admin"])).toBe(false);
  });

  it("identifies staff roles", () => {
    expect(isStaff("service_center")).toBe(true);
    expect(isStaff("distributor")).toBe(false);
  });
});
