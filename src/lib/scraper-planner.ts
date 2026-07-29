import type { ScraperLocation, ScraperRun, ScraperSourceOption, ScraperType } from "./api.ts";

export type ScraperLocationRecency = "stale" | "no_recent" | "recent";

export type PlannedScraperLocation = ScraperLocation & {
  recency: ScraperLocationRecency;
  ageDays: number | null;
  lastRunAt: string | null;
};

export type ScraperLocationGroups = {
  stale: PlannedScraperLocation[];
  noRecent: PlannedScraperLocation[];
  recent: PlannedScraperLocation[];
};

const TIER_ORDER: Record<ScraperLocation["tier"], number> = {
  premium: 0,
  high_density: 1,
  unvetted: 2,
};

function normalizedArea(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function runAreaNames(run: ScraperRun): string[] {
  if (run.areas?.length) return run.areas;
  return run.area ? [run.area] : [];
}

function runStartedAt(run: ScraperRun): Date | null {
  const value = run.started_at ?? run.created_at;
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function groupScraperLocations({
  locations,
  runs,
  source,
  now,
  recentRunDays,
}: {
  locations: ScraperLocation[];
  runs: ScraperRun[];
  source: ScraperType;
  now: Date;
  recentRunDays: number;
}): ScraperLocationGroups {
  const successfulRuns = runs.filter(
    (run) => run.scraper_type === source && run.status === "success",
  );

  const planned = locations.map<PlannedScraperLocation>((location) => {
    const locationName = normalizedArea(location.name);
    const latest = successfulRuns
      .filter((run) =>
        runAreaNames(run).some((areaName) => normalizedArea(areaName) === locationName),
      )
      .map((run) => ({ run, startedAt: runStartedAt(run) }))
      .filter(
        (
          value,
        ): value is {
          run: ScraperRun;
          startedAt: Date;
        } => value.startedAt !== null,
      )
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())[0];

    if (!latest) {
      return {
        ...location,
        recency: "no_recent",
        ageDays: null,
        lastRunAt: null,
      };
    }

    const ageDays = Math.max(
      0,
      Math.floor((now.getTime() - latest.startedAt.getTime()) / (24 * 60 * 60 * 1000)),
    );
    return {
      ...location,
      recency: ageDays > recentRunDays ? "stale" : "recent",
      ageDays,
      lastRunAt: latest.startedAt.toISOString(),
    };
  });

  return {
    stale: planned
      .filter((location) => location.recency === "stale")
      .sort((a, b) => (b.ageDays ?? 0) - (a.ageDays ?? 0) || a.name.localeCompare(b.name)),
    noRecent: planned
      .filter((location) => location.recency === "no_recent")
      .sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier] || a.name.localeCompare(b.name)),
    recent: planned
      .filter((location) => location.recency === "recent")
      .sort((a, b) => (a.ageDays ?? 0) - (b.ageDays ?? 0) || a.name.localeCompare(b.name)),
  };
}

export function buildScraperQueries(
  source: ScraperSourceOption,
  location: ScraperLocation,
): string[] {
  return source.search_terms.map((searchTerm) => `${searchTerm} ${location.qualified_term}`);
}
