import { describe, expect, it, vi } from "vitest";
import { communicationsApi } from "@/lib/api";
import { waitForCampaignOutcome } from "./campaign-send";

vi.mock("@/lib/api", () => ({
  communicationsApi: {
    performance: vi.fn(),
  },
}));

describe("waitForCampaignOutcome", () => {
  it("returns the real provider error when delivery fails", async () => {
    vi.mocked(communicationsApi.performance)
      .mockResolvedValueOnce({
        campaign: {
          id: 12,
          status: "sending",
        },
        summary: {
          recipients: 1,
          sent: 0,
          failed: 0,
        },
        recipients: [],
      } as any)
      .mockResolvedValueOnce({
        campaign: {
          id: 12,
          status: "failed",
        },
        summary: {
          recipients: 1,
          sent: 0,
          failed: 1,
        },
        recipients: [
          {
            email: "sam@example.com",
            status: "failed",
            error:
              "Resend error 403: sender domain is not verified",
          },
        ],
      } as any);

    const result = await waitForCampaignOutcome(12, {
      delayMs: 0,
      maxAttempts: 3,
    });

    expect(result.status).toBe("failed");
    expect(result.failed).toBe(1);
    expect(result.error).toContain("Resend error 403");
    expect(result.error).toContain("sender domain is not verified");

    expect(
      communicationsApi.performance,
    ).toHaveBeenCalledTimes(2);
  });
});
