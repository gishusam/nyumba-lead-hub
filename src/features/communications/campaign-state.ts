import type { AudienceFilter, CampaignDraftState } from "./types";
import { renderNewsletter, validateNewsletter } from "./newsletter/render-newsletter";

export function createCampaignDraft(): CampaignDraftState {
  return {
    name: "",
    campaignType: null,
    audienceSource: "leads",
    filters: {},
    review: null,
    senderName: "Nyumba Zetu",
    senderEmail: "",
    subject: "",
    body: "",
    newsletter: null,
  };
}

export function setAudienceFilter(
  state: CampaignDraftState,
  key: keyof AudienceFilter,
  value: string,
): CampaignDraftState {
  const next = value.trim();
  const filters = { ...state.filters };

  if (next) filters[key] = next;
  else delete filters[key];

  return { ...state, filters, review: null };
}

export function buildRecipientFilter(
  state: CampaignDraftState,
): AudienceFilter {
  const { area, lead_type, status, ai_score } = state.filters;

  return Object.fromEntries(
    Object.entries({ area, lead_type, status, ai_score }).filter(
      ([, value]) => Boolean(value),
    ),
  ) as AudienceFilter;
}

export function canContinueFromBasics(state: CampaignDraftState): boolean {
  return Boolean(state.name.trim() && state.campaignType);
}

export function canContinueFromAudience(state: CampaignDraftState): boolean {
  if (state.audienceSource !== "leads") return false;
  return Object.keys(buildRecipientFilter(state)).length > 0;
}

export function canContinueFromReview(state: CampaignDraftState): boolean {
  return Boolean(state.review?.accepted && state.review.ready > 0);
}

export function canContinueFromCompose(state: CampaignDraftState): boolean {
  if (!state.senderEmail.trim() || !state.subject.trim()) return false;

  if (state.campaignType !== "newsletter") {
    return Boolean(state.body.trim());
  }

  if (!state.newsletter || validateNewsletter(state.newsletter).length > 0) {
    return false;
  }

  const rendered = renderNewsletter(state.newsletter, {
    contact_name: "Preview contact",
    company_name: "Preview company",
    area: "Preview area",
    unsubscribe_url: "https://nyumbazetu.com/unsubscribe-preview",
  });

  return Boolean(rendered.text.trim());
}

export function personalizePreview(
  template: string,
  recipient: {
    contact_name: string;
    company_name: string;
    area: string;
  },
): string {
  return template
    .replaceAll("{contact_name}", recipient.contact_name)
    .replaceAll("{company_name}", recipient.company_name)
    .replaceAll("{area}", recipient.area);
}
