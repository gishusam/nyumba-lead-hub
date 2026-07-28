# Fresh-Agent Prompt: National Scraper Control Center and Coverage Visualization

Copy the prompt below into a fresh Codex task when the national location work is
ready to resume.

---

You are working on Nyumba Zetu's Data Scraper across two adjacent repositories:

- Frontend: `C:\Users\akioko.INDRALIMITED\OneDrive - Indra\Documents\nyumba-lead-hub`
- Backend and worker: `C:\Users\akioko.INDRALIMITED\OneDrive - Indra\Documents\Sales Intelligence Backend`

This is not a dropdown-only frontend task. Treat it as a small cross-repository
product and worker-contract redesign.

## Working Rules

1. Read both repositories' `AGENTS.md` and `memory.md` before proposing changes.
2. Check live git state, current branches, remotes, and uncommitted work. Do not
   overwrite unrelated changes.
3. Never create a branch whose name starts with `CODEX/`. The project owner
   previously allowed direct work on `main`, but confirm the current instruction
   before mutating either repository.
4. First produce a high-fidelity HTML mockup matching the existing Nyumba Zetu
   design system. Obtain approval before implementation.
5. Do not introduce a new frontend or backend route unless the existing
   `/api/scraper/run` contract proves insufficient.
6. Prove the simplest user-visible workflow with real data before proposing
   infrastructure.
7. Update each repository's `memory.md` whenever its code changes.
8. Use `agent-browser` headlessly for normal QA and headed only when visual
   fidelity or interactive debugging requires it.

## Goal

Redesign the Scraper Control Center so an operator can select verified Kenyan
locations nationally without relying on a runtime government, geocoding, or
third-party location API. Preserve multiselect, prevent unsafe run volumes, and
make the visualization below the control center meaningful at national scale.

The final design must feel native to the current website: calm white surfaces,
Nyumba green actions, restrained borders, compact utility copy, and no generic
dashboard-card sprawl.

## Confirmed Current Behavior

Frontend:

- `src/routes/_app.scrape.tsx` contains 12 hard-coded `ZONES`.
- County and city options are derived only from those zones.
- The Country control is a fixed `Kenya` display and adds no value.
- The map/area picker also depends on those 12 zones.
- Selected areas are sent as `areas: string[]` to
  `POST /api/scraper/run`.
- Developers currently displays the same geographic controls even though its
  worker ignores locations.

Backend and worker:

- The API launches one Cloud Run task for the whole selection.
- Selected locations are processed sequentially, not in parallel.
- Apartments performs seven Google Maps searches per location, then enriches up
  to 15 buildings.
- Agencies performs two Google Maps searches per location without the same deep
  enrichment.
- Developers enriches an existing directory and does not consume selected
  locations.
- The scraper subprocess limit is 720 seconds and the Cloud Run task limit is
  900 seconds.
- Verified Apartments run 45 took 253 seconds for one location.
- Current temporary safe caps are:
  - Apartments: 2 locations.
  - Agencies: 4 locations.
  - Developers: nationwide directory enrichment; no location selector.
- Enforce caps in both the frontend and `POST /api/scraper/run`.
- Apartment and Agency query builders currently append `Nairobi` to every
  location. This makes national frontend options inaccurate.
- Replace the hard-coded suffix with `Kenya` and send qualified terms such as
  `Kitale Trans Nzoia County`.
- The API currently comma-joins locations into one worker argument, and the
  worker comma-splits it. A label such as `Kitale, Trans Nzoia` is corrupted
  into two locations. Preserve the list using structured JSON or repeated
  arguments. Do not rely on display punctuation as a transport delimiter.

Relevant backend locations:

- `backend/app/routers/scraper.py`
- `github_agent.py`
- `scraper/spiders/apartments.py`
- `scraper/spiders/googlemaps.py`
- `scraper/spiders/developers.py`
- `tests/test_cloud_run_deployment.py`
- `tests/test_worker.py`

## Location Data

Do not call a government API at runtime.

Create a versioned, reviewed frontend dataset containing:

- all 47 constitutional counties;
- the KNBS 2019 Population in Urban Centres snapshot;
- the existing operational Nairobi-metro targets such as Kilimani, Westlands,
  Parklands, Lavington, Upper Hill, Karen, Embakasi, Ruiru, Thika, Kiambu,
  Athi River, and other currently supported areas.

Source references:

- Constitution of Kenya, First Schedule:
  `https://new.kenyalaw.org/akn/ke/act/2010/constitution/eng@2010-09-03`
- KNBS 2019 census datasets:
  `https://www.knbs.or.ke/reports/kenya-census-2019/`
- KNBS urban-centre workbook:
  `https://www.knbs.or.ke/wp-content/uploads/2023/09/2019-Kenya-population-and-Housing-Census-Population-in-urban-centers-by-sex-and-urban-center.xlsx`

The workbook contains 307 data rows before cleaning and includes multi-county
labels. Define and test normalization rules. Remove aggregate/non-place rows,
normalize official county aliases, and handle cross-county centres explicitly
rather than guessing. Verify the county assignment of every retained existing
operational area; the current hard-coded mapping is not automatically
authoritative.

Store separate values for:

- stable location ID;
- display name;
- county;
- type (`urban_centre` or `operational_area`);
- qualified backend search term without comma-delimiter ambiguity;
- optional source/provenance metadata.

