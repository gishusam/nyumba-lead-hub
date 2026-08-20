import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Phone, Search } from "lucide-react";
import {
  leadsApi,
  STATUS_LABEL,
  STATUS_OPTIONS,
  type Lead,
  type LeadStatusApi,
  type SalesRep,
} from "@/lib/api";
import { StatusBadgeApi } from "@/components/StatusBadge";
import { AiScoreBadge } from "@/components/AiScoreBadge";
import { SourceBadge } from "@/components/SourceBadge";
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
  const [page, setPage] = useState(1);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [selectedAssigneeId, setSelectedAssigneeId] = useState("");
  const limit = 20;

  const query = useQuery({
    queryKey: ["leads", "mine", page],
    queryFn: () => leadsApi.mine(page, limit),
    staleTime: 0,
    retry: 1,
    refetchOnWindowFocus: true,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatusApi }) =>
      leadsApi.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const assigneesQuery = useQuery({
    queryKey: ["leads", "assignees"],
    queryFn: () => leadsApi.assignees(),
    staleTime: 5 * 60 * 1000,
  });

  const bulkAssignMut = useMutation({
    mutationFn: ({
      leadIds,
      assigneeId,
    }: {
      leadIds: string[];
      assigneeId: number;
    }) => leadsApi.bulkAssign(leadIds, assigneeId),

    onSuccess: (result) => {
      toast.success(
        `${result.updated} lead${result.updated === 1 ? "" : "s"} reassigned to ${result.assigned_to}`,
      );
      setSelectedLeadIds(new Set());
      setSelectedAssigneeId("");

      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["leads", "mine"] });
      qc.invalidateQueries({ queryKey: ["outreach"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },

    onError: (err: any) =>
      toast.error(err?.message ?? "Failed to reassign selected leads"),
  });

  const raw = query.data;
  // Backend may return a paginated envelope or a raw array
  const data: Lead[] = Array.isArray(raw) ? raw : (raw?.data ?? []);
  const totalPages: number = Array.isArray(raw) ? 1 : (raw?.pages ?? 1);
  const totalCount: number = Array.isArray(raw) ? data.length : (raw?.total ?? data.length);

  const sorted = [...data].sort((a, b) => {
    const ax = a.follow_up_date ? new Date(a.follow_up_date).getTime() : Infinity;
    const bx = b.follow_up_date ? new Date(b.follow_up_date).getTime() : Infinity;
    return ax - bx;
  });
  const filtered = q
    ? sorted.filter(
        (r) =>
          r.name.toLowerCase().includes(q.toLowerCase()) ||
          (r.area ?? "").toLowerCase().includes(q.toLowerCase()),
      )
    : sorted;

  const visibleLeadIds = filtered.map((lead) => lead.id);
  const allVisibleSelected =
    visibleLeadIds.length > 0 &&
    visibleLeadIds.every((id) => selectedLeadIds.has(id));

  useEffect(() => {
    setSelectedLeadIds(new Set());
    setSelectedAssigneeId("");
  }, [page, q]);

  const toggleLeadSelection = (leadId: string, selected: boolean) => {
    setSelectedLeadIds((current) => {
      const next = new Set(current);
      if (selected) next.add(leadId);
      else next.delete(leadId);
      return next;
    });
  };

  const toggleVisibleSelection = (selected: boolean) => {
    setSelectedLeadIds((current) => {
      const next = new Set(current);
      visibleLeadIds.forEach((id) =>
        selected ? next.add(id) : next.delete(id),
      );
      return next;
    });
  };

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">My Leads</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Leads currently assigned to you, sorted by follow-up date.
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

        {selectedLeadIds.size > 0 && (
          <div className="flex flex-wrap items-center gap-3 border-b border-border bg-primary/5 px-4 py-3">
            <span className="text-sm font-medium" aria-live="polite">
              {selectedLeadIds.size} selected
            </span>

            <label className="sr-only" htmlFor="my-leads-assignee">
              Reassign selected leads to
            </label>

            <select
              id="my-leads-assignee"
              value={selectedAssigneeId}
              onChange={(event) => setSelectedAssigneeId(event.target.value)}
              disabled={assigneesQuery.isLoading || bulkAssignMut.isPending}
              className="h-9 min-w-[190px] rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">Choose team member</option>
              {(assigneesQuery.data ?? []).map((rep: SalesRep) => (
                <option key={rep.id} value={rep.id}>
                  {rep.name}
                </option>
              ))}
            </select>

            <Button
              size="sm"
              disabled={!selectedAssigneeId || bulkAssignMut.isPending}
              onClick={() =>
                bulkAssignMut.mutate({
                  leadIds: [...selectedLeadIds],
                  assigneeId: Number(selectedAssigneeId),
                })
              }
            >
              {bulkAssignMut.isPending && (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              )}
              Reassign selected
            </Button>

            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setSelectedLeadIds(new Set())}
              disabled={bulkAssignMut.isPending}
            >
              Clear
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-busy={query.isLoading}>
            <thead className="bg-muted/40 text-muted-foreground">
              <tr className="text-left">
                <th className="w-12 px-4 py-3 font-medium">
                  <input
                    type="checkbox"
                    aria-label="Select visible leads"
                    checked={allVisibleSelected}
                    onChange={(event) =>
                      toggleVisibleSelection(event.target.checked)
                    }
                    disabled={
                      visibleLeadIds.length === 0 || bulkAssignMut.isPending
                    }
                    className="h-4 w-4 accent-primary"
                  />
                </th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Area</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">AI Score</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Follow-up Date</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {query.isLoading && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                    Loading your leads…
                  </td>
                </tr>
              )}
              {query.isError && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-destructive">
                    Failed to load your leads.
                  </td>
                </tr>
              )}
              {!query.isLoading && !query.isError && filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-muted-foreground">
                    <p className="font-medium">No leads assigned to you yet.</p>
                    <p className="mt-1 text-sm">
                      Go to Apartments, Agencies or Developers<br />
                      and click <span className="font-medium">Assign to me</span> on any lead.
                    </p>
                  </td>
                </tr>
              )}
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setActiveLead(r)}
                  className="hover:bg-muted/30 cursor-pointer"
                >
                  <td
                    className="px-4 py-3"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      aria-label={`Select ${r.name}`}
                      checked={selectedLeadIds.has(r.id)}
                      onChange={(event) =>
                        toggleLeadSelection(r.id, event.target.checked)
                      }
                      disabled={bulkAssignMut.isPending}
                      className="h-4 w-4 accent-primary"
                    />
                  </td>

                  <td className="px-4 py-3 font-medium">
                    {r.name}
                    <div className="text-[11px] text-muted-foreground capitalize">{r.lead_type}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.area ?? "—"}</td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">{r.phone ?? "—"}</td>
                  <td className="px-4 py-3">
                    <AiScoreBadge label={r.ai_score_label} score={r.score ?? r.ai_score} />
                  </td>
                  <td className="px-4 py-3"><StatusBadgeApi status={r.status} /></td>
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">{fmtDate(r.follow_up_date)}</td>
                  <td className="px-4 py-3"><SourceBadge source={r.source} /></td>
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

        {/* Pagination footer */}
        {(totalPages > 1 || totalCount > 0) && (
          <div className="flex items-center justify-between p-4 border-t border-border text-sm">
            <div className="text-muted-foreground">
              {totalCount > 0
                ? `Page ${page} of ${totalPages} · ${totalCount} total`
                : "No results"}
            </div>
            {totalPages > 1 && (
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
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <LeadDetailPanel lead={activeLead} onClose={() => setActiveLead(null)} />
    </div>
  );
}
