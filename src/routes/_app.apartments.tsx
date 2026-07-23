import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ExternalLink, Loader2, Mail, Phone, Search, Send, Upload, UserPlus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  leadsApi,
  dashboardApi,
  outreachApi,
  getCurrentUser,
  STATUS_LABEL,
  STATUS_OPTIONS,
  type Lead,
  type LeadStatusApi,
  type LeadType,
  type AiScoreLabel,
  type OutreachFilter,
  type OutreachLead,
} from "@/lib/api";
import { StatusBadgeApi } from "@/components/StatusBadge";
import { AiScoreBadge, AI_SCORE_OPTIONS } from "@/components/AiScoreBadge";
import { SourceBadge, SOURCE_LABELS } from "@/components/SourceBadge";
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

/* ── helpers ── */

function relTime(iso?: string | null) {
  if (!iso) return null;
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.round(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

/* ── outreach sub-components ── */

function EmailStatusBadge({ status }: { status: "emailed" | "not_emailed" }) {
  if (status === "emailed")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-0.5 text-[11px] font-semibold">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Emailed
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted text-muted-foreground px-2.5 py-0.5 text-[11px] font-semibold">
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
      Not contacted
    </span>
  );
}

function LastEmailCell({ lead }: { lead: OutreachLead }) {
  if (lead.email_status !== "emailed" || !lead.last_email_at) return <span className="text-muted-foreground">—</span>;
  const parts: string[] = [];
  if (lead.last_email_type) parts.push(lead.last_email_type === "cold" ? "Cold email" : "Follow-up");
  const rt = relTime(lead.last_email_at);
  if (rt) parts.push(rt);
  if (lead.last_email_sent_by) parts.push(`by ${lead.last_email_sent_by}`);
  return (
    <span className="text-sm text-muted-foreground">
      {parts.join(" · ") || "—"}
    </span>
  );
}

/* ── panel config type ── */
type PanelConfig = {
  lead: Lead;
  defaultTab?: "overview" | "activity" | "email";
  defaultEmailFlow?: "cold" | "followup";
};

/* ── tab definitions ── */
const OUTREACH_TABS: { key: OutreachFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "emailed", label: "Emailed" },
  { key: "not_emailed", label: "Not Emailed" },
];

