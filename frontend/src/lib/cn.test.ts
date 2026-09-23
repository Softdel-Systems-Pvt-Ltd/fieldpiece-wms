import { cn } from "./cn";

describe("cn", () => {
  it("keeps custom type styles alongside text colours", () => {
    expect(cn("text-overline", "text-success")).toBe("text-overline text-success");
    expect(cn("text-body", "text-ink-0")).toBe("text-body text-ink-0");
  });

  it("still resolves real conflicts", () => {
    expect(cn("text-sm", "text-body")).toBe("text-body");
    expect(cn("bg-brand-500", "bg-ink-900")).toBe("bg-ink-900");
  });
});
