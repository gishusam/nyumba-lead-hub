# Scraper Guided Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the approved single-area guided scraper workspace and repair the
location contract from frontend selection through worker query construction.

**Architecture:** A versioned JSON catalog in the backend repository is the
single location dataset. FastAPI exposes it and validates canonical IDs; the
Cloud Run worker receives one `--area-id`; the spiders resolve that ID to a
display name and county-qualified query term. The React route delegates planner
logic to a tested library and planner UI to a focused component while leaving
the lower approved sections unchanged.

**Tech Stack:** FastAPI, Pydantic, pytest, Python argparse/Playwright, React 19,
TanStack Query, Tailwind v4, shadcn primitives, Bun tests.

---

### Task 1: Canonical scraper catalog and API contract

**Files:**
- Create: `../Sales Intelligence Backend/backend/app/scraper_locations.json`
- Create: `../Sales Intelligence Backend/backend/app/scraper_catalog.py`
- Modify: `../Sales Intelligence Backend/backend/app/routers/scraper.py`
- Test: `../Sales Intelligence Backend/tests/test_scraper_catalog.py`
- Test: `../Sales Intelligence Backend/tests/test_cloud_run_deployment.py`

- [ ] **Step 1: Write failing catalog and validation tests**

Assert that the catalog contains 25 unique IDs, the corrected county-qualified
terms, source search terms, and these validation outcomes:

```python
assert validate_run_request("apartments", ["kilimani"])["name"] == "Kilimani"
with pytest.raises(HTTPException):
    validate_run_request("apartments", ["kilimani", "westlands"])
with pytest.raises(HTTPException):
    validate_run_request("developers", ["kilimani"])
assert validate_run_request("developers", []) is None
```

Update the job payload assertion to expect:

```python
["--run-id", "42", "--scraper-type", "apartments", "--area-id", "kilimani"]
```

- [ ] **Step 2: Run tests and confirm RED**

Run:

```powershell
$env:PYTHONPATH='backend;scraper'
pytest tests/test_scraper_catalog.py tests/test_cloud_run_deployment.py -q
```

Expected: failures because the catalog module and new job contract do not exist.

- [ ] **Step 3: Implement the catalog, options endpoint, and validation**

Create a JSON catalog with source metadata and the 25 approved areas. Add a
loader that indexes IDs and returns the public options payload. Update
`RunRequest` to default `areas` to an empty list, validate before inserting,
store display names, and send one `--area-id` override for location sources.

- [ ] **Step 4: Run tests and confirm GREEN**

Run the command from Step 2. Expected: all selected tests pass.

### Task 2: Worker and spider location resolution

**Files:**
- Create: `../Sales Intelligence Backend/scraper/location_catalog.py`
- Modify: `../Sales Intelligence Backend/github_agent.py`
- Modify: `../Sales Intelligence Backend/scraper/spiders/apartments.py`
- Modify: `../Sales Intelligence Backend/scraper/spiders/googlemaps.py`
- Modify: `../Sales Intelligence Backend/worker.Dockerfile`
- Test: `../Sales Intelligence Backend/tests/test_worker.py`
- Test: `../Sales Intelligence Backend/tests/test_scraper_location_queries.py`

- [ ] **Step 1: Write failing worker/query tests**

Assert:

```python
assert build_scraper_command("apartments", "kilimani")[-2:] == ["--area-id", "kilimani"]
assert build_scraper_command("developers", None)[-2:] == ["--limit", "20"]
assert apartment_queries("thika")[0] == "apartments Thika, Kiambu County, Kenya"
assert agency_queries("syokimau") == [
    "property management companies Syokimau, Machakos County, Kenya",
    "property managers Syokimau, Machakos County, Kenya",
]
```

- [ ] **Step 2: Run tests and confirm RED**

Run:

```powershell
$env:PYTHONPATH='backend;scraper'
pytest tests/test_worker.py tests/test_scraper_location_queries.py -q
```