export function LeadsTable({
  leadType,
  title,
  description,
  showTier,
}: {
  leadType: LeadType;
  title: string;
  description: string;
  showTier?: boolean;
}) {
  const qc = useQueryClient();

  // Existing table state
  const [q, setQ] = useState("");
  const [area, setArea] = useState("");
  const [source, setSource] = useState("");
  const [status, setStatus] = useState<"" | LeadStatusApi>("");
  const [aiScore, setAiScore] = useState<"" | AiScoreLabel>("");
  const [page, setPage] = useState(1);
  const [importOpen, setImportOpen] = useState(false);

  // Outreach state
  const [outreachTab, setOutreachTab] = useState<OutreachFilter>("all");
  const [outreachPage, setOutreachPage] = useState(1);

  // Panel config (supports defaultTab + defaultEmailFlow)
  const [panelConfig, setPanelConfig] = useState<PanelConfig | null>(null);

  const openPanel = (lead: Lead, defaultTab?: PanelConfig["defaultTab"], defaultEmailFlow?: PanelConfig["defaultEmailFlow"]) => {
    setPanelConfig({ lead, defaultTab, defaultEmailFlow });
  };

  const assignMut = useMutation({
    mutationFn: (id: string) => leadsApi.assign(id),
    onSuccess: () => {
      toast.success("Lead assigned to you");
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["leads", "mine"] });
      qc.invalidateQueries({ queryKey: ["outreach"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: any) => toast.error(err?.message ?? "Failed to assign lead"),
  });

  const limit = 20;

  // Areas for filter dropdown
  const areasQuery = useQuery({
    queryKey: ["areas", leadType],
    queryFn: () => dashboardApi.byArea(leadType),
    staleTime: 5 * 60 * 1000,
  });
  const allAreas = (areasQuery.data ?? []).map((r) => r.area).filter(Boolean).sort() as string[];

  // Outreach counts (always fetched for tab badges)
  const countsQ = useQuery({
    queryKey: ["outreach", "counts", leadType],
    queryFn: () => outreachApi.list(leadType, "all", 1, 1),
    staleTime: 60_000,
  });
  const counts = countsQ.data?.counts;

  // Outreach data (for all 3 tabs — drives the outreach table)
  const outreachQ = useQuery({
    queryKey: ["outreach", leadType, outreachTab, outreachPage, area],
    queryFn: () => outreachApi.list(leadType, outreachTab, outreachPage, limit),
    staleTime: 0,
    retry: 1,
  });
  const outreachData: OutreachLead[] = outreachQ.data?.data ?? [];
  const outreachTotal = outreachQ.data?.total ?? 0;
  const outreachPages = outreachQ.data?.pages ?? 1;

  // Text-filter outreach rows client-side
  const filteredOutreach = q
    ? outreachData.filter((r) => r.name.toLowerCase().includes(q.toLowerCase()) || (r.area ?? "").toLowerCase().includes(q.toLowerCase()))
    : outreachData;

  // ── Existing leads query (kept for compatibility, not used in outreach tabs) ──
  const PAGE_SIZE = 50;
  const sourceActive = source !== "";
  const leadsQ = useQuery({
    queryKey: ["leads", leadType, { area, source, status, aiScore, page: sourceActive ? "all" : page }],
    staleTime: sourceActive ? 2 * 60 * 1000 : 0,
    retry: 1,
    enabled: false, // outreach tabs drive the table now
    queryFn: async () => {
      const baseParams = { lead_type: leadType, area: area || undefined, status: status || undefined, ai_score: aiScore || undefined };
      if (!sourceActive) return leadsApi.list({ ...baseParams, page, limit });
      const first = await leadsApi.list({ ...baseParams, page: 1, limit: PAGE_SIZE });
      if (first.pages <= 1) return first;
      const pageNums = Array.from({ length: first.pages - 1 }, (_, i) => i + 2);
      const rest = await Promise.all(pageNums.map((p) => leadsApi.list({ ...baseParams, page: p, limit: PAGE_SIZE })));
      return { ...first, data: [...first.data, ...rest.flatMap((r) => r.data)], page: 1, pages: 1 };
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatusApi }) => leadsApi.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["outreach", leadType] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const isLoading = outreachQ.isLoading;
  const isError = outreachQ.isError;

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
        {/* ── Outreach filter tabs ── */}
        <div className="flex items-center border-b border-border">
          {OUTREACH_TABS.map(({ key, label }) => {
            const active = outreachTab === key;
            const count = counts?.[key];
            return (
              <button
                key={key}
                onClick={() => {
                  setOutreachTab(key);
                  setOutreachPage(1);
                  setQ("");
                }}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
                {count !== undefined && (
                  <span
                    className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                      active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Filters row ── */}
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
            onChange={(e) => { setArea(e.target.value); setOutreachPage(1); }}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="">All areas</option>
            {allAreas.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        {/* ── Outreach table ── */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Area</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-destructive">
                    Failed to load leads.
                  </td>
                </tr>
              )}
              {!isLoading && !isError && filteredOutreach.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                    No leads found.
                  </td>
                </tr>
              )}
              {filteredOutreach.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => openPanel(r)}
                  className="hover:bg-muted/30 cursor-pointer"
                >
                  <td className="px-4 py-3 font-medium">
                    {r.name}
                    {r.owner_name && (
                      <div className="text-xs text-muted-foreground">{r.owner_name}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.area ?? "—"}</td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">{r.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        className={`gap-1 text-xs ${
                          r.email_status === "emailed"
                            ? "text-violet-700 hover:text-violet-800 hover:bg-violet-50"
                            : "text-sky-700 hover:text-sky-800 hover:bg-sky-50"
                        }`}
                        onClick={() =>
                          openPanel(
                            r,
                            "email",
                            r.email_status === "emailed" ? "followup" : "cold",
                          )
                        }
                      >
                        {r.email_status === "emailed"
                          ? <><Send className="h-3.5 w-3.5" /> Follow-up</>
                          : <><Mail className="h-3.5 w-3.5" /> Send Email</>}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={assignMut.isPending && assignMut.variables === r.id}
                        onClick={() => assignMut.mutate(r.id)}
                        className="gap-1 text-xs"
                      >
                        {assignMut.isPending && assignMut.variables === r.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <UserPlus className="h-3.5 w-3.5" />}
                        Assign to me
                      </Button>
                      <select
                        value={r.status}
                        disabled={updateStatus.isPending}
                        onChange={(e) => updateStatus.mutate({ id: r.id, status: e.target.value as LeadStatusApi })}
                        className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {(outreachPages > 1 || outreachTotal > 0) && (
          <div className="flex items-center justify-between p-4 border-t border-border text-sm">
            <div className="text-muted-foreground">
              {outreachTotal > 0
                ? `Page ${outreachPage} of ${outreachPages} · ${outreachTotal} total`
                : "No results"}
            </div>
            {outreachPages > 1 && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={outreachPage <= 1} onClick={() => setOutreachPage((p) => Math.max(1, p - 1))}>
                  Prev
                </Button>
                <Button size="sm" variant="outline" disabled={outreachPage >= outreachPages} onClick={() => setOutreachPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <ImportCsvDialog open={importOpen} onClose={() => setImportOpen(false)} leadType={leadType} />
      <LeadDetailPanel
        lead={panelConfig?.lead ?? null}
        onClose={() => setPanelConfig(null)}
        defaultTab={panelConfig?.defaultTab ?? "overview"}
        defaultEmailFlow={panelConfig?.defaultEmailFlow}
      />
    </div>
  );
}

export function TierBadge({ quality }: { quality?: string | null }) {
  const isPlatinum = quality === "VERIFIED BUSINESS";
  const label = isPlatinum ? "PLATINUM" : "CORPORATE";
  const cls = isPlatinum
    ? "bg-warning/20 text-warning-foreground border-warning/50"
    : "bg-muted text-muted-foreground border-border";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide ${cls}`}>
      {label}
    </span>
  );
}
