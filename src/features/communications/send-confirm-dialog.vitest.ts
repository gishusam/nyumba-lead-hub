import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("send campaign confirmation", () => {
  it("uses the Nyumba Zetu dialog instead of window.confirm", () => {
    const source = readFileSync(
      "src/features/communications/EmailPreview.tsx",
      "utf8",
    );

    expect(source).not.toContain("window.confirm");
    expect(source).toContain("AlertDialog");
    expect(source).toContain("Ready to send?");
    expect(source).toContain("Send campaign");
  });
});
