# Scraper Guided Workspace Design

Date: 2026-07-29
Status: Approved for implementation

## Goal

Replace the competing scraper controls and fake map with one functional guided
workspace that starts a bounded, location-correct run. Do not redesign the
already-approved history, record-audit, import-pipeline, or run-health surfaces.

## Approved product boundary

- Apartments and Agencies run against exactly one verified area.
- Developers uses no geography and continues nationwide KPDA enrichment.
- Phase 2 national towns, county browsing, population imports, time estimates,
  and multi-stop planning are out of scope.
- The UI shows the real search count and representative query set:
  Apartments uses seven terms and Agencies uses two.
- The UI does not show a 2/4 cap meter or estimated completion time because
  neither is a dependable backend contract.

## Information architecture

The new command workspace has two columns on desktop:

1. A searchable area board grouped by operational recency.
2. A run preview containing the selected canonical place, county-qualified
   search terms, worker ceiling disclosure, and one primary Run action.

The board uses these states, calculated only from successful runs in the API's
recent 50-run window:

- **Needs re-run**: the latest successful run is older than seven days.
- **No recent runs**: no successful run for the area is present in the loaded
  history window.
- **Recently run**: the latest successful run is at most seven days old.

The language must never imply lifetime coverage. Green indicates selection or
action, not that an area is generally "successful." Stale is amber; no recent
runs is neutral.

## Backend contract

`GET /api/scraper/options` is the frontend's source of truth for:

- source labels and search terms;
- whether a source requires an area;
- the single-area run policy;
- canonical area IDs, display names, counties, qualified terms, and existing
  scoring tiers.

`POST /api/scraper/run` keeps its `areas: string[]` request shape for frontend
compatibility but treats the values as canonical area IDs.

- Apartments/Agencies: exactly one known area ID is required.
- Developers: the list must be empty.
- The database run row stores the canonical display name for readable history.
- The Cloud Run override sends one `--area-id` argument, never a comma-delimited
  display name.

The worker resolves the ID through the same versioned JSON catalog used by the
API image, then passes `--area-id` to the selected spider. Apartments and
Agencies build queries from `qualified_term`; their stored/scored `area`
continues to be the display name. Legacy manual `--areas` remains accepted, but
known names resolve through the catalog and no path appends a literal Nairobi.

## Canonical Phase 1 data

The first catalog is limited to the 25 locations already present in the
frontend/backend working set:

- Nairobi: Kilimani, Kileleshwa, Westlands, Lavington, South B, South C,
  Parklands, Muthaiga, Karen, Runda, Spring Valley, Kasarani, Ngara, Pangani,
  Embakasi, Langata, Kahawa West, Donholm, Upper Hill.
- Kiambu: Ruaka, Kiambu, Ruiru, Thika.
- Machakos: Syokimau, Athi River.

The catalog preserves current `premium` and `high_density` scoring labels.
Locations outside those sets are explicitly `unvetted`; no population or yield
ranking is invented.

## Error handling

- Options loading failure renders an inline destructive message and prevents a
  run.
- Run remains disabled until a location-based source has one selected area.
- Backend rejects invalid source/area combinations before creating a run row.
- Worker rejects an unknown area ID before launching a browser and persists the
  failed run through the existing worker error path.
- Existing toast, polling, history, audit, and run-health behavior stays intact.

## Verification

- Backend unit tests cover the catalog, options contract, request validation,
  structured job override, worker command, and qualified spider queries.
- Frontend unit tests cover recency grouping, exact matching, sorting, and query
  preview generation.
- Frontend build and lint run after integration.
- A real browser verifies Apartments, Agencies, Developers, search, area
  selection, stale/no-recent language, responsive behavior, and absence of
  console/page errors.
