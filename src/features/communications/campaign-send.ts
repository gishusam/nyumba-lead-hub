import { communicationsApi } from "@/lib/api";
import type {
  CampaignDraftState,
  ResolvedRecipient,
} from "./types";

export async function prepareCampaign(
  state: CampaignDraftState,
  recipients: ResolvedRecipient[],
) {
  if (!state.campaignType) {
    throw new Error("Choose a campaign type.");
  }

  if (state.audienceSource === "mailing_list") {
    throw new Error("Mailing list sending is not available yet.");
  }

  const recipientType =
    state.audienceSource === "csv"
      ? "csv_upload"
      : "leads";

  const campaign = await communicationsApi.create({
    name: state.name,
    communication_type: state.campaignType,
    subject: state.subject,
    body: state.body,
    sender_name: state.senderName,
    sender_email: state.senderEmail,
    recipient_type: recipientType,
    ...(recipientType === "leads"
      ? { recipient_filter: state.filters }
      : {}),
  });

  if (state.attachment) {
    await communicationsApi.uploadAttachment(
      campaign.id,
      state.attachment,
    );
  }

  if (state.audienceSource === "csv") {
    await communicationsApi.uploadRecipients(
      campaign.id,
      recipients.map((recipient) => ({
        name: recipient.contact_name,
        email: recipient.email,
      })),
    );
  }

  return communicationsApi.review(campaign.id);
}

export function sendPreparedCampaign(
  campaignId: number,
) {
  return communicationsApi.confirmSend(campaignId);
}

export type CampaignSendOutcome = {
  status: "sent" | "sent_with_issues" | "failed";
  sent: number;
  failed: number;
  error: string | null;
};

export async function waitForCampaignOutcome(
  campaignId: number,
  options: {
    delayMs?: number;
    maxAttempts?: number;
  } = {},
): Promise<CampaignSendOutcome> {
  const {
    delayMs = 1000,
    maxAttempts = 20,
  } = options;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const performance =
      await communicationsApi.performance(campaignId);

    const status =
      performance.campaign.status;

    if (
      status === "sent" ||
      status === "sent_with_issues" ||
      status === "failed"
    ) {
      const failedRecipient =
        performance.recipients.find(
          (recipient) =>
            recipient.status === "failed" &&
            recipient.error,
        );

      return {
        status,
        sent: performance.summary.sent ?? 0,
        failed: performance.summary.failed ?? 0,
        error: failedRecipient?.error ?? null,
      };
    }

    if (attempt < maxAttempts - 1 && delayMs > 0) {
      await new Promise((resolve) =>
        setTimeout(resolve, delayMs),
      );
    }
  }

  throw new Error(
    "Campaign delivery is taking longer than expected. Check campaign performance for the latest status.",
  );
}

