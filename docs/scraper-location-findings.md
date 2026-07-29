# Scraper Location Pipeline — Findings & Remediation Spec

Date: 2026-07-29
Status: **Investigation complete; active location-path remediation implemented.**
Scope: cross-repo (`nyumba-lead-hub` frontend + `Sales Intelligence Backend`)
Related: [design-system.md](design-system.md) ·
`docs/handoffs/2026-07-28-scraper-control-center-national-locations-prompt.md`

Evidence standard: every claim below is cited to `file:line` or to the local
`leads_backup_before_reset.json` dump (497 promoted lead rows). Items that could
not be verified locally are listed under **Open questions**, not asserted.

---

## Implementation update — 2026-07-29

The numbered findings below describe the pre-remediation code snapshot and remain
useful as forensic evidence. The active API-to-Cloud-Run-to-spider path now:

- exposes one canonical 25-location phase-1 catalog through `GET /api/scraper/options`;
- accepts exactly one known location ID for Apartments or Agencies and no location
  for Developers;
- sends that ID as one `--area-id` argument, eliminating comma join/split transport;
- resolves a reviewed display name and county-qualified search term inside the
  worker;
- stores the display name on the run and builds every query from the shared catalog;
- leaves historical deduplication, inactive legacy orchestration paths, analytics
  mock data, and phase-2 population out of this bounded implementation.

The implementation intentionally uses `Thika, Kiambu, Kenya`, not a blanket
`Nairobi` suffix, and treats Runda as Nairobi, Ruaka as Kiambu, and Syokimau as
Machakos.

---

## 1. Executive summary

The scraper's location handling is broken in a way that corrupts lead data, and
the root cause is **not** the known hardcoded `Nairobi` suffix. It is that the
frontend sends **zone IDs** where the backend expects **place names**.

Ranked by severity:

| # | Bug | Blast radius |
|---|---|---|
| 1 | Frontend sends `Zone.id`, not `Zone.name` | Corrupt queries, broken coverage map, broken lead scoring, duplicate leads |
| 2 | Hardcoded `Nairobi` suffix on every query | Out-of-county areas resolve to Nairobi |
| 3 | Six divergent area lists across both repos | No single source of truth |
| 4 | Comma join/split in worker transport | **Latent** — activates the moment bug 1 is fixed |
| 5 | `untapped_areas` is a phantom field | Coverage signal unusable |
| 6 | `scraper_agent.py` passes `--areas` to developers | That path exits 2 |

**Ordering constraint:** bug 4 must be fixed *before or with* bug 1. Fixing bug 1
alone activates bug 4.

---

## 2. Bug 1 — Zone IDs are sent instead of names

**Evidence**

- `src/routes/_app.scrape.tsx:98` — `useState<string[]>(["thika"])` seeds state with an **ID**.
- `src/routes/_app.scrape.tsx:395` — `onClick={() => toggleArea(z.id)}`.
- `src/routes/_app.scrape.tsx:153` — `runMutation.mutate({ scraper_type: scraper, areas: selectedAreas })`.

`selectedAreas` therefore holds `Zone.id` and never `Zone.name`.

**Produced queries**

| Operator clicks | Query actually issued |
|---|---|
| Upper Hill | `apartments upperhill Nairobi` |
| Athi River | `apartments athi Nairobi` |

The default page state is `["thika"]` — the highest-risk area is pre-selected on load.

**Proven downstream in production data.** `leads.area` in the local dump contains
lowercase IDs (`upperhill`, `athi`), not display names.

### 2a. Consequence — the coverage map can never work

`src/routes/_app.scrape.tsx:388` matches
`runAreas(r).toLowerCase().includes(z.name.toLowerCase())`.
Run areas are IDs (`"upperhill"`); `z.name.toLowerCase()` is `"upper hill"`.
Multi-word zones never match and render "Not scraped" permanently, regardless of
how many successful runs they have.

### 2b. Consequence — lead scoring is silently wrong

