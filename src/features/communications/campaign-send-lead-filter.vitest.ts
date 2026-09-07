import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  CampaignDraftState,
  ResolvedRecipient,
} from "./types";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  review: vi.fn(),
  uploadRecipients: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  communicationsApi: {
    create: mocks.create,
    review: mocks.review,
    uploadRecipients: mocks.uploadRecipients,
  },
}));

import { prepareCampaign } from "./campaign-send";

describe("prepareCampaign lead audience", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.create.mockResolvedValue({
      id: 123,
      name: "Westlands agencies",
      status: "draft",
    });

    mocks.review.mockResolvedValue({
      campaign_id: 123,
      status: "reviewed",
      recipients: [],
    });
  });

  it("preserves lead filters when creating the backend campaign", async () => {
    const state = {
      name: "Westlands agencies",
      campaignType: "cold_outreach",
      audienceSource: "leads",

      filters: {
        area: "Westlands",
        lead_type: "Agency",
      },

      senderName: "Nyumba Zetu",
      senderEmail: "onboarding@resend.dev",
      subject: "Hello",
      body: "Hi {contact_name}",

      csvFileName: null,
      csvSummary: null,
      review: null,
      newsletter: null,
    } as CampaignDraftState;

    const recipients = [
      {
        id: "1",
        contact_name: "Blue Zone Properties",
        company_name: "Blue Zone Properties",
        email: "info@bluezone.co.ke",
        area: "Westlands",
        lead_type: "Agency",
      },
    ] as ResolvedRecipient[];

    await prepareCampaign(state, recipients);

    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient_type: "leads",
        recipient_filter: {
          area: "Westlands",
          lead_type: "Agency",
        },
      }),
    );

    expect(
      mocks.uploadRecipients,
    ).not.toHaveBeenCalled();

    expect(mocks.review).toHaveBeenCalledWith(123);
  });
});
