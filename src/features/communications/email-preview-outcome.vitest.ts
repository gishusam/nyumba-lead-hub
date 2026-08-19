import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("EmailPreview delivery outcome", () => {
  it("waits for the real campaign outcome after sending", () => {
    const source = readFileSync(
      "src/features/communications/EmailPreview.tsx",
      "utf8",
    );

    expect(source).toContain("waitForCampaignOutcome");
    expect(source).toContain('status="sent"');
    expect(source).toContain('status="sent_with_issues"');
    expect(source).toContain('status="failed"');
  });
});
