import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("EmailPreview design", () => {
  it("shows sender context and campaign summary", () => {
    const source = readFileSync(
      "src/features/communications/EmailPreview.tsx",
      "utf8",
    );

    expect(source).toContain("Preview & send");
    expect(source).toContain("EmailMessagePreview");
    expect(source).toContain("Campaign summary");
    expect(source).toContain("Recipients locked");
    expect(source).toContain("Audience size");
  });
});
