import { createFileRoute } from "@tanstack/react-router";
import { Phone } from "lucide-react";
import { landlordLeads } from "@/data/mock";
import { ScorePill, StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/landlords")({
  head: () => ({ meta: [{ title: "Landlords — Nyumba Zetu" }] }),
  component: LandlordsPage,
});

const portfolioStyle: Record<string, string> = {
  Small: "bg-muted text-muted-foreground",
  Medium: "bg-info/10 text-info",
  "Large Portfolio": "bg-success/15 text-success",
};

function LandlordsPage() {
  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Landlords</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Self-managing landlords sourced from listing platforms.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">Landlord</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Listings</th>
              <th className="px-4 py-3 font-medium">Areas</th>
              <th className="px-4 py-3 font-medium">Portfolio</th>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {landlordLeads.map((l) => (
              <tr key={l.id} className={`hover:bg-muted/30 ${l.portfolio === "Large Portfolio" ? "bg-success/5" : ""}`}>
                <td className="px-4 py-3 font-medium">{l.name}</td>
                <td className="px-4 py-3 tabular-nums text-muted-foreground">{l.phone}</td>
                <td className="px-4 py-3 tabular-nums font-semibold">{l.listings}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {l.areas.map((a) => (
                      <span key={a} className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">{a}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${portfolioStyle[l.portfolio]}`}>
                    {l.portfolio}
                  </span>
                </td>
                <td className="px-4 py-3"><ScorePill score={l.score} /></td>
                <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                <td className="px-4 py-3 text-muted-foreground">{l.assignedTo}</td>
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
  );
}
