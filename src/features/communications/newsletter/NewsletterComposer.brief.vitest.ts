import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { createCampaignDraft } from "../campaign-state";
import { NewsletterComposer } from "./NewsletterComposer";
import { createNewsletterFromTemplate } from "./templates";

describe("NewsletterComposer Nyumba Zetu Brief editor", () => {
  it("uses a locked structured editor for text and links", () => {
    const state = {
      ...createCampaignDraft(),
      campaignType: "newsletter" as const,
      senderName: "Nyumba Zetu",
      senderEmail: "sales@nyumbazetu.com",
      subject: "See how Nyumba Zetu can help {company_name} work smarter",
      newsletter: createNewsletterFromTemplate("nyumba-zetu-brief"),
    };

    const html = renderToStaticMarkup(
      createElement(NewsletterComposer, {
        state,
        onChange: () => {},
      }),
    );

    expect(html).toContain("Nyumba Zetu Brief editor");
    expect(html).toContain("Headline");
    expect(html).toContain("Intro copy");
    expect(html).toContain("CTA label");
    expect(html).toContain("CTA URL");

    expect(html).toContain("Feature 1 title");
    expect(html).toContain("Feature 1 copy");
    expect(html).toContain("Feature 2 title");
    expect(html).toContain("Feature 3 title");

    expect(html).toContain("Design and imagery are locked");

    expect(html).not.toContain("Add content");
    expect(html).not.toContain("Email blocks");
    expect(html).not.toContain("Block settings");

    // Picture-2 workspace layout.
    expect(html).toContain("Newsletter canvas");
    expect(html).toContain("Email preview");
    expect(html).toContain("Desktop preview");
    expect(html).toContain("Mobile preview");
    expect(html).toContain("Nyumba Zetu Brief workspace");

    // Picture-2 left rail.
    expect(html).toContain("Template");
    expect(html).toContain("Email details");
    expect(html).toContain("Subject");
    expect(html).toContain("Sender name");
    expect(html).toContain("Sender email");

    // The Brief workspace replaces the old full-width template gallery.
    expect(html).not.toContain("Branded templates");

    // Final picture-2 workspace proportions.
    expect(html).toContain(
      "xl:grid-cols-[22rem_minmax(34rem,1fr)_21rem]",
    );
  });
});
