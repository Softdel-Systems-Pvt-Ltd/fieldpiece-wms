import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Pagination } from "./Pagination";

const setup = (props: Partial<Parameters<typeof Pagination>[0]> = {}) => {
  const onPageChange = vi.fn();
  const onPageSizeChange = vi.fn();
  render(
    <Pagination
      page={6}
      pageSize={25}
      total={500}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      {...props}
    />,
  );
  return { onPageChange, onPageSizeChange };
};

describe("Pagination", () => {
  it("shows the row range and marks the current page", () => {
    setup();
    expect(screen.getByText("126–150 of 500")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Page 6" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Page 20" })).toBeInTheDocument();
  });

  it("reports page and page-size changes instead of slicing data itself", async () => {
    const user = userEvent.setup();
    const { onPageChange, onPageSizeChange } = setup();
    await user.click(screen.getByRole("button", { name: "Page 7" }));
    await user.click(screen.getByRole("button", { name: "Previous page" }));
    await user.selectOptions(screen.getByLabelText("Per page"), "50");
    expect(onPageChange.mock.calls).toEqual([[7], [5]]);
    expect(onPageSizeChange).toHaveBeenCalledWith(50);
  });

  it("disables stepping past either end", () => {
    setup({ page: 1, total: 10 });
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });

  it("moves back to the last page when the URL points past it", () => {
    const { onPageChange } = setup({ page: 9, total: 60 });
    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});
