import { describe, expect, it } from "vitest";
import {
  validateCampaignAttachmentFile,
} from "./campaign-attachments";

function file(name: string, size: number, type = "application/pdf") {
  return new File([new Uint8Array(size)], name, { type });
}

describe("campaign attachment validation", () => {
  it("accepts supported files up to 5 MB", () => {
    expect(
      validateCampaignAttachmentFile(
        file("brochure.pdf", 1024),
      ),
    ).toBeNull();
  });

  it("rejects files larger than 5 MB", () => {
    expect(
      validateCampaignAttachmentFile(
        file("brochure.pdf", 5 * 1024 * 1024 + 1),
      ),
    ).toContain("5 MB");
  });

  it("rejects unsupported file types", () => {
    expect(
      validateCampaignAttachmentFile(
        file("installer.exe", 1024, "application/octet-stream"),
      ),
    ).toContain("PDF");
  });
});
