import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ExternalLink, Phone, Search, Star } from "lucide-react";
import { apartments, AREAS } from "@/data/mock";
import type { LeadStatus } from "@/data/mock";
import { ScorePill, StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/apartments")({
  head: () => ({ meta: [{ title: "Apartments — Nyumba Zetu" }] }),
  component: ApartmentsPage,
});

const STATUSES: ("All" | LeadStatus)[] = ["All", "New", "Called", "Demo Booked", "Won", "Lost"];

function ApartmentsPage() {
  const [q, setQ] = useState("");
  const [area, setArea] = useState("All");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("All");
  const [sortDesc, setSortDesc] = useState(true);

  const rows = useMemo(() => {
    return apartments
      .filter((a) =>
        (area === "All" || a.area === area) &&
        (status === "All" || a.status === status) &&
        a.name.toLowerCase().includes(q.toLowerCase())
      )
      .sort((a, b) => (sortDesc ? b.score - a.score : a.score - b.score));
  }, [q, area, status, sortDesc]);

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Apartments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Buildings ranked by software-fit and engagement signals.
          </p>
        </div>
        <Button>+ Add Apartment</Button>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-border">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search building…"
              className="w-full h-9 rounded-lg border border-input bg-background pl-9 pr-3 text-sm"
            />
          </div>
          <select value={area} onChange={(e) => setArea(e.target.value)} className="h-9 rounded-lg border border-input bg-background px-3 text-sm">
            <option value="All">All areas</option>
            {AREAS.map((a) => <option key={a}>{a}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value as LeadStatus)} className="h-9 rounded-lg border border-input bg-background px-3 text-sm">
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <Button variant="outline" size="sm" onClick={() => setSortDesc((v) => !v)}>
            Score {sortDesc ? "↓" : "↑"}
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium">Building</th>
                <th className="px-4 py-3 font-medium">Area</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Website</th>
                <th className="px-4 py-3 font-medium">Reviews</th>
                <th className="px-4 py-3 font-medium">Rating</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Last Contact</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((a) => (
                <tr key={a.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{a.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.area}</td>
                  <td className="px-4 py-3"><ScorePill score={a.score} /></td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">{a.phone}</td>
                  <td className="px-4 py-3">
                    <a href="#" className="text-info inline-flex items-center gap-1 hover:underline">
                      {a.website} <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{a.reviews}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                      <span className="tabular-nums">{a.rating}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{a.assignedTo}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.lastContact}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost"><Phone className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="outline">Details</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
