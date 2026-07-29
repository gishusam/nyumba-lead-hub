import assert from "node:assert/strict";
import test from "node:test";

import type { ScraperLocation, ScraperRun, ScraperSourceOption } from "./api.ts";
import * as planner from "./scraper-planner.ts";

const locations: ScraperLocation[] = [
  {
    id: "runda",
    name: "Runda",
    county: "Nairobi",
    qualified_term: "Runda, Nairobi County, Kenya",
    tier: "premium",
  },
  {
    id: "thika",
    name: "Thika",
    county: "Kiambu",
    qualified_term: "Thika, Kiambu County, Kenya",
    tier: "unvetted",
  },
  {
    id: "kilimani",
    name: "Kilimani",
    county: "Nairobi",
    qualified_term: "Kilimani, Nairobi County, Kenya",
    tier: "premium",
  },
  {
    id: "upper-hill",
    name: "Upper Hill",
    county: "Nairobi",
    qualified_term: "Upper Hill, Nairobi County, Kenya",
    tier: "unvetted",
  },
];

const run = (
  id: number,
  area: string,
  startedAt: string,
  status: ScraperRun["status"] = "success",
): ScraperRun => ({
  id,
  scraper_type: "apartments",
  areas: [area],
  status,
  started_at: startedAt,
});

test("groups stale, no-recent, and recently-run areas from exact recent history", () => {
  const groupLocations = planner.groupScraperLocations;
  assert.equal(typeof groupLocations, "function");

  const groups = groupLocations({
    locations,
    runs: [
      run(1, "Runda", "2026-07-03T12:00:00Z"),
      run(2, "Thika", "2026-07-08T12:00:00Z"),
      run(3, "Kilimani", "2026-07-27T12:00:00Z"),
      run(4, "Upperhill", "2026-07-28T12:00:00Z"),
    ],
    source: "apartments",
    now: new Date("2026-07-29T12:00:00Z"),
    recentRunDays: 7,
  });

  assert.deepEqual(
    groups.stale.map((item) => [item.name, item.ageDays]),
    [
      ["Runda", 26],
      ["Thika", 21],
    ],
  );
  assert.deepEqual(
    groups.noRecent.map((item) => item.name),
    ["Upper Hill"],
  );
  assert.deepEqual(
    groups.recent.map((item) => [item.name, item.ageDays]),
    [["Kilimani", 2]],
  );
});

test("failed runs do not claim recency and stale areas sort oldest first", () => {
  const groups = planner.groupScraperLocations({
    locations,
    runs: [
      run(1, "Runda", "2026-07-20T12:00:00Z"),
      run(2, "Thika", "2026-07-10T12:00:00Z"),
      run(3, "Kilimani", "2026-07-28T12:00:00Z", "failed"),
    ],
    source: "apartments",
    now: new Date("2026-07-29T12:00:00Z"),
    recentRunDays: 7,
  });

  assert.deepEqual(
    groups.stale.map((item) => item.name),
    ["Thika", "Runda"],
  );
  assert.ok(groups.noRecent.some((item) => item.name === "Kilimani"));
});

test("no-recent areas use scoring tiers only as a cold-start ordering hint", () => {
  const groups = planner.groupScraperLocations({
    locations,
    runs: [],
    source: "apartments",
    now: new Date("2026-07-29T12:00:00Z"),
    recentRunDays: 7,
  });

  assert.deepEqual(
    groups.noRecent.map((item) => item.name),
    ["Kilimani", "Runda", "Thika", "Upper Hill"],
  );
});

test("query preview uses every backend-provided search term", () => {
  const source: ScraperSourceOption = {
    id: "agencies",
    label: "Agencies",
    requires_area: true,
    max_areas: 1,
    search_terms: ["property management companies", "property managers"],
  };

  assert.deepEqual(planner.buildScraperQueries(source, locations[1]), [
    "property management companies Thika, Kiambu County, Kenya",
    "property managers Thika, Kiambu County, Kenya",
  ]);
});
