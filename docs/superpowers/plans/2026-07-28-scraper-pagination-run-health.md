# Scraper Pagination and Run Health Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make recent scraper runs and record audits compact to browse, and replace raw failed-run dumps with a plain-language, grouped Run Health view without changing the scraper backend contract.

**Architecture:** Keep all pagination and error interpretation in the frontend because the existing backend returns a bounded recent window of at most 50 runs and complete record-audit payloads. Extract deterministic pagination and run-health logic into small tested modules, then compose reusable UI controls into the existing scraper route. Preserve every existing scraper URL and request/response shape.

**Tech Stack:** React 19, TanStack Query, TypeScript, Tailwind CSS, Node test runner, Vite, agent-browser.

---

## File Structure

- Create `src/lib/pagination.ts`: bounds-safe pagination and compact page-number generation.
- Create `src/lib/pagination.test.ts`: behavior tests for slicing, empty results, page clamping, and page-number ellipses.
- Create `src/lib/scraper-run-health.ts`: ordered known-error classification, unknown-error normalization/fingerprinting, and grouping.
- Create `src/lib/scraper-run-health.test.ts`: known category, unknown grouping, normalization, and raw-detail preservation tests.
- Modify `src/lib/api.test.ts`: regression-test the unchanged scraper URLs and POST payload.
- Modify `src/routes/_app.scrape.tsx`: reusable pagination footer, history and audit pagination state, and Run Health presentation.
- Modify `memory.md`: record the shipped behavior, backend boundary, and verification evidence.

### Task 1: Pagination Domain Logic

**Files:**
- Create: `src/lib/pagination.test.ts`
- Create: `src/lib/pagination.ts`

- [ ] **Step 1: Write failing pagination tests**

Cover these exact behaviors with Node `assert`:

```ts
assert.deepEqual(paginate(Array.from({ length: 12 }, (_, i) => i + 1), 2, 5), {
  items: [6, 7, 8, 9, 10],
  page: 2,
  pageSize: 5,
  totalItems: 12,
  totalPages: 3,
  from: 6,
  to: 10,
});
assert.equal(paginate([1, 2], 9, 5).page, 1);
assert.deepEqual(paginate([], 1, 5).items, []);
assert.deepEqual(paginationItems(9, 1), [1, 2, 3, "ellipsis", 9]);
assert.deepEqual(paginationItems(9, 5), [1, "ellipsis", 4, 5, 6, "ellipsis", 9]);
```

- [ ] **Step 2: Run tests and verify the expected missing-module failure**

Run:

```powershell
node --test src/lib/pagination.test.ts
```

Expected: FAIL because `./pagination.ts` does not exist.

- [ ] **Step 3: Implement the minimum pure pagination API**

Export:

```ts
export const PAGE_SIZE_OPTIONS = [5, 10] as const;
export type PaginationItem = number | "ellipsis";
export function paginate<T>(items: readonly T[], requestedPage: number, pageSize: number): Paginated<T>;
export function paginationItems(totalPages: number, currentPage: number): PaginationItem[];
```

`paginate` must clamp the requested page into the available range, report `from: 0` and `to: 0` for an empty list, and never mutate its input. `paginationItems` must show all pages when there are at most five and otherwise show the first, last, current neighborhood, and ellipses.

- [ ] **Step 4: Run the focused test**

Run:

```powershell
node --test src/lib/pagination.test.ts
```

Expected: PASS.

### Task 2: Run Health Classification

**Files:**
- Create: `src/lib/scraper-run-health.test.ts`
- Create: `src/lib/scraper-run-health.ts`

- [ ] **Step 1: Write failing classifier tests**

Use real `ScraperRun` objects and cover:

```ts
assert.equal(classifyRunError("Scraping timed out after 12 minutes").label, "Took too long");
assert.equal(classifyRunError("Supabase session pool reached its 15-client limit (EMAXCONNSESSION)").label, "Database was busy");
assert.equal(classifyRunError("NameError: name 'conn' is not defined").label, "Needs review");
assert.equal(
  normalizeErrorFingerprint("File /app/a.py, line 661: Job 42 failed"),
  normalizeErrorFingerprint("File /app/b.py, line 702: Job 99 failed"),
);
```

Also verify that `groupFailedRuns`:

- combines known failures in the same category;
- combines unknown failures only when their normalized fingerprints match;
- retains the original raw `error` on every grouped run;
- orders groups by most recent occurrence.

- [ ] **Step 2: Run tests and verify the expected missing-module failure**

Run:

```powershell
node --test src/lib/scraper-run-health.test.ts
```

Expected: FAIL because `./scraper-run-health.ts` does not exist.

- [ ] **Step 3: Implement the ordered classifier and grouping**

Known categories must be evaluated in this order:

1. timeout/deadline → `Took too long`;
2. connection pool/database capacity → `Database was busy`;
3. upstream/network/source availability → `Source was unavailable`;
4. authentication/permission → `Access issue`;
5. unmatched → `Needs review`.

Each category exposes a short plain-language explanation. Unknown errors use a normalized fingerprint that removes volatile paths, line numbers, UUIDs, timestamps, and standalone numbers while retaining meaningful exception text. Group keys are category keys for known errors and `unknown:<fingerprint>` for unknown errors.

- [ ] **Step 4: Run the focused test**

Run:

