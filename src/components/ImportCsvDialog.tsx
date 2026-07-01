import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, X, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { leadsApi, type LeadImportReport, type LeadType } from "@/lib/api";

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

  if (!open) return null;

  const reset = () => {
    setFile(null);
    setReport(null);
    setError(null);
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
        className="w-full max-w-lg rounded-xl border border-border bg-card shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h3 className="font-semibold">Import CSV</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Columns: name, phone, area, lead_type, website, email, owner_name.
              Only <span className="font-medium">name</span> is required.
              Defaults <code>lead_type</code> to <span className="font-medium">{leadType}</span>.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-md p-1.5 hover:bg-muted text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
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

              {error && (
                <div className="text-sm text-destructive">{error}</div>
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

          {report && (
            <>
              <div className="text-sm text-muted-foreground">
                Import complete.
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ReportBadge tone="success" label="Inserted" value={report.inserted} suffix="new leads added" />
                <ReportBadge tone="warning" label="Duplicates" value={report.duplicates} suffix="duplicates skipped" />
                <ReportBadge tone="destructive" label="Rejected" value={report.rejected} suffix="no contact info" />
                <ReportBadge tone="destructive" label="Errors" value={report.errors} suffix="rows had errors" />
              </div>
              {report.messages && report.messages.length > 0 && (
                <ul className="mt-2 max-h-40 overflow-auto text-xs text-muted-foreground space-y-1 border border-border rounded-md p-3 bg-muted/30">
                  {report.messages.map((m, i) => (
                    <li key={i}>• {m}</li>
                  ))}
                </ul>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={reset}>Import another</Button>
                <Button onClick={handleClose}>Done</Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ReportBadge({
  tone,
  label,
  value,
  suffix,
}: {
  tone: "success" | "warning" | "destructive";
  label: string;
  value: number;
  suffix: string;
}) {
  const cls =
    tone === "success"
      ? "bg-success/15 text-success border-success/30"
      : tone === "warning"
        ? "bg-warning/15 text-warning-foreground border-warning/30"
        : "bg-destructive/10 text-destructive border-destructive/20";
  return (
    <div className={`rounded-lg border p-3 ${cls}`}>
      <div className="text-xs font-medium">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value ?? 0}</div>
      <div className="text-[11px] opacity-80 mt-0.5">{suffix}</div>
    </div>
  );
}
