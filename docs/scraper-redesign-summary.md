# Scraper Command Center Redesign — Summary

Date: 2026-07-29
Status: **Guided Workspace approved and implemented.**
Companion docs: [design-system.md](design-system.md) ·
[scraper-location-findings.md](scraper-location-findings.md)

---

## 1. What this was

A design engagement to revamp three surfaces of the Data Scraper page
([`src/routes/_app.scrape.tsx`](../src/routes/_app.scrape.tsx)) — the **Command
Center**, the **Area Picker**, and the **Selected Run** panel.

It turned into two deliverables, because the design work surfaced data bugs that
make the current UI structurally unable to work:

1. A chosen, verified UI direction (this doc).
2. A cross-repo bug investigation ([findings](scraper-location-findings.md)).

Work ran alongside a separate agent's application-shell changes. The implementation
was deliberately limited to the command workspace and its frontend/backend location
contract; the approved Import Pipeline, Run History, Record Audit, and Run Health
surfaces were left intact.

---

## 2. Sequence of the engagement

| Step | Outcome |
|---|---|
| Lock the design system | [design-system.md](design-system.md) — canonical, from real code |
| Explore directions | 6 low-fi, then 3 high-fi interactive screens |
| User rejected map-as-picker | Reworked with real Kenya outline + motion |
| **User chose Direction 01** | Run Planner — "cleanest, easiest to understand" |
| Investigate backend | 6 bugs found, 1 worse than the known one |
| Re-scope for delivery | Guided Workspace, one canonical area, phase 1 only |
| Implement | Shared backend catalog + API options + production React workspace |

---

## 3. The design system (locked first)

Nothing was designed until the foundation was pinned to what actually ships.

- **Source of truth:** [`src/styles.css`](../src/styles.css) + [`src/components/ui/*`](../src/components/ui)
- **Stack:** shadcn/ui on a custom OKLCH theme, Tailwind v4 `@theme inline`
- **Brand:** deep emerald `oklch(0.45 0.13 165)`, near-white surfaces, hairline borders, 12px radius
- **Type:** Inter (body) + Plus Jakarta Sans (display, −0.01em)

Two decisions were **locked** during the engagement:

1. **Outcome colours** — Imported = green, **Updated = blue** (was a second, nearly
   identical green), Duplicates = amber, Rejected = red.
2. **Primitive governance** — new scraper work uses the shadcn primitives
   (`command`, `checkbox`, `pagination`, `tooltip`, `popover`), not hand-rolled markup.

Specimen sheet: [`mockups/01-design-system-specimen.html`](mockups/01-design-system-specimen.html)

---

## 4. BEFORE — what ships today

Structure of the current page, top to bottom:

```
Header + Refresh History
6 KPI cards            (lifetime totals)
Scraper Control Center  Source · Country · County · City · chips · Run
Area Picker             12 hard-coded SVG rectangles + Selected Run side panel
Import Pipeline         funnel for latest run
Scrape Run History      full table
Record Audit            appears on row click
Failed Runs             raw error strings
```

### What's wrong with it

**Structural**

- **Two selection surfaces compete.** County/City dropdowns *and* the map both pick
  areas. Neither is authoritative.
- **The map is fake.** 12 hand-placed rectangles with invented `points` coordinates
  ([`_app.scrape.tsx:27-39`](../src/routes/_app.scrape.tsx:27)). It resembles a map
  without being one, and cannot scale past the Nairobi metro.
- **`Country` is a dead control** — a fixed `Kenya` label that does nothing.
- **Coverage is positional, not prioritised.** A fresh area occupies the first tile
  while a 26-day-stale one sits at the bottom.
- **No bounded-run contract.** The former UI allowed several selections even though
  the only production timing evidence was a single completed apartment run.
- **No time feedback.** Areas run *sequentially* against a 720s subprocess ceiling.
  Nothing warns before a timeout.

**Data-driven (see [findings](scraper-location-findings.md))**

