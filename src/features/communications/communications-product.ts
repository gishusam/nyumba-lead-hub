export const ATTACHMENT_LIMIT_BYTES = 10 * 1024 * 1024;
export const DEFAULT_RECIPIENT_LIMIT = 2_000;

export type RecipientSource = "leads" | "upload" | "saved";
export type SendMode = "now" | "schedule";

export type CommunicationDraft = {
  recipientSource: RecipientSource;
  recipientCount: number;
  senderId: string;
  subject: string;
  body: string;
  sendMode: SendMode;
  scheduledAt: string;
  attachmentBytes: number;
};

export const recipientSources = [
  {
    id: "leads",
    label: "Existing leads",
    description: "Choose contacts already in Nyumba Zetu.",
  },
  {
    id: "upload",
    label: "Upload CSV or Excel",
    description: "Import a one-time external contact list.",
  },
  {
    id: "saved",
    label: "Saved mailing list",
    description: "Reuse a previously cleaned audience.",
  },
] as const;

export const approvedSenders = [
  {
    id: "sales",
    label: "Nyumba Zetu Sales",
    email: "sales@nyumbazetu.co.ke",
  },
  {
    id: "support",
    label: "Nyumba Zetu Support",
    email: "support@nyumbazetu.co.ke",
  },
  {
    id: "newsletter",
    label: "Nyumba Zetu Newsletter",
    email: "newsletter@nyumbazetu.co.ke",
  },
] as const;

export const newsletterTemplates = [
  {
    id: "property-update",
    name: "Property update",
    eyebrow: "PROPERTY UPDATE",
    headline: "Fresh opportunities in Nairobi",
    body: "Discover new listings, market insights, and opportunities selected for your audience.",
    cta: "View properties",
  },
  {
    id: "market-brief",
    name: "Market brief",
    eyebrow: "MARKET BRIEF",
    headline: "What moved the property market this month",
    body: "A practical summary of demand, pricing, and the areas attracting the most attention.",
    cta: "Read the full brief",
  },
  {
    id: "event-invite",
    name: "Event invitation",
    eyebrow: "YOU'RE INVITED",
    headline: "Join our next property showcase",
    body: "Meet the team, explore current opportunities, and ask your questions in a focused live session.",
    cta: "Reserve a place",
  },
] as const;

export function previewRecipientCount(source: RecipientSource, previewMode: boolean): number {
  if (!previewMode) return 0;

  const counts: Record<RecipientSource, number> = {
    leads: 1_248,
    upload: 862,
    saved: 430,
  };

  return counts[source];
}

export function validateCommunicationDraft(draft: CommunicationDraft): string[] {
  const errors: string[] = [];

  if (draft.recipientCount <= 0) {
    errors.push("No valid recipients are selected.");
  }
  if (!draft.senderId) {
    errors.push("Choose an approved sender.");
  }
  if (!draft.subject.trim()) {
    errors.push("Add an email subject.");
  }
  if (!draft.body.trim()) {
    errors.push("Add the email content.");
  }
  if (draft.sendMode === "schedule" && !draft.scheduledAt.trim()) {
    errors.push("Choose when this email should be sent.");
  }
  if (draft.recipientCount > DEFAULT_RECIPIENT_LIMIT) {
    errors.push(
      `This send exceeds the ${DEFAULT_RECIPIENT_LIMIT.toLocaleString()} recipient limit.`,
    );
  }
  if (draft.attachmentBytes > ATTACHMENT_LIMIT_BYTES) {
    errors.push("Attachments exceed the 10 MB total limit.");
  }

  return errors;
}

export function personalizePreview(content: string): string {
  const replacements: Record<string, string> = {
    contact_name: "Amina",
    company_name: "Greenview Properties",
    area: "Westlands",
    rep_name: "Jane",
    rep_email: "sales@nyumbazetu.co.ke",
  };

  return content.replace(
    /\{([a-zA-Z0-9_]+)\}/g,
    (_, key: string) => replacements[key] ?? "Sample value",
  );
}

export function formatFileSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