## Control Center UX

Remove Country.

For Apartments and Agencies:

1. Source selector remains the first control.
2. County is a searchable single-selection combobox containing 47 counties.
3. `City, town or area` is disabled until a county is selected.
4. The second combobox is searchable and multiselects places within the chosen
   county.
5. Selecting places adds them immediately to a persistent selection tray.
6. Changing county must not clear places already selected in another county.
7. Group selected chips by county.
8. Operators can remove one place or clear all.
9. Enforce source-specific limits. At the limit, disable additional unchecked
   options and explain why.
10. If switching source makes the existing selection exceed the new cap, do
    not silently truncate it. Preserve selections, block Run, and tell the user
    how many must be removed.
11. Hide geography for Developers and show an honest
    `Nationwide directory enrichment` scope with a normal Run action.
12. Preserve selections in memory when switching temporarily to Developers so
    switching back does not destroy operator work.
13. Use accessible combobox/listbox semantics, keyboard navigation, visible
    focus, and text labels in addition to color.
14. Keep utility copy concise. Do not explain internal Cloud Run architecture
    in the UI.

The frontend may send stable location identifiers or qualified terms, but the
backend must remain authoritative for allowed source, known location,
source-specific cap, and list integrity.

## Visualization Below the Control Center

Do not stretch the existing 12-polygon Nairobi diagram into a fake national
map.

First determine what operator decision this visual should support:

- understanding what is selected;
- seeing recent versus old versus never-scraped coverage;
- identifying the next useful location to scrape;
- inspecting national coverage without implying geographic precision the data
  does not provide.

Design and mock up two or three viable directions, then recommend one. Include
at least:

1. A scalable county coverage explorer: 47 searchable/grouped counties with
   counts and recent/older/not-scraped status, expanding to their cities, towns,
   and operational areas.
2. A real Kenya county map only if accurate, locally bundled county boundary
   data can be sourced, reviewed, kept lightweight, made accessible, and linked
   reliably to the location dataset.
3. A compact selected-run/selection workspace if neither map nor coverage grid
   materially improves operator decisions.

The recommended visual must:

- work for all 47 counties and the bundled location set;
- derive coverage from already loaded run data where possible;
- avoid another runtime geography dependency;
- support keyboard and non-visual users;
- remain useful on laptop widths;
- avoid huge scroll height;
- not claim `never scraped` beyond the history window unless the backend can
  prove that state;
- preserve a clear relationship between selection, coverage, and the Run
  action.

Do not implement the visualization until its mockup is explicitly approved.

## Backend Contract and Safety

Keep the public route `POST /api/scraper/run`.

Define one canonical location representation and carry it without lossy string
joining from:

frontend selection -> request validation -> Cloud Run override -> worker
argument parsing -> scraper query -> persisted run/audit display.

Backend validation must reject:

- unknown scraper types;
- empty location lists for sources that require locations;
- locations not in the reviewed dataset or not represented by an accepted
  qualified-term contract;
- more than 2 Apartments locations;
- more than 4 Agencies locations;
- geographic locations supplied to Developers if the contract treats that as
  invalid;
- malformed structured worker arguments.

Retain backward-compatible display of historical runs whose `areas` contain the
old unqualified strings.

Do not parallelize locations as a shortcut. First prove bounded sequential runs
with the corrected query terms. Parallel browsers would change cost, database
pressure, Google behavior, failure isolation, and audit semantics.

## Required Tests

Frontend:

- 47 counties are searchable.
- Place selector is disabled before county selection.
- Search results are county-scoped.
- Cross-county multiselect persists.
- Existing operational areas remain available.
- Apartments and Agencies limits differ.
- Limit reached and source-switch-over-limit states are explicit.
- Developers hides geography without destroying selections.
- Payload uses the canonical qualified/structured values.
- Keyboard-only combobox and chip removal work.
- No hydration or console errors.

Backend/worker:

- API rejects source-specific over-limit requests.
- Structured location transport preserves commas and spaces.
- Apartments and Agencies append `Kenya`, not `Nairobi`.
- Correct qualified queries are produced for Nairobi and non-Nairobi samples.
- Developers behavior is explicit and tested.
- Historical run formatting remains compatible.
- Worker still persists status and per-run audit records.

Run the existing focused backend tests with the repository's documented
`PYTHONPATH` requirements and keep inherited BuyRentKenya fixture failures
separate from new regressions.

## Verification Gates

1. Build a local frontend mockup and get approval.
2. Implement static data and frontend state with focused tests.
3. Implement backend validation and structured worker transport with tests.
4. Prove one real supported location through the full local/API/UI flow.
5. Prove one non-Nairobi location using the corrected production-shaped query.
6. Prove a bounded multi-location run for each location-aware scraper without
   exceeding worker limits.
7. Verify persisted records, audit rows, history display, selection limits,
   and the approved visualization in a real browser.
8. Capture full-page screenshots at 1900-pixel desktop width plus a compact
   laptop/mobile check.
9. Document every frontend control that invokes or derives from the backend.
10. Update both `memory.md` files.
11. Do not push, deploy, or create a production verification automation until
    explicitly authorized.

Success is a real user-visible national location workflow with correct results,
not merely a successful build, HTTP 200, Cloud Run completion, or zero-error
exit.

---
