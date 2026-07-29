import { useMemo, useState } from "react";
import {
  AlertCircle,
  Briefcase,
  Building2,
  Check,
  ChevronDown,
  Clock3,
  HardHat,
  Loader2,
  Play,
  Search,
} from "lucide-react";

import type {
  ScraperLocation,
  ScraperOptions,
  ScraperRun,
  ScraperSourceOption,
  ScraperType,
} from "@/lib/api";
import {
  buildScraperQueries,
  groupScraperLocations,
  type PlannedScraperLocation,
  type ScraperLocationGroups,
} from "@/lib/scraper-planner";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ScraperCommandWorkspaceProps = {
  options?: ScraperOptions;
  optionsLoading: boolean;
  optionsError: boolean;
  runs: ScraperRun[];
  scraper: ScraperType;
  selectedAreaId: string | null;
  onScraperChange: (scraper: ScraperType) => void;
  onSelectedAreaChange: (areaId: string) => void;
  onRun: () => void;
  runPending: boolean;
  anyRunning: boolean;
};

const SOURCE_ICONS = {
  apartments: Building2,
  agencies: Briefcase,
  developers: HardHat,
} satisfies Record<ScraperType, typeof Building2>;

const TIER_LABELS: Record<ScraperLocation["tier"], string> = {
  premium: "Premium",
  high_density: "High density",
  unvetted: "Unvetted",
};

function TierBadge({ tier }: { tier: ScraperLocation["tier"] }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-5 px-1.5 text-[9px] uppercase tracking-wide shadow-none",
        tier === "premium" && "border-primary/30 bg-primary/5 text-primary",
        tier === "high_density" && "border-info/30 bg-info/5 text-info",
        tier === "unvetted" && "border-warning/35 bg-warning/5 text-warning",
      )}
    >
      {TIER_LABELS[tier]}
    </Badge>
  );
}

function AreaButton({
  location,
  selected,
  onSelect,
}: {
  location: PlannedScraperLocation;
  selected: boolean;
  onSelect: () => void;
}) {
  const status =
    location.recency === "stale"
      ? `Stale · ${location.ageDays}d`
      : location.recency === "recent"
        ? location.ageDays === 0
          ? "Run today"
          : `Run ${location.ageDays}d ago`
        : "No recent runs";

  return (
    <Button
      type="button"
      variant="outline"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "group relative h-auto min-h-[88px] w-full items-start justify-start whitespace-normal rounded-xl p-3 text-left shadow-none",
        "transition-[border-color,background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:bg-background",
        location.recency === "stale" &&
          "border-warning/35 bg-warning/10 hover:border-warning/60 hover:bg-warning/15",
        selected &&
          "border-primary bg-primary/5 ring-1 ring-primary hover:border-primary hover:bg-primary/10",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="mb-1 flex items-start justify-between gap-2">
          <span className="text-sm font-semibold text-foreground">{location.name}</span>
          {selected && (
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check className="h-3 w-3" />
            </span>
          )}
        </span>
        <span
          className={cn(
            "mb-2 block text-xs",
            location.recency === "stale" ? "text-warning" : "text-muted-foreground",
          )}
        >
          {status}
        </span>
        <TierBadge tier={location.tier} />
      </span>
    </Button>
  );
}

function LocationGroup({
  title,
  description,
  locations,
  selectedAreaId,
  onSelect,
}: {
  title: string;
  description: string;
  locations: PlannedScraperLocation[];
  selectedAreaId: string | null;
  onSelect: (areaId: string) => void;
}) {
  if (!locations.length) return null;
  return (
    <section>
      <div className="mb-2.5 flex items-center gap-2.5">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground">
          {title}
        </div>
        <div className="text-[11px] text-muted-foreground">{description}</div>
        <div className="h-px flex-1 bg-border" />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {locations.map((location) => (
          <AreaButton
            key={location.id}
            location={location}
            selected={selectedAreaId === location.id}
            onSelect={() => onSelect(location.id)}
          />
        ))}
      </div>
    </section>
  );
}

