import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCurrentUser,
  leadsApi,
  STATUS_LABEL,
  STATUS_OPTIONS,
  type Lead,
  type LeadStatusApi,
} from "@/lib/api";
import { ScorePill } from "@/components/StatusBadge";

export const Route = createFileRoute("/_app/leads")({
  head: () => ({ meta: [{ title: "My Leads — Nyumba Zetu" }] }),
  component: MyLeads,
});

const colStyle: Record<LeadStatusApi, string> = {
  new: "border-t-info",
  called: "border-t-warning",
  demo_booked: "border-t-primary",
  won: "border-t-success",
  lost: "border-t-destructive",
};

const sourceColor: Record<string, string> = {
  apartment: "bg-chart-1/15 text-chart-1",
  agency: "bg-chart-2/15 text-chart-2",
  landlord: "bg-chart-3/15 text-chart-3",
};

function MyLeads() {
  const qc = useQueryClient();
  const me = getCurrentUser();
  const [dragId, setDragId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["leads", "mine", me?.id],
    queryFn: () => leadsApi.list({ assigned_to: me?.id, limit: 200 }),
    enabled: !!me?.id,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatusApi }) =>
      leadsApi.updateStatus(id, status),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ["leads", "mine", me?.id] });
      const prev = qc.getQueryData<{ data: Lead[] }>(["leads", "mine", me?.id]);
      if (prev) {
        qc.setQueryData(["leads", "mine", me?.id], {
          ...prev,
          data: prev.data.map((l) => (l.id === id ? { ...l, status } : l)),
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["leads", "mine", me?.id], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const cards = query.data?.data ?? [];

  const byCol = useMemo(() => {
    const m: Record<LeadStatusApi, Lead[]> = {
      new: [], called: [], demo_booked: [], won: [], lost: [],
    };
    cards.forEach((c) => m[c.status]?.push(c));
    return m;
  }, [cards]);

  const drop = (status: LeadStatusApi) => {
    if (!dragId) return;
    const card = cards.find((c) => c.id === dragId);
    setDragId(null);
    if (!card || card.status === status) return;
    updateStatus.mutate({ id: card.id, status });
  };

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">My Leads</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Drag cards between columns to move leads through the pipeline.
        </p>
      </div>

      {query.isLoading && (
        <div className="text-sm text-muted-foreground">Loading your leads…</div>
      )}
      {!me?.id && (
        <div className="text-sm text-muted-foreground">Sign in to see your leads.</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {STATUS_OPTIONS.map((col) => (
          <div
            key={col}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => drop(col)}
            className={`rounded-xl border border-border border-t-4 ${colStyle[col]} bg-card p-3 min-h-[400px]`}
          >
            <div className="flex items-center justify-between px-1 mb-3">
              <div className="text-sm font-semibold">{STATUS_LABEL[col]}</div>
              <div className="text-xs rounded-full bg-muted px-2 py-0.5 tabular-nums">
                {byCol[col].length}
              </div>
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
                    <ScorePill score={c.score ?? 0} />
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${sourceColor[c.lead_type] ?? "bg-muted"}`}>
                      {c.lead_type}
                    </span>
                    {c.area && <span className="text-[11px] text-muted-foreground">· {c.area}</span>}
                  </div>
                  {c.phone && (
                    <div className="mt-2 text-[11px] text-muted-foreground tabular-nums">{c.phone}</div>
                  )}
                  {c.last_contacted && (
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      Last: {new Date(c.last_contacted).toLocaleDateString()}
                    </div>
                  )}
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
