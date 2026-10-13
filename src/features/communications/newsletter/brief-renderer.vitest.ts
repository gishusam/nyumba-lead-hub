import { describe, expect, it } from "vitest";
import { createNewsletterFromTemplate } from "./templates";
import { renderNewsletter } from "./render-newsletter";

describe("Nyumba Zetu Brief renderer", () => {
  it("renders the approved editorial email design", () => {
    const draft = createNewsletterFromTemplate("nyumba-zetu-brief");

    const image = draft.blocks.find((block) => block.type === "image");
    if (image?.type === "image") {
      image.url = "https://example.com/property.jpg";
    }

    const button = draft.blocks.find((block) => block.type === "button");
    if (button?.type === "button") {
      button.url = "https://nyumbazetu.com/demo";
    }

    const rendered = renderNewsletter(draft, {
      contact_name: "Jane",
      company_name: "Acme Realty",
      area: "Nairobi",
      unsubscribe_url: "https://nyumbazetu.com/unsubscribe",
    });

    expect(rendered.html).toContain("THE NYUMBA ZETU BRIEF");
    expect(rendered.html).toContain("SMARTER OPERATIONS");
    expect(rendered.html).toContain("Run better properties.");
    expect(rendered.html).toContain("Grow with confidence.");
    expect(rendered.html).toContain("Jane");
    expect(rendered.html).toContain("Acme Realty");
    expect(rendered.html).toContain("property.jpg");
    expect(rendered.html).toContain("Book a Demo");
    expect(rendered.html).toContain("Ready to see what Nyumba Zetu can do");

    // Desktop/editor preview must keep the approved split hero layout.
    expect(rendered.html).toContain("max-width: 480px");

    // The personalized intro belongs inside the left hero column,
    // before the property image markup.
    expect(rendered.html.indexOf("Hi Jane,")).toBeLessThan(
      rendered.html.indexOf("property.jpg"),
    );

    // Greeting should appear once only.
    expect(rendered.html.match(/Hi Jane,/g)?.length).toBe(1);

    // Picture-2 visual contract.
    expect(rendered.html).toContain("background:#0B3528");
    expect(rendered.html).toContain("color:#ffffff");
    expect(rendered.html).toContain("font-family:Georgia");
    expect(rendered.html).toContain("background:#F1F7F3");
    expect(rendered.html).toContain("Ready to see what Nyumba Zetu can do for Acme Realty?");
    expect(rendered.html).toContain("Software for better organised property teams");
    expect(rendered.html).toContain("Visit our website");

    // Final approved Nyumba Zetu Brief structure.
    expect(rendered.html).toContain("Manage preferences");

    // Feature-card icon structure.
    expect(rendered.html).toContain('aria-label="Stay organized icon"');
    expect(rendered.html).toContain('aria-label="Follow up faster icon"');
    expect(rendered.html).toContain('aria-label="Make smarter decisions icon"');

    // CTA arrow treatment.
    expect(rendered.html).toContain("Book a Demo&nbsp;→");

    // Footer social structure.
    expect(rendered.html).toContain('aria-label="LinkedIn"');
    expect(rendered.html).toContain('aria-label="X"');
    expect(rendered.html).toContain('aria-label="YouTube"');

    // Branded building mark in header/footer.
    expect(rendered.html.match(/aria-label="Nyumba Zetu mark"/g)?.length).toBe(2);

    // Footer social structure from the approved design.
    expect(rendered.html).toContain('aria-label="LinkedIn"');
    expect(rendered.html).toContain('aria-label="X"');
    expect(rendered.html).toContain('aria-label="YouTube"');
  });
});
