import { detectSku, registrationSchema } from "./schemas";

const valid = {
  serialNumber: "sc680-100037",
  sku: "SC680",
  launchDate: "2019-01-01",
  purchaseDate: "2026-01-15",
  proofCount: 1,
  ownerName: "Sam Tech",
  ownerEmail: "tech@example.com",
  acceptTerms: true as const,
};

describe("registrationSchema", () => {
  it("accepts a valid registration", () => {
    expect(registrationSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects purchase dates before the product launch", () => {
    const result = registrationSchema.safeParse({ ...valid, purchaseDate: "2018-12-31" });
    expect(result.error?.issues.find((i) => i.path[0] === "purchaseDate")?.message).toMatch(
      /before this product/,
    );
  });

  it("requires proof of purchase and accepted terms", () => {
    const result = registrationSchema.safeParse({ ...valid, proofCount: 0, acceptTerms: false });
    const paths = result.error?.issues.map((i) => i.path[0]);
    expect(paths).toEqual(expect.arrayContaining(["proofCount", "acceptTerms"]));
  });
});

describe("detectSku", () => {
  const catalogue = [{ sku: "SC680" }, { sku: "VP85", serialPattern: "^VP85[0-9]{6}$" }];

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
