import { describe, expect, it } from "vitest";

describe("communications dashboard data", () => {
  it("maps backend campaigns into honest dashboard values", async () => {
    const module = await import("./communications-dashboard-data")
      .catch(() => ({} as any));

    expect(module.toDashboardCampaign).toBeDefined();

    const campaign = module.toDashboardCampaign({
      id: 7,
      name: "August Product Update",
      subject: "What's new at Nyumba Zetu",
      status: "sent",
      communication_type: "newsletter",
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
    });

    expect(campaign.type).toBe("Newsletter");
    expect(campaign.status).toBe("Sent");
    expect(campaign.recipients).toBe(10);
    expect(campaign.delivered).toBe(8);
    expect(campaign.owner).toBe("Samwel");
  });

  it("aggregates real delivery metrics and ignores unsent drafts", async () => {
    const module = await import("./communications-dashboard-data")
      .catch(() => ({} as any));

    expect(module.summarizeCampaigns).toBeDefined();

    const summary = module.summarizeCampaigns([
      {
        status: "sent",
        total_recipients: 10,
        delivered_count: 8,
        bounced_count: 1,
        failed_count: 1,
      },
      {
        status: "draft",
        total_recipients: 50,
        delivered_count: 0,
        bounced_count: 0,
        failed_count: 0,
      },
    ]);

    expect(summary).toEqual({
      recipients: 10,
      delivered: 8,
      bounced: 1,
      failed: 1,
    });
  });
});

describe("campaign performance derivations", () => {
  it("derives domain delivery and a real event timeline from recipients", async () => {
    const module = await import("./communications-dashboard-data");

    expect(module.buildDomainRows).toBeDefined();
    expect(module.buildDeliveryTimeline).toBeDefined();

    const recipients = [
      {
        email: "one@gmail.com",
        status: "delivered",
        resend_id: "a",
        sent_at: "2026-08-13T08:00:00+00:00",
        delivered_at: "2026-08-13T08:02:00+00:00",
        opened_at: null,
        clicked_at: null,
        bounced_at: null,
        failed_at: null,
        open_count: 0,
        click_count: 0,
        bounce_reason: null,
        error: null,
        last_event_at: "2026-08-13T08:02:00+00:00",
      },
      {
        email: "two@gmail.com",
        status: "bounced",
        resend_id: "b",
        sent_at: "2026-08-13T08:00:00+00:00",
        delivered_at: null,
        opened_at: null,
        clicked_at: null,
        bounced_at: "2026-08-13T08:03:00+00:00",
        failed_at: null,
        open_count: 0,
        click_count: 0,
        bounce_reason: "mailbox unavailable",
        error: null,
        last_event_at: "2026-08-13T08:03:00+00:00",
      },
      {
        email: "three@agency.co.ke",
        status: "delivered",
        resend_id: "c",
        sent_at: "2026-08-13T08:01:00+00:00",
        delivered_at: "2026-08-13T08:05:00+00:00",
        opened_at: null,
        clicked_at: null,
        bounced_at: null,
        failed_at: null,
        open_count: 0,
        click_count: 0,
        bounce_reason: null,
        error: null,
        last_event_at: "2026-08-13T08:05:00+00:00",
      },
    ];

    expect(module.buildDomainRows(recipients)).toEqual([
      {
        domain: "gmail.com",
        recipients: 2,
        delivered: 1,
        bounced: 1,
        failed: 0,
        deliveryRate: 50,
      },
      {
        domain: "agency.co.ke",
        recipients: 1,
        delivered: 1,
        bounced: 0,
        failed: 0,
        deliveryRate: 100,
      },
    ]);

    const timeline = module.buildDeliveryTimeline(recipients);

    expect(timeline).toHaveLength(3);

    expect(timeline[0]).toMatchObject({
      delivered: 1,
      bounced: 0,
      failed: 0,
    });

    expect(timeline[1]).toMatchObject({
      delivered: 1,
      bounced: 1,
      failed: 0,
    });

    expect(timeline[2]).toMatchObject({
      delivered: 2,
      bounced: 1,
      failed: 0,
    });
  });
});
