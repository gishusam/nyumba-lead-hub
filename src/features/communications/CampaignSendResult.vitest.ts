import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CampaignSendResult } from "./CampaignSendResult";

describe("CampaignSendResult", () => {
  it("shows a clear sending-started state", () => {
    const html = renderToStaticMarkup(
      createElement(CampaignSendResult, {
        status: "sending",
        campaignName: "Westlands outreach",
        senderEmail: "onboarding@resend.dev",
        subject: "Book a Nyumba Zetu demo",
        recipients: 4,
      }),
    );

    expect(html).toContain("Campaign is on its way");
    expect(html).toContain("4 recipients");
    expect(html).toContain("Westlands outreach");
  });

  it("shows a useful fallback when sending fails", () => {
    const html = renderToStaticMarkup(
      createElement(CampaignSendResult, {
        status: "failed",
        campaignName: "Westlands outreach",
        senderEmail: "onboarding@resend.dev",
        subject: "Book a Nyumba Zetu demo",
        recipients: 4,
      }),
    );

    expect(html).toContain("We couldn’t send your campaign");
    expect(html).toContain(
      "Something went wrong while trying to start delivery.",
    );
    expect(html).toContain("Try sending again");
  });
});
