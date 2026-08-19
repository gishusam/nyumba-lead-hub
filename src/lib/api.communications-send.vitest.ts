import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { communicationsApi } from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
});

function mockResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => body,
  } as Response;
}

describe("communications send workflow API", () => {
  it("creates a campaign", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockResponse({
        id: 12,
        name: "Test outreach",
        status: "draft",
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    await communicationsApi.create({
      name: "Test outreach",
      communication_type: "cold_outreach",
      subject: "Hello",
      body: "Hi {contact_name}",
      sender_name: "Nyumba Zetu",
      sender_email: "onboarding@resend.dev",
      recipient_type: "csv_upload",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/comms/campaigns"),
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining(
          '"recipient_type":"csv_upload"',
        ),
      }),
    );
  });

  it("uploads CSV recipients", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockResponse({
        uploaded: 1,
        valid: 1,
        invalid: 0,
        duplicates: 0,
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    await communicationsApi.uploadRecipients(12, [
      {
        name: "Samwel Ngugi",
        email: "sam@example.com",
      },
    ]);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(
        "/api/comms/campaigns/12/recipients",
      ),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          recipients: [
            {
              name: "Samwel Ngugi",
              email: "sam@example.com",
            },
          ],
        }),
      }),
    );
  });

  it("reviews the frozen recipient list", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockResponse({
        campaign_id: 12,
        status: "reviewed",
        recipients: [],
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    await communicationsApi.review(12);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(
        "/api/comms/campaigns/12/review",
      ),
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  it("confirms sending", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockResponse({
        campaign_id: 12,
        status: "sending",
        total_recipients: 1,
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    await communicationsApi.confirmSend(12);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(
        "/api/comms/campaigns/12/confirm-send",
      ),
      expect.objectContaining({
        method: "POST",
      }),
    );
  });
});
