import { afterEach, describe, expect, it, vi } from "vitest";

describe("communicationsApi", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("loads the real campaign list from the communications endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            id: 7,
            name: "Kilimani Demo",
            subject: "Nyumba Zetu Demo",
            status: "sent",
            communication_type: "cold_outreach",
            recipient_type: "leads",
            total_recipients: 10,
            sent_count: 10,
            delivered_count: 8,
            opened_count: 5,
            clicked_count: 2,
            bounced_count: 1,
            failed_count: 1,
            created_by: "Samwel",
            created_at: "2026-08-13T08:00:00+00:00",
            finished_at: "2026-08-13T08:05:00+00:00",
          },
        ]),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    vi.stubGlobal("fetch", fetchMock);

    const apiModule = (await import("./api")) as Record<string, any>;

    expect(apiModule.communicationsApi).toBeDefined();

    const campaigns = await apiModule.communicationsApi.list();

    expect(campaigns).toHaveLength(1);
    expect(campaigns[0].communication_type).toBe("cold_outreach");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/comms/campaigns"),
      expect.objectContaining({
        headers: expect.any(Object),
      }),
    );
  });

  it("loads performance for the selected campaign", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          campaign: {
            id: 7,
            name: "Kilimani Demo",
            subject: "Nyumba Zetu Demo",
            status: "sent",
            recipient_type: "leads",
            communication_type: "cold_outreach",
            created_at: "2026-08-13T08:00:00+00:00",
            finished_at: "2026-08-13T08:05:00+00:00",
          },
          summary: {
            recipients: 10,
            sent: 10,
            delivered: 8,
            opened: 5,
            clicked: 2,
            bounced: 1,
            failed: 1,
            open_events: 7,
            click_events: 3,
            delivery_rate: 80,
            open_rate: 62.5,
            click_rate: 25,
          },
          recipients: [],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    vi.stubGlobal("fetch", fetchMock);

    const apiModule = (await import("./api")) as Record<string, any>;

    expect(apiModule.communicationsApi).toBeDefined();

    const performance =
      await apiModule.communicationsApi.performance(7);

    expect(performance.summary.delivered).toBe(8);
    expect(performance.campaign.communication_type)
      .toBe("cold_outreach");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(
        "/api/comms/campaigns/7/performance",
      ),
      expect.any(Object),
    );
  });
});
