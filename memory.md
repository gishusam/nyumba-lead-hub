# Nyumba Lead Hub Memory

## Contents

- [2026-07-27 - Dashboard and lead-table API repair](#2026-07-27---dashboard-and-lead-table-api-repair)
- [2026-07-28 - Data Scraper pagination scope and national-location deferral](#2026-07-28---data-scraper-pagination-scope-and-national-location-deferral)
- [2026-07-28 - Data Scraper pagination and Run Health implementation](#2026-07-28---data-scraper-pagination-and-run-health-implementation)
- [2026-07-29 - Canonical design-system reference](#2026-07-29---canonical-design-system-reference)

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
