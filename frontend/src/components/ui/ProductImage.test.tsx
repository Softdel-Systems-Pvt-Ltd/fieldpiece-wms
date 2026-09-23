import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProductImage } from "./ProductImage";

describe("ProductImage", () => {
  it("shows the photo with its alt text", () => {
    render(<ProductImage src="https://api.example.com/p.png" alt="Wireless clamp meter" />);
    expect(screen.getByRole("img", { name: "Wireless clamp meter" }).tagName).toBe("IMG");
  });

  it("falls back to the placeholder when there is no photo or it fails to load", () => {
    const { rerender } = render(<ProductImage src={null} alt="SC680" />);
    expect(screen.getByRole("img", { name: "SC680" }).tagName).toBe("svg");

    rerender(<ProductImage src="https://api.example.com/broken.png" alt="SC680" />);
    fireEvent.error(screen.getByRole("img", { name: "SC680" }));
    expect(screen.getByRole("img", { name: "SC680" }).tagName).toBe("svg");
  });
});
