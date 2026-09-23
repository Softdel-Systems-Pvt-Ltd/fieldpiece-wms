import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Plus } from "lucide-react";
import { Button } from "./Button";

describe("Button", () => {
  it("defaults to a primary type=button", () => {
    render(<Button>Register product</Button>);
    const button = screen.getByRole("button", { name: "Register product" });
    expect(button).toHaveAttribute("type", "button");
    expect(button.className).toContain("bg-brand-500");
    expect(button.className).toContain("text-ink-1000");
  });

  it("applies variants and sizes", () => {
    render(
      <Button variant="danger" size="lg">
        Reject
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Reject" });
    expect(button.className).toContain("bg-danger");
    expect(button.className).toContain("h-12");
  });

  it("shows a loading state: busy, disabled, label kept", async () => {
    const onClick = vi.fn();
    render(
      <Button loading icon={Plus} onClick={onClick}>
        Approve
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Approve" });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});
