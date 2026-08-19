import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Preview final polish", () => {
  it("uses the email-client preview and sender safety warning", () => {
    const preview = readFileSync(
      "src/features/communications/EmailPreview.tsx",
      "utf8",
    );

    expect(preview).toContain("EmailMessagePreview");
    expect(preview).toContain("Sender may be rejected");
    expect(preview).toContain("onboarding@resend.dev");
  });

  it("keeps recipient navigation compact near preview", () => {
    const wizard = readFileSync(
      "src/features/communications/NewCampaignWizard.tsx",
      "utf8",
    );

    expect(wizard).toContain("Recipient");
    expect(wizard).toContain("Previous");
    expect(wizard).toContain("Next recipient");
    expect(wizard).toContain("rounded-xl border");
  });
});
