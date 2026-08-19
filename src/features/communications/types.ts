import type { NewsletterDraft } from "./newsletter/types";

export type CampaignType = "cold_outreach" | "newsletter";
export type AudienceSource = "leads" | "mailing_list" | "csv";

export type AudienceFilter = {
  area?: string;
  lead_type?: string;
  status?: string;
  ai_score?: string;
};

export type ResolvedRecipient = {
  id: string;
  contact_name: string;
  company_name: string;
  email: string;
  area: string;
  lead_type: string;
};

export type AudienceReviewSummary = {
  matched: number;
  missing_email: number;
  invalid: number;
  duplicates: number;
  unsubscribed: number | null;
  ready: number;
  accepted: boolean;
};

export type CampaignDraftState = {
  name: string;
  campaignType: CampaignType | null;
  audienceSource: AudienceSource;
  filters: AudienceFilter;
  csvFileName: string | null;
  csvSummary: {
    uploaded: number;
    valid: number;
    invalid: number;
    duplicates: number;
  } | null;
  review: AudienceReviewSummary | null;
  senderName: string;
  senderEmail: string;
  subject: string;
  body: string;
  attachment?: File | null;
  newsletter: NewsletterDraft | null;
};
