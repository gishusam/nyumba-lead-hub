import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("EmailPreview send result integration", () => {
  it("renders CampaignSendResult for success and failure states", () => {
    const source = readFileSync(
      "src/features/communications/EmailPreview.tsx",
      "utf8",
    );

    expect(source).toContain(
      'import { CampaignSendResult } from "./CampaignSendResult"',
    );

    expect(source).toContain(
      '<CampaignSendResult',
    );

    expect(source).toContain(
      'status="sending"',
    );

    expect(source).toContain(
      'status="failed"',
    );
  });
});
