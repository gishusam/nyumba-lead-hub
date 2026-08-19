import { describe, expect, it, vi } from "vitest";
import { communicationsApi } from "@/lib/api";
import { prepareCampaign, sendPreparedCampaign } from "./campaign-send";

vi.mock("@/lib/api", () => ({
  communicationsApi: {
    create: vi.fn(),
    uploadRecipients: vi.fn(),
    review: vi.fn(),
    confirmSend: vi.fn(),
  },
}));

describe("campaign send", () => {
  it("prepares CSV recipients before sending", async () => {
    vi.mocked(communicationsApi.create).mockResolvedValue({
      id: 12,
      name: "Test",
      status: "draft",
    });

    vi.mocked(communicationsApi.uploadRecipients).mockResolvedValue({
      uploaded: 1,
      valid: 1,
      invalid: 0,
      duplicates: 0,
    });

    vi.mocked(communicationsApi.review).mockResolvedValue({
      campaign_id: 12,
      status: "reviewed",
      recipients: [
        { name: "Samwel", email: "sam@example.com" },
      ],
    });

    const result = await prepareCampaign(
      {
        name: "Test",
        campaignType: "cold_outreach",
        audienceSource: "csv",
        filters: {},
        review: null,
        senderName: "Nyumba Zetu",
        senderEmail: "onboarding@resend.dev",
        subject: "Hello",
        body: "Hi {contact_name}",
        newsletter: null,
      } as any,
      [
        {
          id: "1",
          contact_name: "Samwel",
          company_name: "",
          email: "sam@example.com",
          area: "",
          lead_type: "",
        },
      ],
    );

    expect(result.campaign_id).toBe(12);
    expect(communicationsApi.uploadRecipients).toHaveBeenCalled();
    expect(communicationsApi.review).toHaveBeenCalledWith(12);
    expect(communicationsApi.confirmSend).not.toHaveBeenCalled();
  });

  it("sends only after confirmation", async () => {
    vi.mocked(communicationsApi.confirmSend).mockResolvedValue({
      campaign_id: 12,
      status: "sending",
      total_recipients: 1,
    });

    await sendPreparedCampaign(12);

    expect(communicationsApi.confirmSend).toHaveBeenCalledWith(12);
  });
});
