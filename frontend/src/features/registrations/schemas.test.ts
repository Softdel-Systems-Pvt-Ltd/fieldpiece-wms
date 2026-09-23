import { detectSku, registrationSchema } from "./schemas";

const valid = {
  serialNumber: "sc680-100037",
  sku: "SC680",
  launchDate: "2019-01-01",
  purchaseDate: "2026-01-15",
  proofCount: 1,
  requireProof: true,
  ownerName: "Sam Tech",
  ownerEmail: "tech@example.com",
  address: { line1: "1 Main St", city: "Fresno", region: "CA", postalCode: "93650", country: "us" },
  acceptTerms: true as const,
};

describe("registrationSchema", () => {
  it("accepts a valid registration and normalises serial and country", () => {
    const result = registrationSchema.safeParse(valid);
    expect(result.success).toBe(true);
    expect(result.data?.serialNumber).toBe("SC680-100037");
    expect(result.data?.address.country).toBe("US");
  });

  it("rejects purchase dates before the product launch", () => {
    const result = registrationSchema.safeParse({ ...valid, purchaseDate: "2018-12-31" });
    expect(result.error?.issues.find((i) => i.path[0] === "purchaseDate")?.message).toMatch(
      /before this product/,
    );
  });

  it("requires proof of purchase only when the API requires it", () => {
    expect(registrationSchema.safeParse({ ...valid, proofCount: 0 }).success).toBe(false);
    expect(registrationSchema.safeParse({ ...valid, proofCount: 0, requireProof: false }).success).toBe(true);
  });

  it("requires accepted terms and a full address", () => {
    const result = registrationSchema.safeParse({
      ...valid,
      acceptTerms: false,
      address: { ...valid.address, city: "" },
    });
    const paths = result.error?.issues.map((i) => i.path.join("."));
    expect(paths).toEqual(expect.arrayContaining(["acceptTerms", "address.city"]));
  });

  it("allows an empty email but not a malformed one", () => {
    expect(registrationSchema.safeParse({ ...valid, ownerEmail: "" }).success).toBe(true);
    expect(registrationSchema.safeParse({ ...valid, ownerEmail: "nope" }).success).toBe(false);
  });
});

describe("detectSku", () => {
  const catalogue = [
    { sku: "SC680", serialPattern: null },
    { sku: "VP85", serialPattern: "^VP85[0-9]{6}$" },
  ];

  it("uses the serial pattern when the product has one", () => {
    expect(detectSku("vp85123456", catalogue)).toBe("VP85");
  });

  it("falls back to the SKU prefix", () => {
    expect(detectSku("SC680-000001", catalogue)).toBe("SC680");
  });

  it("returns null when nothing matches", () => {
    expect(detectSku("ZZZ-1", catalogue)).toBeNull();
  });
});
