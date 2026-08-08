import {
  leadsApi,
  type Lead,
  type LeadStatusApi,
  type LeadType,
  type ListLeadsParams,
} from "@/lib/api";
import type {
  AudienceFilter,
  AudienceReviewSummary,
  ResolvedRecipient,
} from "./types";

const EMAIL_RE = /^[\w.\-]+@[\w.\-]+\.[a-zA-Z]{2,}$/;

export async function resolveLeadAudience(
  filters: AudienceFilter,
): Promise<{
  summary: AudienceReviewSummary;
  recipients: ResolvedRecipient[];
}> {
  const params: ListLeadsParams = {};

  if (filters.area) params.area = filters.area;
  if (filters.lead_type) params.lead_type = filters.lead_type as LeadType;
  if (filters.status) params.status = filters.status as LeadStatusApi;
  if (filters.ai_score) params.ai_score = filters.ai_score;

  const leads: Lead[] = [];
  let page = 1;
  let pages = 1;
  let total = 0;

  do {
    const response = await leadsApi.list({
      ...params,
      page,
      limit: 100,
    });

    total = response.total;
    pages = response.pages;
    leads.push(...response.data);
    page += 1;
  } while (page <= pages && page <= 50);

  let missingEmail = 0;
  let invalid = 0;
  let duplicates = 0;

  const seen = new Set<string>();
  const recipients: ResolvedRecipient[] = [];

  for (const lead of leads) {
    const rawEmail = lead.email?.trim() ?? "";

    if (!rawEmail) {
      missingEmail += 1;
      continue;
    }

    const email = rawEmail.toLowerCase();

    if (!EMAIL_RE.test(email)) {
      invalid += 1;
      continue;
    }

    if (seen.has(email)) {
      duplicates += 1;
      continue;
    }

    seen.add(email);

    recipients.push({
      id: String(lead.id),
      contact_name: lead.owner_name?.trim() || lead.name,
      company_name: lead.name,
      email,
      area: lead.area || "—",
      lead_type: lead.lead_type || "—",
    });
  }

  return {
    summary: {
      matched: total || leads.length,
      missing_email: missingEmail,
      invalid,
      duplicates,
      unsubscribed: null,
      ready: recipients.length,
      accepted: false,
    },
    recipients,
  };
}
