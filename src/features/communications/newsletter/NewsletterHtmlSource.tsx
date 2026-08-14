import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { applyHtmlSource, renderNewsletter, validateNewsletter } from "./render-newsletter";
import type { NewsletterDraft } from "./types";

export function NewsletterHtmlSource({
  draft,
  onChange,
}: {
  draft: NewsletterDraft;
  onChange: (draft: NewsletterDraft) => void;
}) {
  const generated = renderNewsletter(draft, {
    contact_name: "{contact_name}",
    company_name: "{company_name}",
    area: "{area}",
    unsubscribe_url: "{unsubscribe_url}",
  }).html;
  const value = draft.advancedHtmlMode ? draft.htmlSource : generated;
  const errors = validateNewsletter(draft);

  return (
    <div className="space-y-3">
      {draft.advancedHtmlMode && (
        <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-semibold">Advanced HTML mode</div>
            Visual blocks are preserved, but they no longer overwrite this source.
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange({ ...draft, advancedHtmlMode: false, htmlSource: "", headerLocked: true, footerLocked: true })}
          >
            <RotateCcw className="h-4 w-4" />
            Reset to visual blocks
          </Button>
        </div>
      )}

      <textarea
        className="min-h-[620px] w-full resize-y rounded-xl border border-input bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value={value}
        spellCheck={false}
        onChange={(event) => onChange(applyHtmlSource(draft, event.target.value))}
      />

      {draft.advancedHtmlMode && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm">
            <input type="checkbox" checked={!draft.headerLocked} onChange={(event) => onChange({ ...draft, headerLocked: !event.target.checked })} />
            Unlock branded header
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm">
            <input type="checkbox" checked={!draft.footerLocked} onChange={(event) => onChange({ ...draft, footerLocked: !event.target.checked })} />
            Unlock branded footer
          </label>
        </div>
      )}

      {errors.length > 0 && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
          {errors.join(" ")}
        </div>
      )}
    </div>
  );
}
