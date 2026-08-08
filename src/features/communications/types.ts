export type CampaignType = "cold_outreach" | "newsletter";
export type AudienceSource = "leads" | "mailing_list" | "csv";

export type AudienceFilter = {
  area?: string;
  lead_type?: string;
  status?: string;
  ai_score?: string;
};

export type AudienceReviewSummary = {
  matched: number;
  invalid: number;
  unsubscribed: number;
  duplicates: number;
  ready: number;
  accepted: boolean;
};

export type CampaignDraftState = {
  campaignType: CampaignType | null;
  audienceSource: AudienceSource;
  filters: AudienceFilter;
  review: AudienceReviewSummary | null;
  senderName: string;
  senderEmail: string;
  subject: string;
  body: string;
};
