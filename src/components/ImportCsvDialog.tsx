import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Upload,
  X,
  Loader2,
  FileText,
  CheckCircle2,
  RefreshCw,
  Copy,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  leadsApi,
  type LeadImportReport,
  type LeadImportInsertedRecord,
  type LeadImportUpdatedRecord,
  type LeadImportIssueRecord,
  type LeadType,
} from "@/lib/api";

type TabKey = "inserted" | "updated" | "duplicates" | "rejected" | "errors";

export function ImportCsvDialog({
  open,
  onClose,
  leadType,
}: {
  open: boolean;
  onClose: () => void;
  leadType: LeadType;
}) {
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<LeadImportReport | null>(null);
  const [tab, setTab] = useState<TabKey>("inserted");

  if (!open) return null;

  const reset = () => {
    setFile(null);
    setReport(null);
    setError(null);
    setTab("inserted");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const upload = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const r = await leadsApi.import(file, leadType);
      setReport(r);
      // Jump to the first non-empty tab
      const order: TabKey[] = ["inserted", "updated", "duplicates", "rejected", "errors"];
      const first = order.find((k) => getCount(r, k) > 0) ?? "inserted";
      setTab(first);
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-xl border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h3 className="font-semibold text-base">Import CSV</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Columns: name, phone, area, lead_type, website, email, owner_name.{" "}
              Only <span className="font-medium">name</span> is required.
              Defaults <code className="text-[11px] bg-muted px-1 py-0.5 rounded">lead_type</code> to{" "}
              <span className="font-medium">{leadType}</span>.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-md p-1.5 hover:bg-muted text-muted-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-auto flex-1">
          {!report && (
            <>
              <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 p-10 cursor-pointer hover:bg-muted/50 transition-colors">
                <Upload className="h-7 w-7 text-muted-foreground" />
                <div className="text-sm text-center">
                  {file ? (
                    <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                      <FileText className="h-4 w-4" /> {file.name}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Click to select a CSV file
                    </span>
                  )}
                </div>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleClose} disabled={busy}>
                  Cancel
                </Button>
                <Button onClick={upload} disabled={!file || busy}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                  Upload
                </Button>
              </div>
            </>
          )}

          {report && <ResultsPanel report={report} tab={tab} setTab={setTab} />}
        </div>

        {report && (
          <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
            <Button variant="outline" onClick={reset}>
              Import another
            </Button>
            <Button onClick={handleClose}>Done</Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── helpers ────────────────────────────────────────────────────────────────

function getCount(report: LeadImportReport, key: TabKey): number {
  // The count fields on the report root are the source of truth for counts
  const map: Record<TabKey, number> = {
    inserted: report.inserted ?? 0,
    updated: report.updated ?? 0,
    duplicates: report.duplicates ?? 0,
    rejected: report.rejected ?? 0,
    errors: report.errors ?? 0,
  };
  return map[key];
}

function getRows(report: LeadImportReport, key: TabKey): unknown[] {
  // Prefer audit.* (canonical), fall back to records.* (legacy)
  const src = report.audit ?? (report as any).records ?? {};
  return Array.isArray(src[key]) ? (src[key] as unknown[]) : [];
}

// ─── ResultsPanel ────────────────────────────────────────────────────────────

const TAB_META: Array<{
  key: TabKey;
  label: string;
  tone: "success" | "info" | "warning" | "destructive" | "muted";
  Icon: React.ElementType;
  description: string;
}> = [
  {
    key: "inserted",
    label: "Imported",
    tone: "success",
    Icon: CheckCircle2,
    description: "New records added",
  },
  {
    key: "updated",
    label: "Updated",
    tone: "info",
    Icon: RefreshCw,
    description: "Existing records improved",
  },
  {
    key: "duplicates",
    label: "Duplicates",
    tone: "warning",
    Icon: Copy,
    description: "Already in the system",
  },
  {
    key: "rejected",
    label: "Rejected",
    tone: "destructive",
    Icon: XCircle,
    description: "Missing required contact info",
  },
  {
    key: "errors",
    label: "Errors",
    tone: "muted",
    Icon: AlertTriangle,
    description: "Could not be processed",
  },
];

const TONE_STAT: Record<string, string> = {
  success: "bg-emerald-50 border-emerald-200 text-emerald-700",
  info: "bg-blue-50 border-blue-200 text-blue-700",
  warning: "bg-amber-50 border-amber-200 text-amber-700",
  destructive: "bg-red-50 border-red-200 text-red-700",
  muted: "bg-muted border-border text-muted-foreground",
};
const TONE_ICON: Record<string, string> = {
  success: "text-emerald-500",
  info: "text-blue-500",
  warning: "text-amber-500",
  destructive: "text-red-500",
  muted: "text-muted-foreground",
};
const TONE_TAB_ACTIVE: Record<string, string> = {
  success: "text-emerald-700 border-emerald-600",
  info: "text-blue-700 border-blue-600",
  warning: "text-amber-700 border-amber-600",
  destructive: "text-red-700 border-red-600",
  muted: "text-foreground border-foreground",
};

function ResultsPanel({
  report,
  tab,
  setTab,
}: {
  report: LeadImportReport;
  tab: TabKey;
  setTab: (t: TabKey) => void;
}) {
  const visibleTabs = TAB_META.filter((m) => getCount(report, m.key) > 0);
  const activeTab = visibleTabs.find((t) => t.key === tab) ? tab : visibleTabs[0]?.key ?? "inserted";
  const activeMeta = TAB_META.find((m) => m.key === activeTab)!;

  return (
    <div className="space-y-5">
      {/* ── top summary line ── */}
      <div>
        <p className="text-sm text-muted-foreground">
          Processed{" "}
          <span className="font-semibold text-foreground">{report.total_rows ?? 0}</span>{" "}
          rows from your file
        </p>
        {report.summary && (
          <p className="mt-0.5 text-xs text-muted-foreground">{report.summary}</p>
        )}
      </div>

      {/* ── stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {TAB_META.map(({ key, label, tone, Icon, description }) => {
          const count = getCount(report, key);
          const active = key === activeTab;
          return (
            <button
              key={key}
              onClick={() => count > 0 && setTab(key)}
              disabled={count === 0}
              className={`flex flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left transition-all
                ${count > 0 ? "cursor-pointer hover:opacity-90" : "opacity-40 cursor-default"}
                ${active && count > 0 ? `${TONE_STAT[tone]} ring-2 ring-offset-1 ring-current` : `${TONE_STAT[tone]}`}
              `}
            >
              <div className={`flex items-center gap-1.5 ${TONE_ICON[tone]}`}>
                <Icon className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">{label}</span>
              </div>
              <span className="text-2xl font-bold leading-none">{count}</span>
              <span className="text-[10px] leading-tight opacity-75">{description}</span>
            </button>
          );
        })}
      </div>

      {/* ── tabs + table ── */}
      {visibleTabs.length === 0 ? (
        <div className="rounded-lg border border-border bg-muted/30 p-8 text-sm text-muted-foreground text-center">
          No records processed.
        </div>
      ) : (
        <div className="space-y-0 rounded-lg border border-border overflow-hidden">
          {/* tab bar */}
          <div className="flex flex-wrap border-b border-border bg-muted/20">
            {visibleTabs.map((m) => {
              const active = m.key === activeTab;
              return (
                <button
                  key={m.key}
                  onClick={() => setTab(m.key)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors
                    ${active ? TONE_TAB_ACTIVE[m.tone] : "border-transparent text-muted-foreground hover:text-foreground"}
                  `}
                >
                  {m.label}{" "}
                  <span className="ml-1 text-xs opacity-75">
                    ({getCount(report, m.key)})
                  </span>
                </button>
              );
            })}
          </div>

          {/* table area */}
          <div className="max-h-[38vh] overflow-auto">
            {activeTab === "inserted" && (
              <InsertedTable rows={getRows(report, "inserted") as LeadImportInsertedRecord[]} />
            )}
            {activeTab === "updated" && (
              <UpdatedTable rows={getRows(report, "updated") as LeadImportUpdatedRecord[]} />
            )}
            {activeTab === "duplicates" && (
              <IssueTable
                rows={getRows(report, "duplicates") as LeadImportIssueRecord[]}
                reasonLabel="Reason"
                tone="warning"
              />
            )}
            {activeTab === "rejected" && (
              <IssueTable
                rows={getRows(report, "rejected") as LeadImportIssueRecord[]}
                reasonLabel="Reason"
                tone="destructive"
              />
            )}
            {activeTab === "errors" && (
              <ErrorTable rows={getRows(report, "errors") as LeadImportIssueRecord[]} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Table components ────────────────────────────────────────────────────────

function EmptyState({ label }: { label: string }) {
  return (
    <div className="p-8 text-center text-sm text-muted-foreground">
      No records in this category
      <span className="block text-xs mt-1 opacity-60">{label}</span>
    </div>
  );
}

function InsertedTable({ rows }: { rows: LeadImportInsertedRecord[] }) {
  if (rows.length === 0) return <EmptyState label="No new records were added" />;
  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 bg-muted/60 backdrop-blur-sm text-xs uppercase text-muted-foreground z-10">
        <tr>
          <Th w="w-12">Row</Th>
          <Th>Name</Th>
          <Th>Area</Th>
          <Th>Phone</Th>
          <Th>Lead Type</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-t border-border hover:bg-muted/30 transition-colors">
            <Td className="tabular-nums text-muted-foreground text-xs">{r.row}</Td>
            <Td className="font-medium">{r.name}</Td>
            <Td className="text-muted-foreground">{r.area ?? "—"}</Td>
            <Td className="tabular-nums text-muted-foreground">{r.phone ?? "—"}</Td>
            <Td>
              {r.lead_type ? (
                <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700 font-medium capitalize">
                  {r.lead_type}
                </span>
              ) : "—"}
            </Td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function UpdatedTable({ rows }: { rows: LeadImportUpdatedRecord[] }) {
  if (rows.length === 0) return <EmptyState label="No records were updated" />;
  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 bg-muted/60 backdrop-blur-sm text-xs uppercase text-muted-foreground z-10">
        <tr>
          <Th w="w-12">Row</Th>
          <Th>Name</Th>
          <Th>What Changed</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-t border-border hover:bg-muted/30 transition-colors">
            <Td className="tabular-nums text-muted-foreground text-xs">{r.row}</Td>
            <Td className="font-medium">{r.name}</Td>
            <Td>
              {r.what_changed ? (
                <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 font-medium">
                  {r.what_changed}
                </span>
              ) : "—"}
            </Td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function IssueTable({
  rows,
  reasonLabel,
  tone,
}: {
  rows: LeadImportIssueRecord[];
  reasonLabel: string;
  tone: "warning" | "destructive";
}) {
  if (rows.length === 0) return <EmptyState label={`No records in this category`} />;
  const reasonCls =
    tone === "warning"
      ? "text-amber-700 bg-amber-50"
      : "text-red-700 bg-red-50";
  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 bg-muted/60 backdrop-blur-sm text-xs uppercase text-muted-foreground z-10">
        <tr>
          <Th w="w-12">Row</Th>
          <Th>Name</Th>
          <Th>{reasonLabel}</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-t border-border hover:bg-muted/30 transition-colors">
            <Td className="tabular-nums text-muted-foreground text-xs">{r.row}</Td>
            <Td className="font-medium">{r.name || "—"}</Td>
            <Td>
              <span className={`inline-block px-2 py-0.5 rounded text-xs ${reasonCls}`}>
                {r.reason}
              </span>
            </Td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ErrorTable({ rows }: { rows: LeadImportIssueRecord[] }) {
  if (rows.length === 0) return <EmptyState label="No processing errors" />;
  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 bg-muted/60 backdrop-blur-sm text-xs uppercase text-muted-foreground z-10">
        <tr>
          <Th w="w-12">Row</Th>
          <Th w="w-40">Name</Th>
          <Th>Error</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-t border-border hover:bg-muted/30 transition-colors">
            <Td className="tabular-nums text-muted-foreground text-xs">{r.row}</Td>
            <Td className="text-muted-foreground">{r.name || "—"}</Td>
            <Td>
              <span className="inline-block px-2 py-0.5 rounded text-xs text-muted-foreground bg-muted">
                {r.reason}
              </span>
            </Td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Th({ children, w }: { children: React.ReactNode; w?: string }) {
  return (
    <th className={`px-3 py-2 text-left font-medium ${w ?? ""}`}>{children}</th>
  );
}
function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-3 py-2 ${className}`}>{children}</td>;
}
