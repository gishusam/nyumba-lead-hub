import { describe, expect, it } from "vitest";
import {
  createNewsletterFromTemplate,
  NEWSLETTER_TEMPLATES,
} from "./templates";

describe("Nyumba Zetu Brief template", () => {
  it("provides the approved editorial newsletter structure", () => {
    const template = NEWSLETTER_TEMPLATES.find(
      (item) => item.key === "nyumba-zetu-brief",
    );

    expect(template).toBeDefined();
    expect(template?.name).toBe("Nyumba Zetu Brief");

    const draft = createNewsletterFromTemplate(
      "nyumba-zetu-brief" as any,
    );

    expect(draft.templateKey).toBe("nyumba-zetu-brief");

    expect(draft.blocks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "heading",
          text: expect.stringContaining("Run better"),
        }),
        expect.objectContaining({
          type: "text",
          text: expect.stringContaining("{contact_name}"),
        }),
        expect.objectContaining({
          type: "image",
          url: expect.stringMatching(/^https:\/\//),
          alt: "Modern property development",
        }),
        expect.objectContaining({
          type: "feature-row",
        }),
        expect.objectContaining({
          type: "button",
          label: "Book a Demo",
        }),
      ]),
    );
  });
});
