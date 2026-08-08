import { LockKeyhole, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  CampaignDraftState,
  ResolvedRecipient,
} from "./types";
import { personalizePreview } from "./campaign-state";

export function EmailPreview({
  state,
  recipient,
}: {
  state: CampaignDraftState;
  recipient: ResolvedRecipient;
}) {
  const subject = personalizePreview(
    state.subject,
    recipient,
  );
  const body = personalizePreview(
    state.body,
    recipient,
  );

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <div className="text-xs text-muted-foreground">
            Campaign
          </div>
          <div className="font-medium">{state.name}</div>
        </div>

        <div className="border-b border-border px-5 py-4">
          <div className="text-xs text-muted-foreground">
            To
          </div>
          <div className="font-medium">
            {recipient.contact_name} &lt;{recipient.email}&gt;
          </div>
        </div>

        <div className="border-b border-border px-5 py-4">
          <div className="text-xs text-muted-foreground">
            Subject
          </div>
          <div className="mt-1 font-medium">
            {subject}
          </div>
        </div>

        <div className="whitespace-pre-wrap px-5 py-6 text-sm leading-7">
          {body}
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Personalisation preview
          </div>

          <dl className="mt-4 space-y-3 text-sm">
            <Row
              label="Contact"
              value={recipient.contact_name}
            />
            <Row
              label="Company"
              value={recipient.company_name}
            />
            <Row
              label="Area"
              value={recipient.area}
            />
          </dl>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="flex gap-2">
            <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />

            <div>
              <div className="font-semibold">
                Sending intentionally locked
              </div>
              <p className="mt-1 text-xs leading-5">
                We still need the backend campaign type and
                pre-send suppression/review endpoint before
                this can safely send.
              </p>
            </div>
          </div>
        </div>

        <Button disabled className="w-full">
          <Send className="h-4 w-4" />
          Create & send — backend gate
        </Button>

        <Button
          disabled
          variant="outline"
          className="w-full"
        >
          Save server draft — backend gate
        </Button>
      </aside>
    </section>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
