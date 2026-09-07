import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { EmailMessagePreview } from "./EmailMessagePreview";

describe("EmailMessagePreview attachment", () => {
  it("shows the selected attachment before sending", () => {
    const html = renderToStaticMarkup(
      React.createElement(EmailMessagePreview, {
        campaignName: "Westlands outreach",
        senderName: "Nyumba Zetu",
        senderEmail: "onboarding@resend.dev",
        recipientName: "Samuel Ngugi",
        recipientEmail: "sam@example.com",
        subject: "Book a demo",
        body: "Hello Samuel",
        attachment: {
          name: "nyumba-zetu-brochure.pdf",
          size: 2048,
        },
      } as any),
    );

    expect(html).toContain(
      "nyumba-zetu-brochure.pdf",
    );

    expect(html).toContain("2.0 KB");
  });
});
