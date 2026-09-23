import { computeWarrantyEnd, daysRemaining, getWarrantyStatus, validatePurchaseDate } from "./warranty";
import { toIsoDate } from "./format";

const NOW = new Date(2026, 8, 23); // 23 Sep 2026

describe("computeWarrantyEnd", () => {
  it("adds the base months", () => {
    expect(toIsoDate(computeWarrantyEnd("2026-03-14", { baseMonths: 24 }))).toBe("2028-03-14");
  });

  it("adds the registration extension when the policy has one", () => {
    expect(
      toIsoDate(computeWarrantyEnd("2026-03-14", { baseMonths: 24, extensionMonthsOnRegistration: 12 })),
    ).toBe("2029-03-14");
  });

  it("clamps month-end dates", () => {
    expect(toIsoDate(computeWarrantyEnd(new Date(2026, 0, 31), { baseMonths: 1 }))).toBe("2026-02-28");
  });
});

describe("getWarrantyStatus", () => {
  it("is ACTIVE when more than the threshold remains", () => {
    expect(getWarrantyStatus("2027-09-23", { now: NOW })).toBe("ACTIVE");
  });

  it("is EXPIRING_SOON within the threshold, including the last day", () => {
    expect(getWarrantyStatus("2026-11-22", { now: NOW })).toBe("EXPIRING_SOON");
    expect(getWarrantyStatus("2026-09-23", { now: NOW })).toBe("EXPIRING_SOON");
  });

  it("respects a custom threshold", () => {
    expect(getWarrantyStatus("2026-11-22", { now: NOW, expiringSoonDays: 30 })).toBe("ACTIVE");
  });

  it("is EXPIRED once the end date has passed", () => {
    expect(getWarrantyStatus("2026-09-22", { now: NOW })).toBe("EXPIRED");
  });

  it("is VOID when flagged, whatever the dates", () => {
    expect(getWarrantyStatus("2030-01-01", { now: NOW, void: true })).toBe("VOID");
  });

  it("defaults to today", () => {
    expect(getWarrantyStatus(new Date(2999, 0, 1))).toBe("ACTIVE");
  });
});

describe("daysRemaining", () => {
  it("counts calendar days and never goes negative", () => {
    expect(daysRemaining("2026-10-03", NOW)).toBe(10);
    expect(daysRemaining("2026-01-01", NOW)).toBe(0);
  });
});

describe("validatePurchaseDate", () => {
  it("requires a date", () => {
    expect(validatePurchaseDate(undefined, { now: NOW })).toBe("required");
  });

  it("rejects dates in the future", () => {
    expect(validatePurchaseDate("2026-09-24", { now: NOW })).toBe("future");
  });

  it("rejects dates before the product launch", () => {
    expect(validatePurchaseDate("2019-12-31", { now: NOW, launchDate: "2020-01-01" })).toBe("beforeLaunch");
  });

  it("accepts today and past dates after launch", () => {
    expect(validatePurchaseDate("2026-09-23", { now: NOW, launchDate: "2020-01-01" })).toBeNull();
    expect(validatePurchaseDate(new Date(2024, 5, 1), { now: NOW })).toBeNull();
  });
});
