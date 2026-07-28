import assert from "node:assert/strict";
import test from "node:test";

import type { ScraperRun } from "./api.ts";
import {
  classifyRunError,
  groupFailedRuns,
  normalizeErrorFingerprint,
} from "./scraper-run-health.ts";

function failedRun(
  id: number,
  error: string,
  startedAt: string,
  area = "ruiru",
): ScraperRun {
  return {
    id,
    scraper_type: "apartments",
    areas: [area],
    status: "failed",
    started_at: startedAt,
    error,
  };
}

test("classifyRunError translates known failures into plain language", () => {
  assert.equal(
    classifyRunError("Scraping timed out after 12 minutes").label,
    "Took too long",
  );
  assert.equal(
    classifyRunError(
      "Supabase session pool reached its 15-client limit (EMAXCONNSESSION)",
    ).label,
    "Database was busy",
  );
  assert.equal(
    classifyRunError("NameError: name 'conn' is not defined").label,
    "Needs review",
  );
});

test("normalizeErrorFingerprint removes volatile paths, lines, and identifiers", () => {
  assert.equal(
    normalizeErrorFingerprint("File /app/a.py, line 661: Job 42 failed"),
    normalizeErrorFingerprint("File /app/b.py, line 702: Job 99 failed"),
  );
});

test("groupFailedRuns combines known categories and preserves raw details", () => {
  const groups = groupFailedRuns([
    failedRun(1, "Scraping timed out after 12 minutes", "2026-07-27T10:00:00Z"),
    failedRun(2, "Deadline exceeded after 720 seconds", "2026-07-28T10:00:00Z"),
  ]);

  assert.equal(groups.length, 1);
  assert.equal(groups[0].label, "Took too long");
  assert.equal(groups[0].runs.length, 2);
  assert.equal(groups[0].latestRun.id, 2);
  assert.equal(groups[0].runs[0].error, "Deadline exceeded after 720 seconds");
  assert.equal(groups[0].runs[1].error, "Scraping timed out after 12 minutes");
});

test("groupFailedRuns fingerprints matching unknowns without merging distinct errors", () => {
  const groups = groupFailedRuns([
    failedRun(1, "NameError in /app/a.py line 42: conn missing", "2026-07-27T10:00:00Z"),
    failedRun(2, "NameError in /app/b.py line 99: conn missing", "2026-07-28T10:00:00Z"),
    failedRun(3, "ValueError: invalid scraper mode", "2026-07-26T10:00:00Z"),
  ]);

  assert.equal(groups.length, 2);
  assert.equal(groups[0].runs.length, 2);
  assert.equal(groups[0].latestRun.id, 2);
  assert.equal(groups[1].runs.length, 1);
  assert.equal(groups[1].latestRun.id, 3);
});

test("groupFailedRuns ignores successful and running entries", () => {
  const runs: ScraperRun[] = [
    { ...failedRun(1, "timeout", "2026-07-28T10:00:00Z"), status: "success" },
    { ...failedRun(2, "timeout", "2026-07-28T11:00:00Z"), status: "running" },
  ];

  assert.deepEqual(groupFailedRuns(runs), []);
});
