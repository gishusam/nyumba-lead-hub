# Nyumba Zetu — Design System (Locked Reference)

Date locked: 2026-07-28
Source of truth: [`src/styles.css`](../src/styles.css) + [`src/components/ui/*`](../src/components/ui)
Status: **Canonical & locked.** All new scraper / command-center / coverage work must
build on this. New work uses the shadcn primitives below, not hand-rolled Tailwind
markup. Locked decisions are marked **LOCKED (2026-07-28)** inline.

---

## 0. Ethos (the smell test)

Every screen must pass this, verbatim from the national-scraper handoff:

> Calm white surfaces, Nyumba green actions, restrained borders, compact utility
> copy, no generic dashboard-card sprawl.

Practical rules:
- Metrics use `tabular-nums`. Labels are `text-[11px]` uppercase, muted.
- One primary (green) action per surface. Everything else is outline/ghost.
- Color never carries meaning alone — always pair with text/icon (accessibility).
- Prefer density + hierarchy over more cards.

---

## 1. Foundation tokens (from `styles.css`)

Stack: Tailwind v4 `@theme inline`, shadcn token names, OKLCH color, `.dark` variant
defined (dark palette not yet authored — light is the shipping theme).

### Color — brand & neutrals
| Token | OKLCH | Reads as | Use |
|---|---|---|---|
| `--primary` | `0.45 0.13 165` | deep emerald | primary actions, selection, focus ring |
| `--primary-foreground` | `0.99 0.005 160` | near-white | text on primary |
| `--accent` | `0.95 0.04 170` | pale emerald | hover / selected surfaces |
| `--background` | `0.995 0.002 240` | near-white | app background |
| `--card` / `--popover` | `1 0 0` | pure white | raised surfaces |
| `--foreground` | `0.18 0.03 250` | near-black ink | primary text |
| `--muted` | `0.97 0.008 250` | light grey | subtle fills, table headers |
| `--muted-foreground` | `0.5 0.02 250` | grey | labels, secondary text |
| `--border` / `--input` | `0.92 0.01 250` | light grey | 1px hairlines |
| `--ring` | `0.45 0.13 165` | emerald | focus rings |

### Color — semantic
| Token | OKLCH | Meaning |
|---|---|---|
| `--success` | `0.66 0.16 155` | good outcome (imported) |
| `--warning` | `0.78 0.16 70` | caution (duplicates / stale) |
| `--destructive` | `0.6 0.22 25` | bad outcome (rejected / failed) |
| `--info` | `0.62 0.16 245` | neutral emphasis (blue) |

Each semantic token has a `-foreground` pair. Tint surfaces with `/10`–`/20` alpha,
solid text/icon at full strength (e.g. `bg-success/15 text-success`).

### Charts
`--chart-1..5` = emerald / blue / amber / magenta / red. Use for multi-series only.

### Radius (`--radius: 0.75rem` = 12px)
| Name | Value | Applied to |
|---|---|---|
| `sm` | 8px | — |
| `md` | 10px | **buttons, inputs, badges, selects** |
| `lg` | 12px | small panels |
| `xl` | 16px | **cards / sections** |
| `2xl` | 20px | hero surfaces |
| `full` | pill | chips, status dots, legend dots |

### Type
- Body / UI: **Inter** (`--font-sans`).
- Headings h1–h4: **Plus Jakarta Sans** (`--font-display`), letter-spacing `-0.01em`.
- Scale in use: page title `text-2xl font-semibold`; section title `text-sm font-semibold`;
  eyebrow/label `text-[11px] uppercase tracking-wide` muted; metric `text-2xl`/`text-xl`
  `tabular-nums`; body `text-sm`; utility `text-xs`; micro-label `text-[10px]/[11px]`.

### Spacing & elevation
- Page: `p-6 lg:p-8`, `max-w-[1500px] mx-auto`, sections `space-y-8`.
- Card padding: `p-4` (KPI) · `p-5` (side panel) · `p-6` (major section).
- Grids: `gap-3`.
- Elevation: `shadow-sm` default, `shadow` for cards/primary button. Depth comes from
  hairline borders, not heavy shadow.

---

## 2. Primitives (canonical — from `components/ui`)

### Button — `components/ui/button.tsx`
- Base: `rounded-md text-sm font-medium`, focus ring `ring-1 ring-ring`, disabled `opacity-50`.
- Variants: `default` (emerald) · `destructive` · `outline` · `secondary` · `ghost` · `link`.
- Sizes: `default` h-9 · `sm` h-8 text-xs · `lg` h-10 · `icon` h-9 w-9.
- **Run action** = `default` at `lg`.

### Badge — `components/ui/badge.tsx`
- Base: `rounded-md border px-2.5 py-0.5 text-xs font-semibold`.
- Variants: `default` (emerald) · `secondary` · `destructive` · `outline`.
- Status pills (Success/Running/Failed, coverage) extend this with `/15` tinted surfaces.

### Input — `components/ui/input.tsx`
- `h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm`, focus `ring-1 ring-ring`.

### Card — `components/ui/card.tsx`
- `rounded-xl border bg-card shadow`. Header/Content padding `p-6`.
- Section pattern in-app: `rounded-xl border border-border bg-card shadow-sm overflow-hidden`.

### Also available (use these instead of hand-rolling)
`select`, `command` (searchable combobox / palette), `popover`, `checkbox`, `tabs`,
`pagination`, `tooltip`, `accordion`, `scroll-area`, `table`, `sheet`, `drawer`,
`progress`, `skeleton`, `separator`, `dropdown-menu`, `sonner` (toasts).

> **LOCKED (2026-07-28):** the current `_app.scrape.tsx` hand-rolls
> buttons/chips/segmented-control in raw Tailwind. **New scraper work migrates to the
> primitives above** — especially `command` (county/place search), `checkbox` (place
> selection), `pagination` (already speccing), `tooltip` (cap-at-limit reasons),
> `popover`. Hand-rolled markup is not added for anything a primitive already covers.

---

## 3. Domain semantic mapping (scraper) — LOCK THIS

One consistent color language across Command Center, Coverage, Selected Run, History,
Audit, and Run Health.

| Concept | Token | Rationale |
|---|---|---|
| Found / total | `foreground` (neutral) | raw volume, not a judgment |
| With contact | `info` (blue) | useful but neutral |
| **Imported** | `success` (green) | the win |
| **Updated** | `info` (blue) — see note | disambiguate from Imported |
| **Duplicates** | `warning` (amber) | caution, not failure |
| **Rejected** | `destructive` (red) | discarded |
| Coverage: fresh | `success` | scraped recently |
| Coverage: stale | `warning` | scraped, but old |
| Coverage: never / none | `muted` (neutral grey) | **honest** — empty, not alarming |

**LOCKED (2026-07-28):** Imported = green (`success`), **Updated = blue (`info`)**,
Duplicates = amber (`warning`), Rejected = red (`destructive`). This replaces the old
two-greens mapping (Imported `success` + Updated `primary`) everywhere it appears.

---

## 4. Coverage honesty rule

`never scraped` may only be claimed when the backend proves lifetime state. Until then,
freshness is derived from the loaded run window and labelled *"in recent runs"*, with
never-seen cells rendered **neutral/empty (`muted`), never red**. This matters most in
any map/matrix view, where emptiness dominates the layout.

---

## 5. What is NOT yet in the system
- No authored dark palette (tokens exist, values don't).
- No canonical "segmented control", "chip/selection tray", "KPI stat", "status pill",
  "coverage cell", or "outcome funnel" component — these are recurring patterns that
  should be promoted to shared components as the scraper revamp lands.