```powershell
node --test src/lib/scraper-run-health.test.ts
```

Expected: PASS.

### Task 3: Preserve the Frontend/Backend Contract

**Files:**
- Modify: `src/lib/api.test.ts`

- [ ] **Step 1: Add failing contract assertions**

Intercept `fetch` and assert:

```ts
await scraperApi.runs(); // GET /api/scraper/runs
await scraperApi.records(45); // GET /api/scraper/runs/45/records
await scraperApi.run("apartments", ["ruiru", "thika"]);
// POST /api/scraper/run with exactly:
// {"scraper_type":"apartments","areas":["ruiru","thika"]}
```

The test must inspect URL, method, and parsed body; it must not call a real backend.

- [ ] **Step 2: Run the API contract test**

Run:

```powershell
node --test src/lib/api.test.ts
```

Expected: PASS without production API changes. If it fails, correct only the test setup unless it exposes an existing contract regression.

### Task 4: Paginate Scrape Run History

**Files:**
- Modify: `src/routes/_app.scrape.tsx`

- [ ] **Step 1: Add history pagination state and derive the current slice**

Add page and page-size state with defaults `1` and `5`. Apply `paginate` after the existing source and area filters. Reset page to `1` when either filter or the page size changes. Render table rows from the paginated slice, not all filtered runs.

- [ ] **Step 2: Add a reusable pagination footer**

The footer must render:

- `Showing X–Y of Z runs`;
- a `Rows` select with 5 and 10;
- previous/next controls with accessible labels;
- compact numbered page buttons and ellipses;
- disabled previous/next at the bounds.

Use the current border, muted-text, primary, radius, and focus styles. Do not add a route or dependency.

- [ ] **Step 3: Preserve row selection**

Clicking a visible history row must still set `selectedRunId` and reveal the matching Record Audit component. Filtering to fewer pages must clamp the derived page without producing an empty table.

### Task 5: Paginate Record Audit

**Files:**
- Modify: `src/routes/_app.scrape.tsx`

- [ ] **Step 1: Add audit pagination state**

Within `RunRecordsPanel`, default to 5 rows and page 1. Apply the outcome tab filter first, then paginate the result. Reset page 1 on run, outcome-tab, or page-size change.

- [ ] **Step 2: Add the shared footer**

Render `Showing X–Y of Z rejected/imported/duplicate records`, the 5/10 rows selector, and page controls beneath the audit table. Preserve empty, loading, and error states and the existing tab counts supplied by the backend summary.

### Task 6: Replace Failed Runs With Run Health

**Files:**
- Modify: `src/routes/_app.scrape.tsx`

- [ ] **Step 1: Derive grouped failures**

Call `groupFailedRuns(runs)` once with `useMemo`. Treat the loaded backend response as the recent-history window; do not claim lifetime counts.

- [ ] **Step 2: Render status-first Run Health**

Always render a `Run health` section:

- When healthy: green check icon, `No failures in recent history`, and a sentence describing the loaded recent window.
- When failures exist: header summary such as `12 failed runs across 3 issues in recent history`.
- For each group: plain-language label, explanation, run count, last-seen time, and affected source/area summary.
- Put original backend strings only inside a native collapsed `<details>` labelled `Technical details`.

React text nodes must render all backend strings; do not use `dangerouslySetInnerHTML`.

- [ ] **Step 3: Keep the section compact**

Show one compact row/card per issue group rather than one always-expanded card per failed run. Within technical details, list affected run IDs, source/areas, timestamp, and the raw error.

### Task 7: Verification, Visual Evidence, and Memory

**Files:**
- Modify: `memory.md`
- Create: screenshot under the active Codex visualization directory

- [ ] **Step 1: Run automated verification**

Run:

```powershell
node --test src/lib/pagination.test.ts src/lib/scraper-run-health.test.ts src/lib/api.test.ts
npm run lint
npm run build
```

Expected: zero test failures, zero lint errors, and build exit code 0.

- [ ] **Step 2: Run the app against the configured backend**

Start the Vite app on its configured port and verify the `/scrape` page loads with real recent scraper data. Do not trigger a new scrape.

- [ ] **Step 3: Browser-test the interaction contract**

Using agent-browser at a 1900-pixel desktop width:

- verify history initially shows at most 5 rows;
- change history rows to 10 and confirm the range/count updates;
- navigate to another history page and select a row;
- verify Record Audit appears for that run and initially shows at most 5 records;
- switch audit outcome tabs and confirm page reset;
- open one Run Health technical-details disclosure and confirm raw text is preserved;
- inspect console and network for new frontend errors or changed scraper paths.

- [ ] **Step 4: Capture visual evidence**

Capture one full-page screenshot at the full viewport width showing the compact history, audit, and Run Health sections. Save it in:

```text
C:\Users\akioko.INDRALIMITED\.codex\visualizations\2026\07\28\019faa11-5db1-7be3-8e91-49ddf635a64e
```

- [ ] **Step 5: Update project memory**

Add a dated section to `memory.md` documenting the frontend-only pagination/classification architecture, unchanged backend routes, recent-window limitation, test commands, localhost URL, and screenshot path.

- [ ] **Step 6: Review and commit only in-scope files**

Review `git diff`, leave `.superpowers/` untouched, and commit the plan, code, tests, and memory on `main` with a focused message. Do not push.