Expected: failures on missing `--area-id` and query helpers.

- [ ] **Step 3: Implement catalog resolution and qualified queries**

Load the shared JSON file, support canonical ID and legacy name resolution,
change active worker/spider arguments to `--area-id`, and replace literal
Nairobi suffixes with `qualified_term`. Store and score the catalog display name.
Copy the catalog into the worker image and set its path explicitly.

- [ ] **Step 4: Run tests and confirm GREEN**

Run the command from Step 2. Expected: all selected tests pass.

### Task 3: Frontend planner model and API client

**Files:**
- Create: `src/lib/scraper-planner.ts`
- Create: `src/lib/scraper-planner.test.ts`
- Modify: `src/lib/api.ts`
- Modify: `src/lib/api.test.ts`

- [ ] **Step 1: Write failing planner/client tests**

Cover exact area-name matching, seven-day stale grouping, no-recent grouping,
recent grouping, oldest-stale-first sorting, and scraper options URL/auth
behavior.

- [ ] **Step 2: Run tests and confirm RED**

Run:

```powershell
bun test src/lib/scraper-planner.test.ts src/lib/api.test.ts
```

Expected: failures because planner exports and `scraperApi.options()` are absent.

- [ ] **Step 3: Implement the types, client method, and pure planner helpers**

Use exact normalized names from `ScraperRun.areas`; never use substring
containment. Return `stale`, `noRecent`, and `recent` groups with reader-facing
age labels.

- [ ] **Step 4: Run tests and confirm GREEN**

Run the command from Step 2. Expected: all selected tests pass.

### Task 4: Guided command workspace integration

**Files:**
- Create: `src/components/ScraperCommandWorkspace.tsx`
- Modify: `src/routes/_app.scrape.tsx`

- [ ] **Step 1: Build the focused component from tested helpers**

Use `Tabs`, `Input`, `Button`, and `Badge`. Render:

- source tabs;
- search;
- `Needs re-run`, `No recent runs`, and collapsed `Recently run` groups;
- one selected area using `aria-pressed`;
- real query count/preview;
- Developers nationwide mode;
- loading/error/empty states.

- [ ] **Step 2: Replace only old command/map selection code**

Remove `ZONES`, map coverage, county/city selectors, and ID-default state. Query
`scraperApi.options()`, start location runs with one canonical ID, and start
Developers with an empty list. Leave import pipeline, history, pagination,
record audit, and run health logic/markup unchanged.

- [ ] **Step 3: Run frontend verification**

Run:

```powershell
bun test
bun run build
bun run lint
```

Expected: tests and build pass; lint has no new errors.

### Task 5: Browser proof, documentation, and scoped commits

**Files:**
- Modify: `memory.md`
- Modify: `../Sales Intelligence Backend/memory.md`
- Create: `docs/assets/scraper-guided-workspace-20260729/`

- [ ] **Step 1: Verify the UI in a real browser**

Run the local frontend against a controlled scraper API response. Verify
Apartments, Agencies, Developers, search, selection, query preview, stale/no
recent language, desktop/mobile layout, and Run disabled states. Capture a clean
desktop screenshot and confirm zero console/page errors.

- [ ] **Step 2: Run final backend gates**

Run focused tests, `compileall`, then the full suite with
`PYTHONPATH=backend;scraper`. Keep the two known BuyRentKenya fixture failures
separate if unchanged.

- [ ] **Step 3: Update memory receipts**

Record the approved one-area policy, canonical catalog, active `--area-id`
transport, recency wording, verification results, and the explicit preservation
of history/audit/health.

- [ ] **Step 4: Stage exact scoped paths and commit**

Never stage `src/components/AppSidebar.tsx` or unrelated `.superpowers` content.
Review staged diffs and secret scans, then create one backend commit and one
frontend commit on their existing branches. Do not push.
