import { describe, expect, it } from "vitest";

import {
  applyCommunicationTemplate,
  mapEmailSettingsToCommunicationTemplates,
  type CommunicationTemplate,
} from "./communication-templates";

describe("applyCommunicationTemplate", () => {
  it("copies the selected template into the campaign draft", () => {
    const template: CommunicationTemplate = {
      id: "cold",
      label: "Cold Outreach Template",
      subject: "Demo request — {company_name}",
      body:
        "Hi {contact_name},\n\nWe would love to show you Nyumba Zetu.\n\nRegards,\n{rep_name}",
    };

    const result = applyCommunicationTemplate(
      {
        subject: "Old subject",
        body: "Old body",
      },
      template,
    );

    expect(result).toEqual({
      subject: "Demo request — {company_name}",
      body:
        "Hi {contact_name},\n\nWe would love to show you Nyumba Zetu.\n\nRegards,\n{rep_name}",
    });
  });

  it("does not mutate the master template", () => {
    const template: CommunicationTemplate = {
      id: "cold",
      label: "Cold Outreach Template",
      subject: "Original subject",
      body: "Original body",
    };

    const result = applyCommunicationTemplate(
      {
        subject: "",
        body: "",
      },
      template,
    );

    result.subject = "Edited campaign subject";
    result.body = "Edited campaign body";

    expect(template.subject).toBe("Original subject");
    expect(template.body).toBe("Original body");
  });
});

describe("mapEmailSettingsToCommunicationTemplates", () => {
  it("maps the central backend templates into compose options", () => {
    const result = mapEmailSettingsToCommunicationTemplates({
      sender_name: "Nyumba Zetu Sales",
      template_cold: {
        label: "Cold Outreach Template",
        subject: "Cold subject",
        body: "Cold body {rep_name}",
      },
      template_followup: {
        label: "Follow-up Template",
        subject: "Follow-up subject",
        body: "Follow-up body {rep_name}",
      },
      placeholders: {},
    });

    expect(result).toEqual([
      {
        id: "cold",
        label: "Cold Outreach Template",
        subject: "Cold subject",
        body: "Cold body {rep_name}",
      },
      {
        id: "followup",
        label: "Follow-up Template",
        subject: "Follow-up subject",
        body: "Follow-up body {rep_name}",
      },
    ]);
  });
});
