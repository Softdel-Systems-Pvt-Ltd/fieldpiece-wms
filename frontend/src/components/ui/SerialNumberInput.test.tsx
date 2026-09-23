import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { isValidSerial } from "@/lib/serial";
import { SerialNumberInput } from "./SerialNumberInput";

describe("SerialNumberInput", () => {
  it("uppercases while typing and trims on blur", async () => {
    render(<SerialNumberInput aria-label="Serial number" />);
    const input = screen.getByLabelText("Serial number");
    await userEvent.type(input, " sc680 ab");
    expect(input).toHaveValue(" SC680 AB");
    await userEvent.tab();
    expect(input).toHaveValue("SC680AB");
  });

  it("renders in the mono font", () => {
    render(<SerialNumberInput aria-label="Serial number" />);
    expect(screen.getByLabelText("Serial number").className).toContain("font-mono");
  });
});

describe("isValidSerial", () => {
  it("checks against the default pattern", () => {
    expect(isValidSerial("sc680-100037")).toBe(true);
    expect(isValidSerial("abc")).toBe(false);
  });

  it("accepts a product-specific pattern", () => {
    expect(isValidSerial("VP85123456", "^VP85[0-9]{6}$")).toBe(true);
    expect(isValidSerial("VP85-12", "^VP85[0-9]{6}$")).toBe(false);
  });
});
