import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Phone } from "lucide-react";
import { agencyLeads } from "@/data/mock";
import type { LeadStatus } from "@/data/mock";
import { ScorePill, StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/agencies")({
  head: () => ({ meta: [{ title: "Agencies — Nyumba Zetu" }] }),
  component: AgenciesPage,
});

const STATUSES: LeadStatus[] = ["New", "Called", "Demo Booked", "Won", "Lost"];

function AgenciesPage() {
  const [rows, setRows] = useState(agencyLeads);

  const updateStatus = (id: string, s: LeadStatus) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status: s } : r)));

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Agencies</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Property management companies ranked by opportunity score.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Areas Covered</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Website</th>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium">Listings</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((a) => (
              <tr key={a.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{a.company}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {a.areas.map((ar) => (
                      <span key={ar} className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {ar}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 tabular-nums text-muted-foreground">{a.phone}</td>
                <td className="px-4 py-3"><a className="text-info hover:underline" href="#">{a.website}</a></td>
                <td className="px-4 py-3"><ScorePill score={a.score} /></td>
                <td className="px-4 py-3 tabular-nums">{a.listings}</td>
                <td className="px-4 py-3">
                  <span className="rounded-md border border-border bg-background px-2 py-0.5 text-xs">{a.category}</span>
                </td>
                <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                <td className="px-4 py-3 text-muted-foreground">{a.assignedTo}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost"><Phone className="h-3.5 w-3.5" /></Button>
                    <select
                      value={a.status}
                      onChange={(e) => updateStatus(a.id, e.target.value as LeadStatus)}
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      {STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                    <Button size="sm" variant="outline">Details</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
