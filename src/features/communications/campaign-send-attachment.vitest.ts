import { beforeEach, describe, expect, it, vi } from "vitest";
import { communicationsApi } from "@/lib/api";
import { prepareCampaign } from "./campaign-send";

vi.mock("@/lib/api", () => ({
  communicationsApi: {
    create: vi.fn(),
    uploadAttachment: vi.fn(),
    uploadRecipients: vi.fn(),
    review: vi.fn(),
  },
}));

describe("campaign attachment preparation", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(communicationsApi.create).mockResolvedValue({
      id: 41,
      name: "Westlands outreach",
      status: "draft",
    });

    vi.mocked(communicationsApi.review).mockResolvedValue({
      campaign_id: 41,
      status: "reviewed",
      recipients: [],
    });
  });

  it("uploads the selected attachment to the created campaign", async () => {
    const attachment = new File(
      ["brochure"],
      "nyumba-zetu-brochure.pdf",
      { type: "application/pdf" },
    );

    await prepareCampaign(
      {
        name: "Westlands outreach",
        campaignType: "cold_outreach",
        audienceSource: "leads",
        filters: { area: "Westlands" },
        review: null,
        senderName: "Nyumba Zetu",
        senderEmail: "onboarding@resend.dev",
        subject: "Property management demo",
        body: "Hello {contact_name}",
        newsletter: null,
        attachment,
      } as any,
      [],
    );

    expect(
      communicationsApi.uploadAttachment,
    ).toHaveBeenCalledWith(41, attachment);

    expect(
      communicationsApi.review,
    ).toHaveBeenCalledWith(41);
  });

  it("does not upload when no attachment is selected", async () => {
    await prepareCampaign(
      {
        name: "Westlands outreach",
        campaignType: "cold_outreach",
        audienceSource: "leads",
        filters: { area: "Westlands" },
        review: null,
        senderName: "Nyumba Zetu",
        senderEmail: "onboarding@resend.dev",
        subject: "Property management demo",
        body: "Hello {contact_name}",
        newsletter: null,
        attachment: null,
      } as any,
      [],
    );

    expect(
      communicationsApi.uploadAttachment,
    ).not.toHaveBeenCalled();
  });
});
