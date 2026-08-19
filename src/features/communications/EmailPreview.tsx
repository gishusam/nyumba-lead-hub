import { useState } from "react";
import {
  Loader2,
  LockKeyhole,
  Mail,
  Send,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import type {
  CampaignDraftState,
  ResolvedRecipient,
} from "./types";

import { personalizePreview } from "./campaign-state";

import {
  prepareCampaign,
  sendPreparedCampaign,
  waitForCampaignOutcome,
} from "./campaign-send";

import type {
  CampaignSendOutcome,
} from "./campaign-send";

import { CampaignSendResult } from "./CampaignSendResult";
import { EmailMessagePreview } from "./EmailMessagePreview";
import { NewsletterPreview } from "./newsletter/NewsletterPreview";

export function EmailPreview({
  state,
  recipient,
  recipients,
}: {
  state: CampaignDraftState;
  recipient: ResolvedRecipient;
  recipients: ResolvedRecipient[];
}) {
  const [sending, setSending] = useState(false);

  const [outcome, setOutcome] =
    useState<CampaignSendOutcome | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [finalRecipientCount, setFinalRecipientCount] =
    useState(recipients.length);

  const [preparedCampaignId, setPreparedCampaignId] =
    useState<number | null>(null);

  const [confirmOpen, setConfirmOpen] =
    useState(false);

  if (
    state.campaignType === "newsletter" &&
    state.newsletter
  ) {
    return (
      <NewsletterPreview
        state={state}
        recipient={recipient}
      />
    );
  }

  const subject = personalizePreview(
    state.subject,
    recipient,
  );

  const body = personalizePreview(
    state.body,
    recipient,
  );

  const senderDomain =
    state.senderEmail
      .split("@")[1]
      ?.trim()
      .toLowerCase() ?? "";

  const personalSenderDomains = new Set([
    "gmail.com",
    "yahoo.com",
    "outlook.com",
    "hotmail.com",
    "icloud.com",
  ]);

  const senderMayBeRejected =
    personalSenderDomains.has(senderDomain);

  const sendReviewedCampaign = async (
    campaignId: number,
  ) => {
    await sendPreparedCampaign(campaignId);

    const finalOutcome =
      await waitForCampaignOutcome(campaignId);

    setOutcome(finalOutcome);
    setError(null);
  };

  const handleSend = async () => {
    setError(null);
    setOutcome(null);

    if (preparedCampaignId !== null) {
      setConfirmOpen(true);
      return;
    }

    setSending(true);

    try {
      const reviewed = await prepareCampaign(
        state,
        recipients,
      );

      setPreparedCampaignId(
        reviewed.campaign_id,
      );

      setFinalRecipientCount(
        reviewed.recipients.length,
      );

      setConfirmOpen(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while preparing the campaign.",
      );
    } finally {
      setSending(false);
    }
  };

  const confirmSend = async () => {
    if (preparedCampaignId === null) {
      return;
    }

    setConfirmOpen(false);
    setSending(true);
    setError(null);

    try {
      await sendReviewedCampaign(
        preparedCampaignId,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while trying to send the campaign.",
      );
    } finally {
      setSending(false);
    }
  };

  const retrySend = async () => {
    setOutcome(null);
    setError(null);
    setPreparedCampaignId(null);

    await handleSend();
  };

  if (outcome?.status === "sent") {
    return (
      <CampaignSendResult
        status="sent"
        campaignName={state.name}
        senderEmail={state.senderEmail}
        subject={state.subject}
        recipients={finalRecipientCount}
        sent={outcome.sent}
        failed={outcome.failed}
      />
    );
  }

  if (outcome?.status === "sent_with_issues") {
    return (
      <CampaignSendResult
        status="sent_with_issues"
        campaignName={state.name}
        senderEmail={state.senderEmail}
        subject={state.subject}
        recipients={finalRecipientCount}
        sent={outcome.sent}
        failed={outcome.failed}
        errorMessage={outcome.error}
      />
    );
  }

  if (outcome?.status === "failed") {
    return (
      <CampaignSendResult
        status="failed"
        campaignName={state.name}
        senderEmail={state.senderEmail}
        subject={state.subject}
        recipients={finalRecipientCount}
        sent={outcome.sent}
        failed={outcome.failed}
        errorMessage={outcome.error}
        onRetry={() => void retrySend()}
      />
    );
  }

  if (error) {
    return (
      <CampaignSendResult
        status="failed"
        campaignName={state.name}
        senderEmail={state.senderEmail}
        subject={state.subject}
        recipients={finalRecipientCount}
        failed={finalRecipientCount}
        errorMessage={error}
        onRetry={() => void retrySend()}
      />
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-sm font-medium text-emerald-700">
            Final review
          </div>

          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            Preview & send
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Check the sender, recipient and personalised message
            before starting delivery.
          </p>
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800">
          <Mail className="h-3.5 w-3.5" />
          Cold outreach
        </div>
      </header>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <EmailMessagePreview
          campaignName={state.name}
          senderName={state.senderName}
          senderEmail={state.senderEmail}
          recipientName={recipient.contact_name}
          recipientEmail={recipient.email}
          subject={subject}
          body={body}
          attachment={
            state.attachment
              ? {
                  name: state.attachment.name,
                  size: state.attachment.size,
                }
              : null
          }
        />

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <Users className="h-4 w-4" />
              </div>

              <div>
                <div className="font-semibold">
                  Campaign summary
                </div>

                <div className="text-xs text-muted-foreground">
                  Final sending details
                </div>
              </div>
            </div>

            <dl className="mt-5 space-y-4 text-sm">
              <SummaryRow
                label="Campaign"
                value={state.name}
              />

              <SummaryRow
                label="Audience size"
                value={`${recipients.length} recipient${
                  recipients.length === 1 ? "" : "s"
                }`}
              />

              <SummaryRow
                label="Sender"
                value={state.senderEmail}
              />

              {state.attachment && (
                <SummaryRow
                  label="Attachment"
                  value={state.attachment.name}
                />
              )}

              <SummaryRow
                label="Contact"
                value={recipient.contact_name}
              />

              {recipient.company_name && (
                <SummaryRow
                  label="Company"
                  value={recipient.company_name}
                />
              )}

              {recipient.area && (
                <SummaryRow
                  label="Area"
                  value={recipient.area}
                />
              )}
            </dl>
          </div>

          {senderMayBeRejected && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                  <Mail className="h-4 w-4" />
                </div>

                <div>
                  <div className="text-sm font-semibold text-amber-950">
                    Sender may be rejected
                  </div>

                  <p className="mt-1 text-xs leading-5 text-amber-900">
                    Personal email addresses may not be accepted
                    by Resend. For testing, use
                    {" "}
                    <span className="font-semibold">
                      onboarding@resend.dev
                    </span>
                    {" "}
                    or use an address from a verified sending
                    domain.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <LockKeyhole className="h-4 w-4" />
              </div>

              <div>
                <div className="text-sm font-semibold text-emerald-950">
                  Recipients locked
                </div>

                <p className="mt-1 text-xs leading-5 text-emerald-800">
                  The backend will validate and freeze this audience
                  before final confirmation.
                </p>
              </div>
            </div>
          </div>

          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={sending}
            onClick={() => void handleSend()}
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending campaign…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send campaign
              </>
            )}
          </Button>

          {sending && (
            <p className="text-center text-xs leading-5 text-muted-foreground">
              Waiting for the email provider to confirm the
              delivery result…
            </p>
          )}
        </aside>

        <AlertDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
        >
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>
                Ready to send?
              </AlertDialogTitle>

              <AlertDialogDescription>
                Review the final campaign details before
                starting delivery.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4 text-sm">
              <ConfirmRow
                label="Campaign"
                value={state.name}
              />

              <ConfirmRow
                label="Sender"
                value={state.senderEmail}
              />

              <ConfirmRow
                label="Recipients"
                value={`${finalRecipientCount}`}
              />

              <ConfirmRow
                label="Subject"
                value={state.subject}
              />

              {state.attachment && (
                <ConfirmRow
                  label="Attachment"
                  value={state.attachment.name}
                />
              )}
            </div>

            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-900">
              Recipients are locked and will not change after
              confirmation.
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={sending}>
                Cancel
              </AlertDialogCancel>

              <AlertDialogAction
                disabled={sending}
                onClick={(event) => {
                  event.preventDefault();
                  void confirmSend();
                }}
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send campaign
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted-foreground">
        {label}
      </dt>

      <dd className="max-w-[12rem] break-words text-right font-medium">
        {value}
      </dd>
    </div>
  );
}

function ConfirmRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[6rem_1fr] gap-3">
      <div className="text-muted-foreground">
        {label}
      </div>

      <div className="break-words font-medium text-foreground">
        {value}
      </div>
    </div>
  );
}
