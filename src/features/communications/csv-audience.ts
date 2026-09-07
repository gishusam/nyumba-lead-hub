import type { ResolvedRecipient } from "./types";

export type CsvAudienceResult = {
  recipients: ResolvedRecipient[];
  summary: {
    uploaded: number;
    valid: number;
    invalid: number;
    duplicates: number;
  };
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }

      continue;
    }

    if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());

  return values;
}

export function parseCsvAudience(
  csv: string,
): CsvAudienceResult {
  const lines = csv
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim());

  if (lines.length === 0) {
    throw new Error("CSV is empty");
  }

  const headers = parseCsvLine(lines[0]).map((header) =>
    header.trim().toLowerCase(),
  );

  const emailIndex = headers.indexOf("email");
  const nameIndex = headers.indexOf("name");

  if (emailIndex === -1) {
    throw new Error("CSV must contain an email column");
  }

  const recipients: ResolvedRecipient[] = [];
  const seen = new Set<string>();

  let invalid = 0;
  let duplicates = 0;

  const dataLines = lines.slice(1);

  dataLines.forEach((line, index) => {
    const values = parseCsvLine(line);

    const email =
      values[emailIndex]?.trim().toLowerCase() ?? "";

    const name =
      nameIndex >= 0
        ? values[nameIndex]?.trim() ?? ""
        : "";

    if (!isValidEmail(email)) {
      invalid += 1;
      return;
    }

    if (seen.has(email)) {
      duplicates += 1;
      return;
    }

    seen.add(email);

    recipients.push({
      id: `csv-${index + 1}`,
      contact_name: name || email,
      company_name: "",
      email,
      area: "",
      lead_type: "",
    });
  });

  return {
    recipients,
    summary: {
      uploaded: dataLines.length,
      valid: recipients.length,
      invalid,
      duplicates,
    },
  };
}
