import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { agencyLeads, apartments, landlordLeads } from "@/data/mock";
import type { LeadSource, LeadStatus } from "@/data/mock";
import { ScorePill } from "@/components/StatusBadge";

export const Route = createFileRoute("/_app/leads")({
  head: () => ({ meta: [{ title: "My Leads — Nyumba Zetu" }] }),
  component: MyLeads,
});

interface Card {
  id: string;
  name: string;
  source: LeadSource;
  phone: string;
  score: number;
  area: string;
  last: string;
  status: LeadStatus;
}

const ME = "Brian Otieno";

const COLS: LeadStatus[] = ["New", "Called", "Demo Booked", "Won", "Lost"];
const colStyle: Record<LeadStatus, string> = {
  New: "border-t-info",
  Called: "border-t-warning",
  "Demo Booked": "border-t-primary",
  Won: "border-t-success",
  Lost: "border-t-destructive",
};

function buildCards(): Card[] {
  const a = apartments
    .filter((x) => x.assignedTo === ME)
    .map((x) => ({ id: x.id, name: x.name, source: "Apartments" as const, phone: x.phone, score: x.score, area: x.area, last: x.lastContact, status: x.status }));
  const g = agencyLeads
    .filter((x) => x.assignedTo === ME)
    .map((x) => ({ id: x.id, name: x.company, source: "Agencies" as const, phone: x.phone, score: x.score, area: x.areas[0], last: "2 days ago", status: x.status }));
  const l = landlordLeads
    .filter((x) => x.assignedTo === ME)
    .map((x) => ({ id: x.id, name: x.name, source: "Landlords" as const, phone: x.phone, score: x.score, area: x.areas[0], last: "Today", status: x.status }));
  return [...a, ...g, ...l];
}

function MyLeads() {
  const [cards, setCards] = useState<Card[]>(buildCards());
  const [dragId, setDragId] = useState<string | null>(null);

  const byCol = useMemo(() => {
    const m: Record<LeadStatus, Card[]> = { New: [], Called: [], "Demo Booked": [], Won: [], Lost: [] };
    cards.forEach((c) => m[c.status].push(c));
    return m;
  }, [cards]);

  const drop = (status: LeadStatus) => {
    if (!dragId) return;
    setCards((cs) => cs.map((c) => (c.id === dragId ? { ...c, status } : c)));
    setDragId(null);
  };

  const sourceColor: Record<LeadSource, string> = {
    Apartments: "bg-chart-1/15 text-chart-1",
    Agencies: "bg-chart-2/15 text-chart-2",
    Landlords: "bg-chart-3/15 text-chart-3",
  };

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">My Leads</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Drag cards between columns to move leads through the pipeline.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {COLS.map((col) => (
          <div
            key={col}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => drop(col)}
            className={`rounded-xl border border-border border-t-4 ${colStyle[col]} bg-card p-3 min-h-[400px]`}
          >
            <div className="flex items-center justify-between px-1 mb-3">
              <div className="text-sm font-semibold">{col}</div>
              <div className="text-xs rounded-full bg-muted px-2 py-0.5 tabular-nums">{byCol[col].length}</div>
            </div>
            <div className="space-y-2">
              {byCol[col].map((c) => (
                <div
                  key={c.id}
                  draggable
                  onDragStart={() => setDragId(c.id)}
                  className="rounded-lg border border-border bg-background p-3 shadow-sm cursor-grab active:cursor-grabbing hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium text-sm leading-tight">{c.name}</div>
                    <ScorePill score={c.score} />
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${sourceColor[c.source]}`}>
                      {c.source}
                    </span>
                    <span className="text-[11px] text-muted-foreground">· {c.area}</span>
                  </div>
                  <div className="mt-2 text-[11px] text-muted-foreground tabular-nums">{c.phone}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">Last activity: {c.last}</div>
                </div>
              ))}
              {byCol[col].length === 0 && (
                <div className="text-xs text-muted-foreground/70 text-center py-8">Drop leads here</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
