import { describe, expect, it } from "vitest";
import { parseCsvAudience } from "./csv-audience";

describe("parseCsvAudience", () => {
  it("parses valid recipients and reports duplicates and invalid emails", () => {
    const csv = `name,email
Sam Test,sam@example.com
Jane Test,jane@example.com
Duplicate Sam,SAM@example.com
Bad Email,not-an-email`;

    const result = parseCsvAudience(csv);

    expect(result.summary).toEqual({
      uploaded: 4,
      valid: 2,
      invalid: 1,
      duplicates: 1,
    });

    expect(result.recipients).toHaveLength(2);

    expect(result.recipients[0]).toMatchObject({
      contact_name: "Sam Test",
      email: "sam@example.com",
    });

    expect(result.recipients[1]).toMatchObject({
      contact_name: "Jane Test",
      email: "jane@example.com",
    });
  });

  it("requires an email column", () => {
    const csv = `name,phone
Sam Test,0712345678`;

    expect(() => parseCsvAudience(csv)).toThrow(
      "CSV must contain an email column",
    );
  });
});
