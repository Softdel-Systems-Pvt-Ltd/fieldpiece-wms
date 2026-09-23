import { describe, expect, it } from "vitest";
import { pageCountOf, pageWindow, parsePageSize, rangeOf, TABLE_PAGE_SIZES } from "./pagination";

describe("pageWindow", () => {
  it("lists every page when they all fit", () => {
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("collapses skipped pages into gaps around the current page", () => {
    expect(pageWindow(1, 20)).toEqual([1, 2, 3, 4, 5, "gap", 20]);
    expect(pageWindow(6, 20)).toEqual([1, "gap", 5, 6, 7, "gap", 20]);
    expect(pageWindow(20, 20)).toEqual([1, "gap", 16, 17, 18, 19, 20]);
  });

  it("keeps the same number of slots while paging", () => {
    for (let p = 1; p <= 30; p++) expect(pageWindow(p, 30)).toHaveLength(7);
  });

  it("clamps an out-of-range page", () => {
    expect(pageWindow(99, 10)).toEqual([1, "gap", 6, 7, 8, 9, 10]);
  });
});

describe("rangeOf / pageCountOf", () => {
  it("describes the rows on a page", () => {
    expect(rangeOf(2, 25, 132)).toEqual({ from: 26, to: 50 });
    expect(rangeOf(6, 25, 132)).toEqual({ from: 126, to: 132 });
    expect(rangeOf(1, 25, 0)).toEqual({ from: 0, to: 0 });
  });

  it("always has at least one page", () => {
    expect(pageCountOf(0, 25)).toBe(1);
    expect(pageCountOf(51, 25)).toBe(3);
  });
});

describe("parsePageSize", () => {
  it("only accepts sizes the screen offers", () => {
    expect(parsePageSize("50", TABLE_PAGE_SIZES, 25)).toBe(50);
    expect(parsePageSize("5000", TABLE_PAGE_SIZES, 25)).toBe(25);
    expect(parsePageSize(null, TABLE_PAGE_SIZES, 25)).toBe(25);
  });
});