- **12 of 20 backend areas are unreachable** from the UI.
- **Zone IDs are sent instead of names**, so the coverage map's freshness match
  can never succeed for multi-word areas.
- **`Thika` is pre-selected by default** — an out-of-county area that produces a
  corrupt query.

---

## 5. AFTER — Direction 01 refined as the Guided Workspace

**Approved implementation companion:**
[`mockups/05-run-workspace-guided.html`](mockups/05-run-workspace-guided.html)

```
App bar        Source segmented control (Apartments · Agencies · Developers)
Working board  Searchable phase-1 areas grouped by RECENCY, tier-badged
Run preview    One canonical area · exact queries · 12-minute ceiling · Run
```

### The core insight

The selection visual's job is **not** decoration or geography. The quickest
robust contract is one canonical, county-qualified area per apartment or agency
run. That makes the request attributable without pretending that one observed
253-second run is a reliable duration estimator. Developers remain nationwide.

### What each part does

| Element | Behaviour |
|---|---|
| **Searchable board** | All 25 reviewed phase-1 locations come from the backend options contract; no runtime web import. |
| **Bounded selection** | Apartments and Agencies accept exactly one canonical area ID; Developers accept none. |
| **Actionability sort** | `Needs re-run` (stale, oldest first) → `No recent runs` (tier only as a cold-start hint) → `Recently run` (collapsed). |
| **Tier badges** | `Premium` / `High density` preserve the existing scoring hints; `Unvetted` exposes unresolved prioritisation honestly. |
| **Query preview** | Shows the literal backend-provided searches, such as `apartments Kilimani, Nairobi, Kenya`. |
| **Timing copy** | States the real 12-minute worker ceiling and explicitly does not estimate completion. |
| **Developers mode** | Hides geography entirely and presents honest nationwide directory enrichment. |

### Before → after, point by point

| Concern | Before | After |
|---|---|---|
| Selection surfaces | 2 (dropdowns + map) | 1 (the board) |
| Geography claim | Fake SVG rectangles | None — honest tiles + real county data |
| Areas reachable | 12 (7 valid) | 25 reviewed phase-1 locations |
| Area ordering | Positional | Sorted by actionability |
| Run bound | Unclear multi-select | One verified area |
| Time awareness | None | Honest ceiling, no invented estimate |
| Query visibility | None | Previewed per stop |
| `Country` control | Dead | Removed |
| Developers | Shows useless geography | Honest nationwide scope |

### Verification

The production React route was verified with a production-shaped API fixture in
headed browser sessions at desktop and mobile widths:

- stale, no-recent, and recently-run groups were derived from exact successful
  run-area matches rather than substring matching;
- selecting Kilimani exposed all seven apartment queries with the Nairobi
  qualifier;
- searching Ruaka under Agencies exposed the two exact Kiambu-qualified queries;
- Developers removed geography and displayed nationwide directory enrichment;
- the existing pipeline, history, audit, and health sections remained below the
  new workspace.

---

## 6. Directions explored and rejected

All three high-fidelity screens: [`mockups/02-three-directions.html`](mockups/02-three-directions.html)

| Direction | Idea | Verdict |
|---|---|---|
| **01 Run Planner** | Selection as a flight plan with a time budget | **CHOSEN** — "cleanest, easiest to understand" |
| 02 Constellation Map | Areas as nodes at true relative positions | Rejected as picker; reworked then set aside |
| 03 Operations Console | Control-room density, everything on one screen | Not chosen; its **stale strip** is worth stealing |

### The map question, settled

Direction 02 was reworked twice at the user's request — first to true relative
positions, then to a **real Kenya outline with zoom-to-county motion**
([`mockups/03-kenya-map-explored.html`](mockups/03-kenya-map-explored.html)):
projected lon/lat, all 47 county centroids, `viewBox` flight easing into a county's
real bounds, area pins at true coordinates.

It works and is honest. It was still not chosen, because:

