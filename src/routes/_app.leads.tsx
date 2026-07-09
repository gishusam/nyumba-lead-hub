import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Phone, Search } from "lucide-react";
import {
  leadsApi,
  STATUS_LABEL,
  STATUS_OPTIONS,
  type Lead,
  type LeadStatusApi,
} from "@/lib/api";
import { StatusBadgeApi } from "@/components/StatusBadge";
import { AiScoreBadge } from "@/components/AiScoreBadge";
import { Button } from "@/components/ui/button";
import { LeadDetailPanel } from "@/components/LeadDetailPanel";

export const Route = createFileRoute("/_app/leads")({
  head: () => ({ meta: [{ title: "My Leads — Nyumba Zetu" }] }),
  component: MyLeads,
});

function fmtDate(d?: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString();
}

function MyLeads() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  const query = useQuery({
    queryKey: ["leads", "mine"],
    queryFn: () => leadsApi.mine(),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatusApi }) =>
      leadsApi.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const raw = query.data;
  const data: Lead[] = Array.isArray(raw) ? raw : (raw?.data ?? []);
  const filtered = q
    ? data.filter(
        (r) =>
          r.name.toLowerCase().includes(q.toLowerCase()) ||
          (r.owner_name ?? "").toLowerCase().includes(q.toLowerCase()) ||
          (r.area ?? "").toLowerCase().includes(q.toLowerCase()),
      )
    : data;

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">My Leads</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Leads currently assigned to you.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-border">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter your leads…"
              className="w-full h-9 rounded-lg border border-input bg-background pl-9 pr-3 text-sm"
            />
          </div>
          <div className="text-xs text-muted-foreground">
            {filtered.length} lead{filtered.length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Area</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Website</th>
                <th className="px-4 py-3 font-medium">AI Score</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Follow-up</th>
                <th className="px-4 py-3 font-medium">Last contacted</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {query.isLoading && (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-muted-foreground">
                    Loading your leads…
                  </td>
                </tr>
              )}
              {query.isError && (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-destructive">
                    Failed to load your leads.
                  </td>
                </tr>
              )}
              {!query.isLoading && !query.isError && filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center text-muted-foreground">
                    No leads assigned to you yet — assign leads from the main tables
                  </td>
                </tr>
              )}
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setActiveLead(r)}
                  className="hover:bg-muted/30 cursor-pointer"
                >
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">{r.lead_type}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.area ?? "—"}</td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">{r.phone ?? "—"}</td>
                  <td className="px-4 py-3">
                    {r.website ? (
                      <a
                        href={r.website.startsWith("http") ? r.website : `https://${r.website}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-info inline-flex items-center gap-1 hover:underline"
                      >
                        {r.website} <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <AiScoreBadge label={r.ai_score_label} score={r.score ?? r.ai_score} />
                  </td>
                  <td className="px-4 py-3"><StatusBadgeApi status={r.status} /></td>
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">{fmtDate(r.follow_up_date)}</td>
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">{fmtDate(r.last_contacted)}</td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      {r.phone && (
                        <a href={`tel:${r.phone}`}>
                          <Button size="sm" variant="ghost"><Phone className="h-3.5 w-3.5" /></Button>
                        </a>
                      )}
                      <select
                        value={r.status}
                        disabled={updateStatus.isPending}
                        onChange={(e) =>
                          updateStatus.mutate({
                            id: r.id,
                            status: e.target.value as LeadStatusApi,
                          })
                        }
                        className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <LeadDetailPanel lead={activeLead} onClose={() => setActiveLead(null)} />
    </div>
  );
}