function filterGroups(groups: ScraperLocationGroups, search: string): ScraperLocationGroups {
  const normalized = search.trim().toLocaleLowerCase();
  if (!normalized) return groups;
  const matches = (location: PlannedScraperLocation) =>
    `${location.name} ${location.county}`.toLocaleLowerCase().includes(normalized);
  return {
    stale: groups.stale.filter(matches),
    noRecent: groups.noRecent.filter(matches),
    recent: groups.recent.filter(matches),
  };
}

function QueryPreview({
  source,
  location,
  onRun,
  runPending,
}: {
  source: ScraperSourceOption;
  location?: ScraperLocation;
  onRun: () => void;
  runPending: boolean;
}) {
  const queries = location ? buildScraperQueries(source, location) : [];

  if (!location) {
    return (
      <div className="flex min-h-[340px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-8 text-center">
        <div>
          <Search className="mx-auto mb-3 h-7 w-7 text-muted-foreground/60" />
          <div className="text-sm font-semibold text-foreground">Choose one area</div>
          <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
            Its display name, county qualifier, and complete search set will appear here before the
            worker starts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-xl border border-border bg-background p-4">
        <div className="text-base font-semibold">{location.name}</div>
        <div className="mt-1 text-xs text-muted-foreground">{location.qualified_term}</div>
      </div>

      <div className="mb-2 mt-5 flex items-center justify-between gap-3">
        <div className="text-xs font-semibold">
          {queries.length} Google Maps {queries.length === 1 ? "search" : "searches"}
        </div>
        <div className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Clock3 className="h-3.5 w-3.5" />
          Sequential in one worker
        </div>
      </div>

      <div className="space-y-2">
        {queries.slice(0, 3).map((query, index) => (
          <div key={query} className="grid grid-cols-[24px_minmax(0,1fr)] items-start gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
              {index + 1}
            </span>
            <code className="break-words pt-0.5 font-mono text-[11px] leading-relaxed text-foreground/80">
              {query}
            </code>
          </div>
        ))}
      </div>
      {queries.length > 3 && (
        <div className="ml-8 mt-2 text-[11px] text-muted-foreground">
          + {queries.length - 3} more search variants
        </div>
      )}

      <div className="mt-5 rounded-lg bg-primary/10 px-3 py-2.5 text-[11px] leading-relaxed text-primary">
        The canonical area name and county qualifier are stored with the run. No location is
        inferred from shorthand text.
      </div>

      <Button
        type="button"
        size="lg"
        onClick={onRun}
        disabled={runPending}
        className="mt-4 h-11 w-full"
      >
        {runPending ? (
          <>
            <Loader2 className="animate-spin" />
            Starting worker…
          </>
        ) : (
          <>
            <Play />
            Run {source.label} in {location.name}
          </>
        )}
      </Button>
      <p className="mt-2 text-center text-[10px] text-muted-foreground">
        The scraper has a 12-minute ceiling. Completion time is not estimated.
      </p>
    </div>
  );
}

export function ScraperCommandWorkspace({
  options,
  optionsLoading,
  optionsError,
  runs,
  scraper,
  selectedAreaId,
  onScraperChange,
  onSelectedAreaChange,
  onRun,
  runPending,
  anyRunning,
}: ScraperCommandWorkspaceProps) {
  const [search, setSearch] = useState("");
  const [recentOpen, setRecentOpen] = useState(false);
  const source = options?.sources.find((item) => item.id === scraper);
  const selectedLocation = options?.locations.find((location) => location.id === selectedAreaId);
  const groups = useMemo(
    () =>
      options
        ? groupScraperLocations({
            locations: options.locations,
            runs,
            source: scraper,
            now: new Date(),
            recentRunDays: options.recent_run_days,
          })
        : { stale: [], noRecent: [], recent: [] },
    [options, runs, scraper],
  );
  const visibleGroups = filterGroups(groups, search);
  const visibleCount =
    visibleGroups.stale.length + visibleGroups.noRecent.length + visibleGroups.recent.length;
  const developers = scraper === "developers";

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-4 border-b border-border px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold">Command workspace</div>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                anyRunning ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  anyRunning ? "animate-pulse bg-primary" : "bg-current",
                )}
              />
              {anyRunning ? "Worker running" : "Worker idle"}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            One verified area per run keeps the work bounded and attributable.
          </p>
        </div>

        <Tabs value={scraper} onValueChange={(value) => onScraperChange(value as ScraperType)}>
          <TabsList className="grid h-10 w-full grid-cols-3 md:w-[340px]">
            {(
              options?.sources ?? [
                { id: "apartments", label: "Apartments" },
                { id: "agencies", label: "Agencies" },
                { id: "developers", label: "Developers" },
              ]
            ).map((item) => {
              const Icon = SOURCE_ICONS[item.id as ScraperType];
              return (
                <TabsTrigger key={item.id} value={item.id} className="gap-1.5 px-2 text-xs">
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>

      {optionsError ? (
        <div className="p-5">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Scraper options are unavailable</AlertTitle>
            <AlertDescription>
              Refresh the page before starting a run. No fallback location list is used.
            </AlertDescription>
          </Alert>
        </div>
      ) : optionsLoading || !options || !source ? (
        <div className="flex min-h-[320px] items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading verified scraper options…
        </div>
      ) : developers ? (
        <div className="mx-auto max-w-2xl p-6 lg:p-10">
          <div className="rounded-xl border border-border bg-muted/20 p-6 text-center">
            <HardHat className="mx-auto mb-3 h-8 w-8 text-primary" />
            <div className="text-base font-semibold">Nationwide directory enrichment</div>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Developers does not use an area. It enriches up to 20 pending KPDA directory records.
            </p>
            <Button
              type="button"
              size="lg"
              onClick={onRun}
              disabled={runPending}
              className="mt-5 h-11 min-w-64"
            >
              {runPending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Starting worker…
                </>
              ) : (
                <>
                  <Play />
                  Run Developer Enrichment
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,7fr)_minmax(330px,5fr)]">
          <div className="border-b border-border p-5 lg:border-b-0 lg:border-r">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-sm font-semibold">Choose an area</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {options.locations.length} current Nairobi metro locations. Recent state is
                  limited to the loaded run window.
                </p>
              </div>
              <div className="text-[11px] font-semibold text-primary">1 area per run</div>
            </div>

            <label className="relative mb-5 block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search area or county"
                aria-label="Search verified scraper areas"
                className="h-10 pl-9"
              />
            </label>

            {visibleCount === 0 ? (
              <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
                No verified areas match “{search}”.
              </div>
            ) : (
              <div className="space-y-6">
                <LocationGroup
                  title="Needs re-run"
                  description="latest run evidence has aged"
                  locations={visibleGroups.stale}
                  selectedAreaId={selectedAreaId}
                  onSelect={onSelectedAreaChange}
                />
                <LocationGroup
                  title="No recent runs"
                  description="not seen in the loaded history window"
                  locations={visibleGroups.noRecent}
                  selectedAreaId={selectedAreaId}
                  onSelect={onSelectedAreaChange}
                />
                {!!visibleGroups.recent.length && (
                  <Collapsible open={recentOpen} onOpenChange={setRecentOpen}>
                    <div className="flex items-center gap-2.5">
                      <CollapsibleTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 px-0 text-[10px] font-semibold uppercase tracking-wider hover:bg-transparent"
                        >
                          Recently run
                          <ChevronDown
                            className={cn(
                              "h-3.5 w-3.5 transition-transform",
                              recentOpen && "rotate-180",
                            )}
                          />
                        </Button>
                      </CollapsibleTrigger>
                      <div className="text-[11px] text-muted-foreground">
                        {visibleGroups.recent.length} area
                        {visibleGroups.recent.length === 1 ? "" : "s"} within{" "}
                        {options.recent_run_days} days
                      </div>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                    <CollapsibleContent className="pt-2.5">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                        {visibleGroups.recent.map((location) => (
                          <AreaButton
                            key={location.id}
                            location={location}
                            selected={selectedAreaId === location.id}
                            onSelect={() => onSelectedAreaChange(location.id)}
                          />
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            )}
          </div>

          <aside className="bg-gradient-to-br from-card to-primary/[0.035] p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">Run preview</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Review the exact search scope before starting the worker.
                </p>
              </div>
              <Badge className="border-0 bg-primary/10 text-primary shadow-none hover:bg-primary/10">
                {source.label}
              </Badge>
            </div>
            <QueryPreview
              source={source}
              location={selectedLocation}
              onRun={onRun}
              runPending={runPending}
            />
          </aside>
        </div>
      )}
    </section>
  );
}