`scraper/spiders/apartments.py:135-138` matches `area.lower()` against
`PREMIUM_AREAS` / `HIGH_DENSITY_AREAS`. IDs (`upperhill`, `thika`, `kiambu`,
`ruiru`, `athi`) are in neither set, so those areas never receive the +15/+10
bonus. **Lead scores are not comparable across areas.**

### 2c. Consequence — duplicate leads

`pipeline.py:235` and `:273` dedupe with `AND LOWER(l.area) = LOWER(g.area)`.
The same business found under a different area token is inserted as a new lead.

Measured in the local dump: **402 unique names across 497 rows — 95 excess rows (19.1%).**

| Company | Rows | Area tokens |
|---|---|---|
| Theowner Property Limited | 7 | NULL, lavington, thika, westlands, parklands, upperhill, kilimani |
| Ardhi Safi Limited | 6 | NULL, upperhill, athi, Kilimani, thika, embakasi |
| Simpl Property Management | 6 | lavington, athi, Kilimani, thika, westlands, parklands |
| Tower One Apartments | 3 | runda, thika, kiambu |

---

## 3. Bug 2 — Hardcoded `Nairobi` suffix

Complete set of occurrences:

| file:line | Expression |
|---|---|
| `scraper/spiders/apartments.py:154` | `query = f"{keyword} {area} Nairobi"` — runs 7× per area |
| `scraper/spiders/googlemaps.py:235` | `f"property management companies {area} Nairobi"` |
| `scraper/spiders/googlemaps.py:236` | `f"property managers {area} Nairobi"` |
| `scraper/spiders/developers.py:268` | `query = f"{name} Nairobi Kenya"` — on the **company name**, not an area |

**Proven contamination.** `thika` apartment results include
*"Precious Gardens Estate Riruta"* (Riruta is in Dagoretti, Nairobi — ~45 km from
Thika) and *"Twin Towers Apartments (A), Ruiru Kimbo"*. The `athi` token returned
**zero apartments** and 14 generic Nairobi agencies.

**Two areas in the backend's own default list are not in Nairobi** and hit the same
bug: `Ruaka` (Kiambu) and `Syokimau` (Machakos).

**Honest caveat.** Volume alone does *not* show out-of-Nairobi areas
underperforming — Thika returned 39 leads. The damage is in *what* came back, not
how much.

---

## 4. Bug 3 — Six divergent area lists

| file:line | List | Count | Note |
|---|---|---|---|
| `scraper/spiders/apartments.py:34` | `DEFAULT_AREAS` | 20 | The de-facto truth |
| `scraper/spiders/googlemaps.py:31` | `DEFAULT_AREAS` | 15 | Contains **street names** (Lenana Road, Kindaruma Road, Mugunga Road) |
| `pipeline.py:41` | `DEFAULT_AREAS` | 15 | Byte-identical to googlemaps' |
| `backend/app/routers/reports.py:29` | `KNOWN_AREAS` | 23 | Union of the two backend lists |
| `scraper/spiders/jiji.py:41` | `TARGET_AREAS` | 19 | Hyphenated slugs (`spring-valley`, `upper-hill`) |
| `src/data/mock.ts:4` | `AREAS` | 10 | **Fake data**, still rendered as fact at `_app.analytics.tsx:116` |

### Frontend ↔ backend divergence

Overlap **7** · backend-only **13** · frontend-only **5**.

Backend-only (unreachable from the UI today): Kileleshwa, Muthaiga, Spring Valley,
South B, South C, Kasarani, Ngara, Pangani, Langata, Donholm, Kahawa West, Ruaka,
Syokimau.

Frontend-only: Upper Hill, Kiambu, Ruiru, Thika, Athi River.

**County mislabels to correct:** the frontend labels `Runda` as Kiambu (it is
Nairobi). `Ruaka` is Kiambu; `Syokimau` is Machakos.

**Data gap:** `Kahawa West` is in `DEFAULT_AREAS` but in **neither** tier set, so it
silently scores 10–15 points below its neighbours.

---

## 5. Bug 4 — Comma transport (latent, becomes live on fixing bug 1)

- **Join:** `backend/app/routers/scraper.py:56` — `"--areas", ",".join(areas)`
- **Split:** `scraper/spiders/apartments.py:675` and `scraper/spiders/googlemaps.py:332`
  — `[a.strip() for a in args.areas.split(",")]`

