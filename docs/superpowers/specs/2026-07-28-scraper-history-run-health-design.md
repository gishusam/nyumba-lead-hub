# Data Scraper History Pagination and Run Health Design

Date: 2026-07-28

## Scope

This design intentionally covers only two low-risk improvements to the existing
Data Scraper page:

1. Paginate Scrape Run History and each Record Audit tab.
2. Replace the raw Failed Runs list with a compact, client-side Run Health view.

The Scraper Control Center, county/city/town expansion, scraper location
transport, source-specific selection limits, and the visualization beneath the
control center are explicitly postponed. They are documented separately in
`docs/handoffs/2026-07-28-scraper-control-center-national-locations-prompt.md`.

No new frontend route or backend route is introduced by this work.

## Problem

The run-history table renders every loaded run, and the selected run's audit
renders every record in the active outcome tab. As history and audit data grow,
the operator must scroll through long tables to reach the rest of the page.

The Failed Runs section repeats individual raw error messages. Long Python
tracebacks and infrastructure errors dominate the layout, while recurring
causes are difficult to recognize.

## Existing Contracts

The implementation must preserve these authenticated API interactions:

- `GET /api/scraper/runs` loads run history and continues polling every ten
  seconds while any loaded run is `running`.
- `GET /api/scraper/runs/{run_id}/records` loads the selected run's audit.
- Clicking a history row sets `selectedRunId` and opens that audit.
- `POST /api/scraper/run` and every Scraper Control Center behavior remain
  untouched.
- The backend currently returns at most 50 runs. Pagination and Run Health
  therefore describe the loaded recent-run window, not lifetime history.

## Run History Pagination

- Default page size: 5 rows.
- Available page sizes: 5 and 10.
- Pagination is applied after the existing source and area filters.
- Changing a filter or page size resets the current history page to 1.
- A page is clamped when filtering reduces the available page count.
- The footer states the visible range and filtered total, for example:
  `Showing 6–10 of 43 runs`.
- Previous and Next are disabled at the boundaries.
- Numeric page controls use the existing green active state and restrained
  border treatment.
- Selecting a row retains the existing Record Audit behavior.
- The selected audit remains open until another run is selected. Pagination
  must not refetch or discard its cached audit merely because the selected row
  is on another history page.
- Loading and empty states continue to occupy the table body and do not render
  misleading pagination controls.

## Record Audit Pagination

- Record Audit has one current page for the active outcome tab.
- Default page size: 5 rows.
- Available page sizes: 5 and 10.
- Pagination is applied after filtering the loaded audit records by outcome.
- Selecting another run resets all audit pages to 1.
- Changing the active outcome tab or audit page size resets the audit page to 1.
- The footer includes the outcome label, for example:
  `Showing 1–5 of 45 rejected records`.
- Empty, loading, and failed-query states preserve the current table behavior.
- Website links and all audit columns remain unchanged.

## Run Health

### Presentation

Replace the Failed Runs card with a section titled `Run health`.

The header states how many loaded recent runs need attention. The section then
shows:

- compact counts by likely cause;
- latest occurrence for each group;
- a short operator-facing recovery suggestion;
- expandable examples containing the original technical message.

When there are no failed runs, render a compact healthy state instead of hiding
the entire section.

### Classification

Classification is entirely client-side and operates on the `error` field
already returned with run history. It must not make an additional request or
change backend persistence.

Implement the classifier as a pure function with an ordered pattern table. The
initial taxonomy should cover:

- timeout;
- database capacity or connection failure;
- worker dispatch or configuration failure;
- zero-record completion;
- scraper/runtime failure;
- missing error message.

Known messages receive a stable category label, plain-language explanation,
and recovery suggestion.

Unknown messages must not disappear into one generic bucket. Normalize each
unknown message by:

- lowercasing;
- removing volatile timestamps, run/execution identifiers, line numbers, and
  absolute file paths;
- collapsing whitespace;
- truncating only after normalization.

Group matching normalized fingerprints under `Needs review`. Distinct
fingerprints remain distinct groups. Preserve the original message as escaped
text behind `Technical details`; never render backend error content as HTML.

Sort groups by most recent occurrence, with `Needs review` visibly marked
without overwhelming the section.

## State and Component Boundaries

Keep pagination and classification in focused units rather than further
expanding the already large route component:

- a reusable pagination-state hook or small helper;
- a compact pagination footer component;
- a pure error-classification module;
- a Run Health presentation component.

The route remains responsible for queries, selection, filters, and composition.
The helpers must not know about TanStack Query or the API client.

## Accessibility

- Pagination buttons have descriptive accessible names.
- The active page uses `aria-current="page"`.
- Disabled boundary controls use native `disabled`.
- Error disclosures use native `details`/`summary` or an equivalent
  keyboard-operable disclosure.
- Status and cause are never communicated by color alone.
- Focus styles match the existing application design system.

## Testing

Add focused tests covering:

- 5- and 10-row history page sizes;
- filter and page-size reset behavior;
- page clamping after filtering;
- audit pagination reset on run and tab changes;
- known error patterns;
- distinct unknown-error fingerprints;
- missing error messages;
- raw technical text rendered safely;
- healthy and mixed Run Health states.

Run the focused tests, lint/type checks used by this repository, and a
production build. Browser verification must use real loaded data and prove:

- five history rows by default;
- page navigation;
- selecting a run still loads its audit;
- five audit rows by default;
- tab switching and pagination;
- grouped known and unknown failures;
- no new console errors, failed requests, or HTTP errors.

Capture a full-page screenshot at a 1900-pixel desktop viewport.

## Non-Goals

- No county, city, town, or neighborhood additions.
- No Scraper Control Center redesign.
- No source-specific run cap.
- No worker argument change.
- No Google Maps query change.
- No coverage map or visualization change.
- No server-side history pagination or lifetime aggregate.
- No new routes.
