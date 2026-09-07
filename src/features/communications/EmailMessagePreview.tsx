import { Mail, Paperclip } from "lucide-react";
import { formatCampaignAttachmentSize } from "./campaign-attachments";

type EmailMessagePreviewProps = {
  campaignName: string;
  senderName: string;
  senderEmail: string;
  recipientName: string;
  recipientEmail: string;
  subject: string;
  body: string;
  attachment?: {
    name: string;
    size: number;
  } | null;
};

export function EmailMessagePreview({
  campaignName,
  senderName,
  senderEmail,
  recipientName,
  recipientEmail,
  subject,
  body,
  attachment,
}: EmailMessagePreviewProps) {
  const initials = senderName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border bg-muted/20 px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="h-4 w-4" />
          Email preview
        </div>

        <span className="text-xs font-medium text-muted-foreground">
          {campaignName}
        </span>
      </div>

      <div className="px-7 py-6">
        <h2 className="text-xl font-semibold leading-snug tracking-tight text-foreground">
          {subject}
        </h2>

        <div className="mt-6 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800">
            {initials || "NZ"}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-semibold text-foreground">
                {senderName}
              </span>

              <span className="break-all text-sm text-muted-foreground">
                &lt;{senderEmail}&gt;
              </span>
            </div>

            <div className="mt-1 text-sm text-muted-foreground">
              to{" "}
              <span className="font-medium text-foreground">
                {recipientName}
              </span>{" "}
              <span className="break-all">
                &lt;{recipientEmail}&gt;
              </span>
            </div>
          </div>
        </div>

        <div className="my-6 border-t border-border" />

        <div className="min-h-[22rem] whitespace-pre-wrap text-[15px] leading-7 text-foreground">
          {body}
        </div>

        {attachment ? (
          <div className="mt-6 border-t border-border pt-5">
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Attachment
            </div>

            <div className="flex max-w-md items-center gap-3 rounded-xl border border-border bg-muted/20 px-3.5 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground">
                <Paperclip className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-foreground">
                  {attachment.name}
                </div>

                <div className="mt-0.5 text-xs text-muted-foreground">
                  {formatCampaignAttachmentSize(
                    attachment.size,
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}
