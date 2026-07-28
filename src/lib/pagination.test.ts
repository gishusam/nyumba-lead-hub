import assert from "node:assert/strict";
import test from "node:test";

import { paginate, paginationItems } from "./pagination.ts";

test("paginate returns the requested slice and range", () => {
  const result = paginate(Array.from({ length: 12 }, (_, index) => index + 1), 2, 5);

  assert.deepEqual(result, {
    items: [6, 7, 8, 9, 10],
    page: 2,
    pageSize: 5,
    totalItems: 12,
    totalPages: 3,
    from: 6,
    to: 10,
  });
});

test("paginate clamps a page that is beyond the available range", () => {
  assert.equal(paginate([1, 2], 9, 5).page, 1);
});

test("paginate reports an empty range without inventing a row", () => {
  assert.deepEqual(paginate([], 1, 5), {
    items: [],
    page: 1,
    pageSize: 5,
    totalItems: 0,
    totalPages: 1,
    from: 0,
    to: 0,
  });
});

test("paginationItems keeps short page ranges explicit", () => {
  assert.deepEqual(paginationItems(5, 3), [1, 2, 3, 4, 5]);
});

test("paginationItems condenses a long range around the current page", () => {
  assert.deepEqual(paginationItems(9, 1), [1, 2, 3, "ellipsis", 9]);
  assert.deepEqual(paginationItems(9, 5), [1, "ellipsis", 4, 5, 6, "ellipsis", 9]);
  assert.deepEqual(paginationItems(9, 9), [1, "ellipsis", 7, 8, 9]);
});