Additional join sites: `scraper_agent.py:251`, `pipeline.py:84`, `pipeline.py:94`.

Currently latent only because no zone ID contains a comma. **It activates the
moment display names are sent.** The DB column is already `TEXT[]` and Cloud Run
`args` accepts multiple elements — the join is unnecessary and should be replaced
with repeated arguments or structured JSON.

---

## 6. Bug 5 — `untapped_areas` is a phantom

`src/lib/api.ts:436` declares `untapped_areas?: string[]`. **No backend producer and
no frontend consumer exist.** Same for `coverage?:` at `api.ts:429`. Both are dead
type surface.

The real field is `untapped_this_week`, produced at
`backend/app/routers/reports.py:357-360`. It is **not usable** as a "what to scrape
next" signal:

1. 16 of 23 `KNOWN_AREAS` cannot be selected in the UI at all — they report
   "untapped" permanently and no operator action can clear them.
2. The comparison is ID-vs-name, so only single-word areas ever match, by coincidence.
3. Thika, Ruiru, Kiambu and Athi River are absent from `KNOWN_AREAS` — the four
   highest-risk areas are invisible in both directions.

Only `status = 'success'` runs count, and `github_agent.py:54-57` fails any run with
zero records — so a genuinely empty area stays "untapped" rather than "tried,
nothing there".

---

## 7. Developers

`developers.py` **does not use locations at all** — `area` appears zero times.
It enriches KPDA company names via its own hardcoded query (`:268`).

- `developer_staging.area` (`migrations/init.sql:213`) is never written by the spider.
- `github_agent.py:147` maps `"area": "area"`, writing NULL into every developer
  `scraper_run_records` row.
- `github_agent.py:44` correctly drops `--areas` for developers
  (asserted by `tests/test_worker.py:110`).
- **But** `scraper_agent.py:48-49` still appends `--areas`, and `developers.py`
  argparse (`:454-460`) has no such flag → **exit 2**.
- `backend/app/routers/scraper.py:35` has the same defect but is dead code
  (`run_scraper_background` at `:88` has no callers).

**UI implication:** Developers must hide geography entirely and present an honest
"Nationwide directory enrichment" scope.

---

## 8. Forensic trail

The query string **is** persisted:

- `apartments.py:236` → `:407` → `:429-440` `INSERT INTO apartment_staging (…, search_area, search_query, …)`
  (column: `migrations/init.sql:173`)
- `googlemaps.py:216` → `google_places_leads.search_query` (`migrations/init.sql:163`)
- `developer_staging` has **no** `search_query` column — developer runs leave no trail.

`search_query` is **not** propagated to `leads` (`pipeline.py:216-221`, `:246-253`),
so the trail exists only in staging.

```sql
-- Stored queries naming a place outside Nairobi county
SELECT 'apartments' AS src, search_area, search_query, COUNT(*) AS rows,
       MIN(scraped_at), MAX(scraped_at), COUNT(contact_phone) AS with_phone
FROM apartment_staging
WHERE search_query ~* '(thika|ruiru|kiambu|athi|syokimau|ruaka|machakos)'
GROUP BY 1,2,3
UNION ALL
SELECT 'agencies', area, search_query, COUNT(*),
       MIN(scraped_at), MAX(scraped_at), COUNT(phone)
FROM google_places_leads
WHERE search_query ~* '(thika|ruiru|kiambu|athi|syokimau|ruaka|machakos)'
GROUP BY 1,2,3 ORDER BY 2,3;

-- Queries built from a raw zone ID rather than a display name
SELECT DISTINCT search_query, search_area, COUNT(*)
FROM apartment_staging
WHERE search_query ~ '(upperhill|athi Nairobi|thika Nairobi|ruiru Nairobi|kiambu Nairobi)'
GROUP BY 1,2;

-- Same business promoted under multiple area tokens
SELECT LOWER(name) AS n, COUNT(*) AS rows, ARRAY_AGG(DISTINCT area)
FROM leads GROUP BY 1 HAVING COUNT(*) > 1 ORDER BY 2 DESC;
```