- **Coverage is 3 of 47 counties.** Any national map is ~94% empty.
- **Area is inversely correlated with value** — Nairobi is a ~6px target holding most
  of the leads; empty northern counties dominate the canvas.
- **A true choropleth needs sourced, licensed boundary GeoJSON**; the outline here is
  a simplified 30-point trace.

Revisit if coverage genuinely goes national.

---

## 7. Findings summary

Full detail: [scraper-location-findings.md](scraper-location-findings.md)

| # | Bug | Severity |
|---|---|---|
| 1 | Frontend sends `Zone.id`, not `Zone.name` | **Critical** — corrupts queries, coverage map, lead scoring, dedupe |
| 2 | Hardcoded `Nairobi` suffix on every query | High — out-of-county areas resolve to Nairobi |
| 3 | Six divergent area lists across both repos | High — no source of truth |
| 4 | Comma join/split in worker transport | **Latent** — activates when bug 1 is fixed |
| 5 | `untapped_areas` is a phantom field | Medium — coverage signal unusable |
| 6 | `scraper_agent.py` passes `--areas` to developers | Medium — that path exits 2 |

**Measured impact** (local dump, 497 promoted leads): **19.1% excess rows** — 402
unique names across 497 rows. *Tower One Apartments* stored 3× under `runda`,
`thika`, `kiambu`. *Theowner Property Limited* 7× under 7 area tokens. The `thika`
token returned *"Precious Gardens Estate Riruta"* (Riruta is in Nairobi, ~45 km
away); `athi` returned zero apartments and 14 generic Nairobi agencies.

**Ordering constraint:** fix bug 4 *before or with* bug 1. Fixing bug 1 alone
activates bug 4.

---

## 8. Honest limitations

Stated plainly so nothing here is over-read:

- **No run-level data exists locally.** `records_found` / `imported` / `rejected`
  per area could not be compared. Volume alone does *not* show out-of-county areas
  underperforming — the damage is in *what* came back.
- **Tier reuse is a design judgment.** `PREMIUM_AREAS` / `HIGH_DENSITY_AREAS` were
  built to score *leads*, not to prioritise *which area to scrape*. Replace with
  observed yield once run data exists.
- **Phase-2 population is not imported.** The KNBS 2019 workbook (307 rows) has not
  been ingested. Town names are real and reviewed; ranking uses principal-town-first,
  not population. No census figures were estimated. Every phase-2 row is gated behind
  a `Town · review` badge.
- **The Kenya outline is a simplified 30-point trace**, not survey-accurate boundary data.
- **County assignments need ground-truth confirmation** — Runda (Nairobi, not Kiambu
  as the frontend has it), Ruaka (Kiambu), Syokimau (Machakos).

---

## 9. Mockup index

| File | What it is |
|---|---|
| [`mockups/01-design-system-specimen.html`](mockups/01-design-system-specimen.html) | Locked tokens, primitives, outcome colours, coverage cells |
| [`mockups/02-three-directions.html`](mockups/02-three-directions.html) | Three interactive high-fi directions side by side |
| [`mockups/03-kenya-map-explored.html`](mockups/03-kenya-map-explored.html) | Real Kenya outline, 47 counties, zoom-to-county motion |
| [`mockups/04-run-planner-FINAL.html`](mockups/04-run-planner-FINAL.html) | Superseded multi-area/phase-2 exploration |
| [`mockups/05-run-workspace-guided.html`](mockups/05-run-workspace-guided.html) | **Approved Guided Workspace** |
| [`mockups/06-run-workspace-compact.html`](mockups/06-run-workspace-compact.html) | Compact comparison, not chosen |

All are self-contained: no build step, no external requests. Open directly in a browser.

---

## 10. Deliberate follow-ups, not part of this slice

1. Replace tier heuristics with observed per-area yield after enough comparable
   runs exist.
2. Quantify and repair historical duplicates separately; this implementation does
   not rewrite existing lead data.
3. Add reviewed phase-2 locations only when the team is ready to source and own
   that dataset.
