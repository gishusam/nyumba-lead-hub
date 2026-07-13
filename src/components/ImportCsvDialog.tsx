import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, X, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  leadsApi,
  type LeadImportReport,
  type LeadImportInsertedRecord,
  type LeadImportIssueRecord,
  type LeadType,
} from "@/lib/api";

type TabKey = "inserted" | "duplicates" | "rejected" | "errors";

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
      const firstTab: TabKey =
        (r.inserted ?? 0) > 0
          ? "inserted"
          : (r.duplicates ?? 0) > 0
            ? "duplicates"
            : (r.rejected ?? 0) > 0
              ? "rejected"
              : "errors";
      setTab(firstTab);
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
        className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl border border-border bg-card shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h3 className="font-semibold">Import CSV</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Columns: name, phone, area, lead_type, website, email, owner_name.
              Only <span className="font-medium">name</span> is required.
              Defaults <code>lead_type</code> to{" "}
              <span className="font-medium">{leadType}</span>.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-md p-1.5 hover:bg-muted text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-auto">
          {!report && (
            <>
              <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 cursor-pointer hover:bg-muted/50 transition-colors">
                <Upload className="h-6 w-6 text-muted-foreground" />
                <div className="text-sm">
                  {file ? (
                    <span className="inline-flex items-center gap-1.5">
                      <FileText className="h-4 w-4" /> {file.name}
                    </span>
                  ) : (
                    <>Click to select a CSV file</>
                  )}
                </div>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>

              {error && <div className="text-sm text-destructive">{error}</div>}

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

function ResultsPanel({
  report,
  tab,
  setTab,
}: {
  report: LeadImportReport;
  tab: TabKey;
  setTab: (t: TabKey) => void;
}) {
  const recs = report.records ?? {};
  const tabs: Array<{
    key: TabKey;
    label: string;
    count: number;
    tone: "success" | "warning" | "destructive" | "muted";
  }> = [
    { key: "inserted", label: "Imported", count: report.inserted ?? 0, tone: "success" },
    { key: "duplicates", label: "Duplicates", count: report.duplicates ?? 0, tone: "warning" },
    { key: "rejected", label: "Rejected", count: report.rejected ?? 0, tone: "destructive" },
    { key: "errors", label: "Errors", count: report.errors ?? 0, tone: "muted" },
  ].filter((t) => t.count > 0) as Array<{
    key: TabKey;
    label: string;
    count: number;
    tone: "success" | "warning" | "destructive" | "muted";
  }>;

  const activeTab = tabs.find((t) => t.key === tab) ? tab : tabs[0]?.key ?? "inserted";

  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm text-muted-foreground">
          Processed{" "}
          <span className="font-medium text-foreground">
            {report.total_rows ?? 0}
          </span>{" "}
          rows from your file
        </div>
        {report.summary && (
          <div className="mt-1 text-xs text-muted-foreground">{report.summary}</div>
        )}
      </div>

      {tabs.length === 0 ? (
        <div className="rounded-lg border border-border bg-muted/30 p-6 text-sm text-muted-foreground text-center">
          No records processed.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-1 border-b border-border">
            {tabs.map((t) => {
              const active = t.key === activeTab;
              const toneCls =
                t.tone === "success"
                  ? "text-emerald-700 border-emerald-600"
                  : t.tone === "warning"
                    ? "text-amber-700 border-amber-600"
                    : t.tone === "destructive"
                      ? "text-red-700 border-red-600"
                      : "text-muted-foreground border-muted-foreground";
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    active
                      ? toneCls
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label} ({t.count})
                </button>
              );
            })}
          </div>

          <div className="max-h-[50vh] overflow-auto rounded-lg border border-border">
            {activeTab === "inserted" && (
              <InsertedTable rows={recs.inserted ?? []} />
            )}
            {activeTab === "duplicates" && (
              <IssueTable rows={recs.duplicates ?? []} reasonLabel="Reason" />
            )}
            {activeTab === "rejected" && (
              <IssueTable rows={recs.rejected ?? []} reasonLabel="Reason" />
            )}
            {activeTab === "errors" && (
              <IssueTable rows={recs.errors ?? []} reasonLabel="Error" />
            )}
          </div>
        </>
      )}
    </div>
  );
}

function InsertedTable({ rows }: { rows: LeadImportInsertedRecord[] }) {
  if (rows.length === 0) return <EmptyRow />;
  return (
    <table className="w-full text-sm">
      <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
        <tr>
          <Th>Row</Th>
          <Th>Name</Th>
          <Th>Area</Th>
          <Th>Phone</Th>
          <Th>Lead Type</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-t border-border">
            <Td className="tabular-nums text-muted-foreground">{r.row}</Td>
            <Td className="font-medium">{r.name}</Td>
            <Td>{r.area ?? "—"}</Td>
            <Td className="tabular-nums">{r.phone ?? "—"}</Td>
            <Td className="capitalize">{r.lead_type ?? "—"}</Td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function IssueTable({
  rows,
  reasonLabel,
}: {
  rows: LeadImportIssueRecord[];
  reasonLabel: string;
}) {
  if (rows.length === 0) return <EmptyRow />;
  return (
    <table className="w-full text-sm">
      <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
        <tr>
          <Th>Row</Th>
          <Th>Name</Th>
          <Th>{reasonLabel}</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-t border-border">
            <Td className="tabular-nums text-muted-foreground">{r.row}</Td>
            <Td className="font-medium">{r.name || "—"}</Td>
            <Td className="text-muted-foreground">{r.reason}</Td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 text-left font-medium">{children}</th>;
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
function EmptyRow() {
  return (
    <div className="p-6 text-center text-sm text-muted-foreground">
      No records to show.
    </div>
  );
}
