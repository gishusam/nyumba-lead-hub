import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { EmailMessagePreview } from "./EmailMessagePreview";

describe("EmailMessagePreview", () => {
  it("looks like an email client instead of a detail table", () => {
    const html = renderToStaticMarkup(
      createElement(EmailMessagePreview, {
        campaignName: "Westlands outreach",
        senderName: "Nyumba Zetu",
        senderEmail: "onboarding@resend.dev",
        recipientName: "Samwel",
        recipientEmail: "samwel@example.com",
        subject: "See how Nyumba Zetu can support",
        body: "Hi Samwel,\n\nWould you be open to a short demo?",
      }),
    );

    expect(html).toContain("See how Nyumba Zetu can support");
    expect(html).toContain("Nyumba Zetu");
    expect(html).toContain("onboarding@resend.dev");
    expect(html).toContain("to ");
    expect(html).toContain("Samwel");
    expect(html).toContain("samwel@example.com");
    expect(html).toContain("Would you be open to a short demo?");
  });
});
