# Nyumba Lead Hub Memory

## Contents

- [2026-07-27 - Dashboard and lead-table API repair](#2026-07-27---dashboard-and-lead-table-api-repair)
- [2026-07-28 - Data Scraper pagination scope and national-location deferral](#2026-07-28---data-scraper-pagination-scope-and-national-location-deferral)
- [2026-07-28 - Data Scraper pagination and Run Health implementation](#2026-07-28---data-scraper-pagination-and-run-health-implementation)
- [2026-07-29 - Canonical design-system reference](#2026-07-29---canonical-design-system-reference)
- [2026-07-29 - Application shell UX direction](#2026-07-29---application-shell-ux-direction)
- [2026-07-29 - Guided scraper workspace and canonical location contract](#2026-07-29---guided-scraper-workspace-and-canonical-location-contract)

## 2026-07-27 - Dashboard and lead-table API repair

- Production browser QA showed that Apartments, Agencies, Developers, and Landlords were stuck loading because their `/api/leads/outreach` requests returned `404`. The companion backend now implements that existing frontend contract; do not replace these screens with the generic lead-list route unless the outreach counts and latest-email fields remain available.
- The dashboard passed `dashboardApi.byArea` directly as a TanStack Query function. TanStack supplied a query-context object, producing `lead_type=[object Object]`. The route now calls `() => dashboardApi.byArea()`, while the helper only serializes a string. The backend applies the optional filter.
- Sign-in uses `autocomplete="username"` and `autocomplete="current-password"`. Change-password uses `current-password` for the old value and `new-password` for both new-value fields.
- Verification: the focused Node API-client test passes; the Vite production build succeeds; the built-in Chrome browser visited all ten top-level routes against the fixed local API with zero console errors, failed requests, HTTP 4xx/5xx responses, or stuck loading/error states.
- Lovable's development-only component source tagger can emit a React hydration warning because server and client `data-tsd-source` line metadata differ. This was absent in production mode and is tooling-only; validate release behavior in production mode rather than changing application markup for it.
- The local validation stack uses `VITE_API_BASE_URL=http://127.0.0.1:8001` in ignored `.env.local`; never commit secrets or a developer-specific API URL.

## 2026-07-28 - Data Scraper pagination scope and national-location deferral

- The approved quick implementation scope is limited to 5/10-row client-side pagination for Scrape Run History and each Record Audit outcome tab, plus a client-side Run Health view that groups known errors and fingerprints unknown patterns while preserving raw technical details.
- Do not change the Scraper Control Center, geography controls, scraper payload, worker, Google Maps queries, or the visualization beneath the control center as part of this quick slice. The focused design is `docs/superpowers/specs/2026-07-28-scraper-history-run-health-design.md`.
- National locations are a separate cross-repository project, not a dropdown-only frontend change. The current worker runs locations sequentially; Apartments performs seven searches plus enrichment per location and is conservatively capped at 2, while Agencies performs two searches per location and is capped at 4. Developers ignores locations and should eventually present nationwide directory enrichment.
- The postponed work must replace hard-coded `Nairobi` query suffixes with `Kenya`, preserve structured locations without comma-join/split corruption, enforce limits in the API and UI, bundle reviewed county/KNBS location data instead of calling a runtime government API, and redesign the 12-zone visualization for national scale. The complete fresh-agent prompt is `docs/handoffs/2026-07-28-scraper-control-center-national-locations-prompt.md`.
- `/api/scraper/runs` currently returns at most 50 rows. Until a lifetime aggregate contract is deliberately added, history pagination, Run Health counts, and scrape KPIs derived from that response describe recent loaded runs rather than all-time history.

## 2026-07-28 - Data Scraper pagination and Run Health implementation

- Scrape Run History now paginates the already-filtered recent run window with a default of 5 rows and a 5/10-row selector. Source, area, and page-size changes return to page 1; derived pagination clamps safely when the result count shrinks.
- Record Audit independently paginates each imported, rejected, or duplicate outcome after filtering, defaults to 5 rows, offers 5/10 rows, and resets to page 1 when the selected run, outcome, or page size changes.
- The old raw Failed Runs list is now Run Health. Known timeout, database-capacity, source/network, and access failures are translated into plain language. Unknown errors are normalized and fingerprinted into distinct numbered patterns, while every original backend error remains available in collapsed Technical details.
- No scraper backend route, payload, response, control-center control, area map, selected-run card, or pipeline visualization changed. Regression coverage preserves `GET /api/scraper/runs`, `GET /api/scraper/runs/{id}/records`, and `POST /api/scraper/run` with `{ scraper_type, areas }`.
- Verification: 12 Node tests pass; the scoped ESLint check passes with only the repository-wide CRLF Prettier rule disabled; the production Vite build succeeds. Repository-wide `npm run lint` remains blocked by the pre-existing LF/CRLF mismatch across untouched files.
- Real-data browser QA at `http://127.0.0.1:5000/scrape` used the Vite proxy and authenticated production data: 43 recent runs loaded over HTTP 200, Run #45 returned its audit over HTTP 200, history showed 5 then 10 rows, audit tabs and pages reset correctly, and raw timeout details remained intact. The full-width visual evidence is `C:\Users\akioko.INDRALIMITED\.codex\visualizations\2026\07\28\019faa11-5db1-7be3-8e91-49ddf635a64e\scraper-pagination-run-health-full.png`.
- The separate fresh-agent implementation prompt for the postponed Scraper Control Center and national-scale visualization remains `docs/handoffs/2026-07-28-scraper-control-center-national-locations-prompt.md`.

## 2026-07-29 - Canonical design-system reference

- `docs/design-system.md` is the locked reference for Nyumba Zetu's visual tokens, typography, spacing, primitives, scraper semantic colors, and coverage-honesty rules.
- New scraper and command-center work should reuse the existing shadcn primitives and the documented semantic mapping instead of introducing parallel hand-rolled UI patterns.

## 2026-07-29 - Application shell UX direction

- The approved shell change is documented in `docs/superpowers/specs/2026-07-29-navbar-sticky-sidebar-design.md` on branch `navbar-sticky-sidebar`.
- The executable handoff is `docs/superpowers/plans/2026-07-29-navbar-sticky-sidebar.md`; it keeps desktop and mobile navigation on one route list, uses the existing lead detail panel for global-search results, and defines the PR proof matrix.
- The top bar should use the full main-column width, allow global search to flex, and retain only functional account controls. The unused notification bell and broad global refresh action are intentionally removed rather than made to imply unsupported product capabilities.
- Desktop navigation should remain viewport-sticky with safe internal overflow. Narrow layouts must preserve the existing mobile navigation model and prevent the sidebar from consuming page width.
- Browser closure requires desktop and narrow-viewport proof across Dashboard, Data Scraper, Apartments, and at least one other route, with committed screenshots under `docs/assets/pr-navbar-sticky-sidebar/`.
- Implementation checkpoint: `427358c` makes one shared navigation body viewport-sticky on desktop and exposes it through a route-closing mobile sheet. `5d804ab` makes the top bar full-width, removes the fake refresh/notification controls, adds responsive account treatment, reports search failure, and opens selected global-search results in the existing `LeadDetailPanel`.
- Scoped ESLint, `npx tsc --noEmit`, and the complete Vite client/SSR/Nitro production build pass. Disposable unauthenticated browser geometry checks at 1440x900 and 390x844 confirm sticky positioning, a working mobile sheet, and no horizontal overflow.
- The original authenticated real-data QA gate could not reuse the user's browser session without exposing credentials. Final shell/search interaction proof therefore uses deterministic API fixtures; production-data behavior remains explicitly unverified.
- Search guidance is now implemented at the full width of the flexible search region. Focusing an empty field explains the only backend-supported dimensions (lead/property name, owner name, and area), shows responsive examples, and states the two-character minimum. A one-character value stays client-side and asks for one more character instead of sending a request that the backend would reject with HTTP 422.
- Browser interaction proof used deterministic API fixtures: one character showed the minimum guidance, two characters returned a lead, and selecting it opened the existing `LeadDetailPanel`. Desktop (1440x900) and mobile (390x844) measurements confirmed the guidance panel exactly matches the search width and introduces no horizontal overflow. Dashboard scrolling kept the desktop sidebar sticky at viewport top; Settings, Apartments, and My Leads also retained the shell correctly.
- PR-ready screenshots are `docs/assets/pr-navbar-sticky-sidebar/navbar-search-guidance-desktop.png` and `docs/assets/pr-navbar-sticky-sidebar/navbar-search-guidance-mobile.png`. The repeated `data-tsd-source` hydration warning remains the documented development-only Lovable tagger mismatch and was not introduced by this work.

## 2026-07-29 - Guided scraper workspace and canonical location contract

- The approved scraper direction is the Guided Workspace in `src/components/ScraperCommandWorkspace.tsx`, based on `docs/mockups/05-run-workspace-guided.html`. The compact comparison in `06-run-workspace-compact.html` was not chosen; `04-run-planner-FINAL.html` is retained as a superseded multi-area/phase-2 exploration.
- Apartments and Agencies now select exactly one backend-owned canonical location ID. Developers accepts no location and displays nationwide directory enrichment. The frontend does not own, duplicate, or invent the location list.
- Area state is framed as `Needs re-run`, `No recent runs`, or `Recently run`; do not present an area as generically successful. Only successful runs in the loaded history window establish recency. Exact normalized display-name matching replaces substring matching, and stale means older than the backend-provided seven-day threshold.
- The board sorts stale areas oldest first, no-recent areas by existing tier only as a cold-start hint, and recent areas newest first. Tier is not observed scraper yield and must not be described as such.
- The run preview shows every backend-provided search term using the canonical county-qualified term. It states the real 12-minute subprocess ceiling but intentionally does not estimate completion from the single 253-second historical Ruiru run.
- `GET /api/scraper/options` supplies the 25 reviewed phase-1 locations, source search terms, recency threshold, and history-window size. Phase-2 web/KNBS import, historical duplicate repair, and observed-yield prioritisation are explicit follow-ups rather than hidden dependencies.
- `src/routes/_app.scrape.tsx` removed the duplicate country/county/city controls, fake SVG geography, and default Thika selection. The existing Import Pipeline, Run History, Record Audit, and Run Health implementations remain in place. The first KPI is labelled `Runs Loaded`, since `/api/scraper/runs` returns a bounded recent window rather than lifetime totals.
- Verification: all 16 frontend Node tests pass; scoped ESLint for the new workspace/planner passes; `npx tsc --noEmit` passes; the complete client/SSR/Nitro production build passes. Repository-wide lint remains blocked by the existing CRLF Prettier baseline across unrelated files.
- Headed `agent-browser` verification exercised Apartments, Agencies, Developers, area search, canonical selection, exact query preview, and 1440×1000/390×844 layouts against a production-shaped local API. Screenshots are under `docs/assets/scraper-guided-workspace-20260729/`.
