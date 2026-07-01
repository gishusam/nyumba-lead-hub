import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ExternalLink, Phone, Search, Upload } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  leadsApi,
  STATUS_LABEL,
  STATUS_OPTIONS,
  type Lead,
  type LeadStatusApi,
  type LeadType,
} from "@/lib/api";
import { ScorePill, StatusBadgeApi } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { LeadsSummaryStrip } from "@/components/LeadsSummaryStrip";
import { ImportCsvDialog } from "@/components/ImportCsvDialog";
import { LeadDetailPanel } from "@/components/LeadDetailPanel";

export const Route = createFileRoute("/_app/apartments")({
  head: () => ({ meta: [{ title: "Apartments — Nyumba Zetu" }] }),
  component: ApartmentsPage,
});

function ApartmentsPage() {
  return <LeadsTable leadType="apartment" title="Apartments" description="Buildings ranked by software-fit and engagement signals." />;
}

export function LeadsTable({
  leadType,
  title,
  description,
}: {
  leadType: LeadType;
  title: string;
  description: string;
}) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [area, setArea] = useState("");
  const [status, setStatus] = useState<"" | LeadStatusApi>("");
  const [page, setPage] = useState(1);
  const [importOpen, setImportOpen] = useState(false);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  const limit = 20;
  const query = useQuery({
    queryKey: ["leads", leadType, { area, status, page }],
    queryFn: () =>
      leadsApi.list({
        lead_type: leadType,
        area: area || undefined,
        status: status || undefined,
        page,
        limit,
      }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatusApi }) =>
      leadsApi.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads", leadType] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const data = query.data?.data ?? [];
  const filtered = q
    ? data.filter(
        (r) =>
          r.name.toLowerCase().includes(q.toLowerCase()) ||
          (r.owner_name ?? "").toLowerCase().includes(q.toLowerCase()),
      )
    : data;

  const areas = Array.from(new Set(data.map((r) => r.area).filter(Boolean))) as string[];

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        <Button onClick={() => setImportOpen(true)} variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-1.5" /> Import CSV
        </Button>
      </div>

      <LeadsSummaryStrip leadType={leadType} />


      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-border">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter visible rows…"
              className="w-full h-9 rounded-lg border border-input bg-background pl-9 pr-3 text-sm"
            />
          </div>
          <select
            value={area}
            onChange={(e) => {
              setArea(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="">All areas</option>
            {areas.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as LeadStatusApi | "");
              setPage(1);
            }}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Area</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Website</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Assigned</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {query.isLoading && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              )}
              {query.isError && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-destructive">
                    Failed to load leads.
                  </td>
                </tr>
              )}
              {!query.isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                    No leads found.
                  </td>
                </tr>
              )}
              {filtered.map((r: Lead) => (
                <tr
                  key={r.id}
                  onClick={() => setActiveLead(r)}
                  className="hover:bg-muted/30 cursor-pointer"
                >
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.owner_name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.area ?? "—"}</td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">{r.phone ?? "—"}</td>
                  <td className="px-4 py-3">
                    {r.website ? (
                      <a
                        href={r.website.startsWith("http") ? r.website : `https://${r.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-info inline-flex items-center gap-1 hover:underline"
                      >
                        {r.website} <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3"><ScorePill score={r.score ?? 0} /></td>
                  <td className="px-4 py-3"><StatusBadgeApi status={r.status} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{r.assigned_to ?? "—"}</td>
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

        {query.data && query.data.pages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border text-sm">
            <div className="text-muted-foreground">
              Page {query.data.page} of {query.data.pages} · {query.data.total} total
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= (query.data.pages ?? 1)}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <ImportCsvDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        leadType={leadType}
      />
      <LeadDetailPanel lead={activeLead} onClose={() => setActiveLead(null)} />
    </div>
  );
}

