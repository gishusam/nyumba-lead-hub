import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CampaignSendResult } from "./CampaignSendResult";

describe("CampaignSendResult delivery outcomes", () => {
  it("shows partial delivery clearly", () => {
    const html = renderToStaticMarkup(
      createElement(CampaignSendResult, {
        status: "sent_with_issues",
        campaignName: "Test campaign",
        senderEmail: "onboarding@resend.dev",
        subject: "Hello",
        recipients: 4,
        sent: 3,
        failed: 1,
      }),
    );

    expect(html).toContain("Sent with issues");
    expect(html).toContain("3 sent");
    expect(html).toContain("1 failed");
  });

  it("shows the provider failure reason", () => {
    const html = renderToStaticMarkup(
      createElement(CampaignSendResult, {
        status: "failed",
        campaignName: "Test campaign",
        senderEmail: "sales@gmail.com",
        subject: "Hello",
        recipients: 1,
        sent: 0,
        failed: 1,
        errorMessage:
          "Resend error 403: sender domain is not verified",
      }),
    );

    expect(html).toContain("We couldn’t send your campaign");
    expect(html).toContain("Resend error 403");
    expect(html).toContain("sender domain is not verified");
  });
});
