import { describe, expect, it } from "vitest";

import { communicationsNavigation } from "./communications-navigation";
import {
  ATTACHMENT_LIMIT_BYTES,
  DEFAULT_RECIPIENT_LIMIT,
  personalizePreview,
  previewRecipientCount,
  validateCommunicationDraft,
  type CommunicationDraft,
} from "./communications-product";

const validDraft: CommunicationDraft = {
  recipientSource: "leads",
  recipientCount: 320,
  senderId: "sales",
  subject: "New property opportunities",
  body: "Hi {contact_name}, here is an update from {company_name}.",
  sendMode: "now",
  scheduledAt: "",
  attachmentBytes: 0,
};

describe("simplified Communications product", () => {
  it("uses exactly Overview, Bulk Mail, and Newsletter", () => {
    expect(communicationsNavigation.map((item) => item.label)).toEqual([
      "Overview",
      "Bulk Mail",
      "Newsletter",
    ]);
  });

  it("accepts a complete immediate-send draft", () => {
    expect(validateCommunicationDraft(validDraft)).toEqual([]);
  });

  it("enforces schedule, recipient, and attachment limits", () => {
    expect(
      validateCommunicationDraft({
        ...validDraft,
        recipientCount: DEFAULT_RECIPIENT_LIMIT + 1,
        sendMode: "schedule",
        scheduledAt: "",
        attachmentBytes: ATTACHMENT_LIMIT_BYTES + 1,
      }),
    ).toEqual([
      "Choose when this email should be sent.",
      `This send exceeds the ${DEFAULT_RECIPIENT_LIMIT.toLocaleString()} recipient limit.`,
      "Attachments exceed the 10 MB total limit.",
    ]);
  });

  it("uses preview counts only in development mode", () => {
    expect(previewRecipientCount("leads", true)).toBe(1248);
    expect(previewRecipientCount("leads", false)).toBe(0);
  });

  it("renders safe sample personalisation", () => {
    expect(personalizePreview("Hi {contact_name} from {company_name} in {area}.")).toBe(
      "Hi Amina from Greenview Properties in Westlands.",
    );
  });
});
