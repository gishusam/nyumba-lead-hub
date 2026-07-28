# Nyumba Lead Hub Memory

## Contents

- [2026-07-27 - Dashboard and lead-table API repair](#2026-07-27---dashboard-and-lead-table-api-repair)
- [2026-07-28 - Data Scraper pagination scope and national-location deferral](#2026-07-28---data-scraper-pagination-scope-and-national-location-deferral)

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