**Caveat.** `apartment_staging` has no `run_id`, so run attribution must be
time-windowed; and `apartments.py:441-458`
(`ON CONFLICT … DO UPDATE SET scraped_at = EXCLUDED.scraped_at`) rewrites
`scraped_at` on re-scrape. Historical attribution will be lossy.

---

## 9. Remediation order

Order matters — steps 1 and 2 are coupled.

1. **Fix the transport.** Replace the comma join with repeated `--areas` arguments
   or structured JSON; update both splits. *Must land before step 2.*
2. **Send canonical identifiers, not zone IDs.** One location record carries
   `id`, `display_name`, `county`, `type`, and a `qualified_term`.
3. **Replace the hardcoded suffix.** Qualify from the record's county
   (`"Thika, Kiambu County, Kenya"`), never a literal `Nairobi`.
4. **Unify the six area lists** behind one versioned dataset. Delete `mock.ts`
   usage from the analytics page or label it as sample data.
5. **Correct county assignments** — Runda → Nairobi; Ruaka → Kiambu;
   Syokimau → Machakos. Assign a tier to Kahawa West or document why it has none.
6. **Backfill or quarantine** the 19.1% duplicate leads once dedupe keys on a
   canonical location id rather than a free-text area.
7. **Remove or implement** `untapped_areas` / `coverage` in `api.ts`.
8. **Fix or retire** `scraper_agent.py:48-49`.

## 10. UI decisions that follow

Locked into the Run Planner design ([artifact](https://claude.ai/code/artifact/181d7bd1-f0c7-44ea-a4d4-ff97a0a93c70)):

- **Query preview per run stop** — renders the literal search that will execute, so
  a wrong qualifier is visible *before* spending worker time.
- **Actionability sorting** — stale first, then never-run by tier, fresh collapsed.
- **Per-source caps** (Apartments 2 / Agencies 4) with a sequential time budget
  against the 720s subprocess ceiling.
- **Never silently truncate** an over-cap selection; block Run and state how many to remove.
- **Provenance gating** — phase-2 towns carry a "Town · review" badge until signed off.
- **Coverage honesty** — "no recent runs" stays neutral grey, scoped to the loaded window.

> **Caveat on tiers.** `PREMIUM_AREAS` / `HIGH_DENSITY_AREAS` were built to score
> *leads*, not to prioritise *which area to scrape next*. The Run Planner reuses
> them as a cold-start ranking signal. Replace with observed yield per area once
> reliable run data exists.

---

## 11. Open questions

Require DB access or a live run:

1. **Per-run outcomes.** No `scraper_runs` / `scraper_run_records` data exists
   locally. Section 8 query 3 against production is the only way to compare
   `records_found` / `imported` / `rejected` for out-of-county vs in-county areas.
2. **How much of `apartment_staging.search_query` carries zone IDs vs names**, and
   whether names were ever sent historically.
3. **Whether Google returned Thika-area results at all**, or purely Nairobi ones —
   needs `latitude`/`longitude` from `apartment_staging` tested against a Thika
   bounding box. The local dump has no coordinates.
4. **Is `scraper_agent.py` still deployed?** If yes, every developer run through it
   fails with exit 2.
5. **Has `ON CONFLICT (normalized_name, search_area)` been masking re-scrapes?**
   Because `search_area` is part of the key, the same building under two tokens is
   two rows, not an upsert — consistent with the 19.1% excess.
6. **`developer_staging.area` provenance** — never written by the spider, but
   `pipeline.py:292` promotes it into `leads.area`. All 57 developer leads in the
   local dump have `area: null`.

## 12. Phase-2 dataset status

The national location set in the Run Planner covers all 47 counties (~140 places).
Town names are real and reviewed. **Population is NOT imported** — the KNBS 2019
urban-centres workbook (307 rows before cleaning) has not been ingested, so ranking
currently uses principal-town-first rather than population.

Every phase-2 entry is gated behind a `Town · review` badge and must be signed off
before it can be scraped. No census figures have been estimated or invented.
