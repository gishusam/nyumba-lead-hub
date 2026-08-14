import { Monitor, Smartphone } from "lucide-react";
import { useState } from "react";
import type { CampaignDraftState, ResolvedRecipient } from "../types";
import { renderNewsletter, validateNewsletter } from "./render-newsletter";

type PreviewMode = "desktop" | "mobile";

export function NewsletterPreview({
  state,
  recipient,
}: {
  state: CampaignDraftState;
  recipient: ResolvedRecipient;
}) {
  const [mode, setMode] = useState<PreviewMode>("desktop");
  if (!state.newsletter) return null;

  const rendered = renderNewsletter(state.newsletter, {
    contact_name: recipient.contact_name,
    company_name: recipient.company_name,
    area: recipient.area,
    unsubscribe_url: `https://nyumbazetu.com/unsubscribe?email=${encodeURIComponent(recipient.email)}`,
  });
  const errors = validateNewsletter(state.newsletter);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs text-muted-foreground">Personalized subject</div>
          <div className="mt-1 font-medium">{state.subject.replaceAll("{contact_name}", recipient.contact_name).replaceAll("{company_name}", recipient.company_name).replaceAll("{area}", recipient.area)}</div>
        </div>
        <div className="inline-flex rounded-lg border border-border bg-muted/30 p-1">
          <button type="button" className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium ${mode === "desktop" ? "bg-background shadow-sm" : "text-muted-foreground"}`} onClick={() => setMode("desktop")}>
            <Monitor className="h-4 w-4" /> Desktop
          </button>
          <button type="button" className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium ${mode === "mobile" ? "bg-background shadow-sm" : "text-muted-foreground"}`} onClick={() => setMode("mobile")}>
            <Smartphone className="h-4 w-4" /> Mobile
          </button>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {errors.join(" ")}
        </div>
      )}

      <div className="overflow-auto rounded-xl border border-border bg-muted/30 p-4 sm:p-8">
        <iframe
          title="Newsletter email preview"
          srcDoc={rendered.html}
          sandbox="allow-popups allow-popups-to-escape-sandbox"
          className="mx-auto h-[760px] rounded-lg border border-border bg-white shadow-sm transition-[width]"
          style={{ width: mode === "desktop" ? "min(100%, 660px)" : "360px", maxWidth: "100%" }}
        />
      </div>
    </section>
  );
}
