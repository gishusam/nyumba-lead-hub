import { describe, expect, it } from "vitest";

import { paginateRows } from "./communications-dashboard-data";

describe("paginateRows", () => {
  const rows = Array.from(
    { length: 23 },
    (_, index) => `row-${index + 1}`,
  );

  it("returns ten rows for the first page", () => {
    const result = paginateRows(rows, 1, 10);

    expect(result.items).toHaveLength(10);
    expect(result.items[0]).toBe("row-1");
    expect(result.items[9]).toBe("row-10");

    expect(result.from).toBe(1);
    expect(result.to).toBe(10);
    expect(result.total).toBe(23);
    expect(result.totalPages).toBe(3);
  });

  it("returns the correct range for later pages", () => {
    const result = paginateRows(rows, 3, 10);

    expect(result.items).toEqual([
      "row-21",
      "row-22",
      "row-23",
    ]);

    expect(result.from).toBe(21);
    expect(result.to).toBe(23);
    expect(result.totalPages).toBe(3);
  });

  it("clamps an invalid page to the available range", () => {
    expect(
      paginateRows(rows, 99, 10).page,
    ).toBe(3);

    expect(
      paginateRows(rows, 0, 10).page,
    ).toBe(1);
  });

  it("handles an empty collection", () => {
    expect(
      paginateRows([], 1, 10),
    ).toEqual({
      items: [],
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 1,
      from: 0,
      to: 0,
    });
  });
});
