import { draftReadySchema, makeClaimSchema, rejectSchema } from "./schemas";

const claimSchema = makeClaimSchema(new Set(["physical", "display"]));
const address = { line1: "1 Main St", city: "Fresno", region: "CA", postalCode: "93650", country: "us" };
const valid = {
  serialNumber: " sc680-100037 ",
  failureCategory: "no_power",
  failureDate: "2026-01-10",
  description: "The meter will not power on with fresh batteries installed.",
  photoCount: 0,
  preferredResolution: "repair" as const,
  returnAddress: address,
};

describe("claim schema", () => {
  it("accepts a valid claim and normalises the serial", () => {
    const result = claimSchema.safeParse(valid);
    expect(result.success).toBe(true);
    expect(result.data?.serialNumber).toBe("SC680-100037");
    expect(result.data?.returnAddress.country).toBe("US");
  });

  it("needs at least 30 characters of description", () => {
    const result = claimSchema.safeParse({ ...valid, description: "Broken." });
    expect(result.error?.issues[0]?.path).toEqual(["description"]);
  });

  it("needs a photo only for the categories the API marks", () => {
    expect(claimSchema.safeParse({ ...valid, failureCategory: "display" }).success).toBe(false);
    expect(claimSchema.safeParse({ ...valid, failureCategory: "display", photoCount: 1 }).success).toBe(true);
    expect(makeClaimSchema(new Set()).safeParse({ ...valid, failureCategory: "display" }).success).toBe(true);
  });

  it("rejects failure dates in the future", () => {
    const result = claimSchema.safeParse({ ...valid, failureDate: "2999-01-01" });
    expect(result.error?.issues.map((i) => i.path.join("."))).toContain("failureDate");
  });
});

describe("draftReadySchema", () => {
  it("only autosaves once the API would accept a draft", () => {
    expect(draftReadySchema.safeParse({ ...valid, description: "short" }).success).toBe(false);
    expect(draftReadySchema.safeParse(valid).success).toBe(true);
  });
});

describe("rejectSchema", () => {
  it("requires a reason and a message to the customer", () => {
    expect(rejectSchema.safeParse({}).success).toBe(false);
    expect(
      rejectSchema.safeParse({ reason: "misuse", message: "Unit shows signs of water damage." }).success,
    ).toBe(true);
  });
});
