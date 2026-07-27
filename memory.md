# Nyumba Lead Hub Memory

## Contents

- [2026-07-27 - Dashboard and lead-table API repair](#2026-07-27---dashboard-and-lead-table-api-repair)

## 2026-07-27 - Dashboard and lead-table API repair

- Production browser QA showed that Apartments, Agencies, Developers, and Landlords were stuck loading because their `/api/leads/outreach` requests returned `404`. The companion backend now implements that existing frontend contract; do not replace these screens with the generic lead-list route unless the outreach counts and latest-email fields remain available.
- The dashboard passed `dashboardApi.byArea` directly as a TanStack Query function. TanStack supplied a query-context object, producing `lead_type=[object Object]`. The route now calls `() => dashboardApi.byArea()`, while the helper only serializes a string. The backend applies the optional filter.
- Sign-in uses `autocomplete="username"` and `autocomplete="current-password"`. Change-password uses `current-password` for the old value and `new-password` for both new-value fields.
- Verification: the focused Node API-client test passes; the Vite production build succeeds; the built-in Chrome browser visited all ten top-level routes against the fixed local API with zero console errors, failed requests, HTTP 4xx/5xx responses, or stuck loading/error states.
- Lovable's development-only component source tagger can emit a React hydration warning because server and client `data-tsd-source` line metadata differ. This was absent in production mode and is tooling-only; validate release behavior in production mode rather than changing application markup for it.
- The local validation stack uses `VITE_API_BASE_URL=http://127.0.0.1:8001` in ignored `.env.local`; never commit secrets or a developer-specific API URL.
