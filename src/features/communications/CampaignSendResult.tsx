import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Mail,
  RefreshCw,
  Send,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type CampaignSendResultProps = {
  status:
    | "sending"
    | "sent"
    | "sent_with_issues"
    | "failed";
  campaignName: string;
  senderEmail: string;
  subject: string;
  recipients: number;
  sent?: number;
  failed?: number;
  errorMessage?: string | null;
  onRetry?: () => void;
  onViewCampaign?: () => void;
};

export function CampaignSendResult({
  status,
  campaignName,
  senderEmail,
  subject,
  recipients,
  sent = 0,
  failed = 0,
  errorMessage,
  onRetry,
  onViewCampaign,
}: CampaignSendResultProps) {
  const isFailed = status === "failed";
  const hasIssues = status === "sent_with_issues";

  const success =
    status === "sending" ||
    status === "sent";

  const heading =
    status === "sending"
      ? "Campaign is on its way"
      : status === "sent"
        ? "Campaign sent"
        : status === "sent_with_issues"
          ? "Sent with issues"
          : "We couldn’t send your campaign";

  const eyebrow =
    status === "sending"
      ? "Delivery started"
      : status === "sent"
        ? "Delivery complete"
        : status === "sent_with_issues"
          ? "Partial delivery"
          : "Delivery failed";

  return (
    <section className="mx-auto w-full max-w-4xl space-y-6">
      <div
        className={[
          "overflow-hidden rounded-2xl border shadow-sm",
          success
            ? "border-emerald-200 bg-emerald-50/60"
            : hasIssues
              ? "border-amber-200 bg-amber-50/60"
              : "border-red-200 bg-red-50/60",
        ].join(" ")}
      >
        <div className="px-6 py-8 sm:px-8">
          <div
            className={[
              "mb-5 flex h-12 w-12 items-center justify-center rounded-full",
              success
                ? "bg-emerald-100 text-emerald-700"
                : hasIssues
                  ? "bg-amber-100 text-amber-700"
                  : "bg-red-100 text-red-700",
            ].join(" ")}
          >
            {success ? (
              <CheckCircle2 className="h-6 w-6" />
            ) : (
              <AlertTriangle className="h-6 w-6" />
            )}
          </div>

          <div className="max-w-2xl">
            <p
              className={[
                "text-sm font-semibold",
                success
                  ? "text-emerald-700"
                  : hasIssues
                    ? "text-amber-700"
                    : "text-red-700",
              ].join(" ")}
            >
              {eyebrow}
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {heading}
            </h2>

            {status === "sending" && (
              <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                Nyumba Zetu has started sending this campaign to{" "}
                {recipients} recipient
                {recipients === 1 ? "" : "s"}.
              </p>
            )}

            {status === "sent" && (
              <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                The campaign was sent successfully to {sent || recipients}{" "}
                recipient
                {(sent || recipients) === 1 ? "" : "s"}.
              </p>
            )}

            {hasIssues && (
              <div className="mt-3 space-y-2">
                <p className="text-sm leading-6 text-muted-foreground sm:text-base">
                  The campaign completed, but some recipients could not
                  be sent successfully.
                </p>

                <p className="text-sm font-semibold text-foreground">
                  {sent} sent · {failed} failed
                </p>
              </div>
            )}

            {isFailed && (
              <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                {failureGuidance(errorMessage)}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          icon={Send}
          label="Campaign"
          value={campaignName}
        />

        <SummaryCard
          icon={Users}
          label="Recipients"
          value={`${recipients} recipient${
            recipients === 1 ? "" : "s"
          }`}
        />

        <SummaryCard
          icon={Mail}
          label="Sender"
          value={senderEmail}
        />
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Subject
        </div>

        <div className="mt-2 font-medium text-foreground">
          {subject}
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50/40 p-6 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-red-700">
            Technical details
          </div>

          <div className="mt-3 break-words rounded-lg bg-background px-4 py-3 font-mono text-xs leading-6 text-foreground">
            {errorMessage}
          </div>
        </div>
      )}

      {success && (
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-semibold text-foreground">
              What happens next?
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Delivery and engagement results will appear in
              campaign performance as events arrive.
            </p>
          </div>

          {onViewCampaign && (
            <Button
              type="button"
              onClick={onViewCampaign}
            >
              View campaign
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {(isFailed || hasIssues) && (
        <div
          className={[
            "rounded-2xl border bg-card p-6 shadow-sm",
            isFailed
              ? "border-red-200"
              : "border-amber-200",
          ].join(" ")}
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-semibold text-foreground">
                {isFailed
                  ? "Your campaign is still available"
                  : "Review the failed recipients"}
              </div>

              <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
                {isFailed
                  ? "Fix the issue above, then try again. We won’t silently retry or send duplicates."
                  : "Open campaign performance to see which recipients failed and their provider errors."}
              </p>
            </div>

            {isFailed && onRetry && (
              <Button
                type="button"
                onClick={onRetry}
              >
                <RefreshCw className="h-4 w-4" />
                Try sending again
              </Button>
            )}

            {hasIssues && onViewCampaign && (
              <Button
                type="button"
                onClick={onViewCampaign}
              >
                View failures
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>

          {isFailed && !onRetry && (
            <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-red-700">
              <RefreshCw className="h-4 w-4" />
              Try sending again
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function failureGuidance(
  errorMessage?: string | null,
) {
  if (!errorMessage) {
    return "Something went wrong while trying to start delivery. Review the campaign details and try again.";
  }

  const error = errorMessage.toLowerCase();

  if (
    error.includes("403") ||
    error.includes("sender") ||
    error.includes("domain")
  ) {
    return "The email provider rejected the sender address. For Resend testing, use onboarding@resend.dev, or use an address from a verified sending domain.";
  }

  if (
    error.includes("401") ||
    error.includes("api key") ||
    error.includes("unauthorized")
  ) {
    return "The email provider could not authenticate the request. Check the configured Resend API key.";
  }

  if (
    error.includes("429") ||
    error.includes("rate limit")
  ) {
    return "The email provider is temporarily limiting requests. Wait a moment and try again.";
  }

  return "The email provider rejected or could not process the campaign. See the technical details below for the exact reason.";
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Send;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />

        <span className="text-xs font-semibold uppercase tracking-wider">
          {label}
        </span>
      </div>

      <div className="mt-3 truncate font-semibold text-foreground">
        {value}
      </div>
    </div>
  );
}
