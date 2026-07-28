import type { ScraperRun } from "./api";

export type RunHealthClassification = {
  key: "timeout" | "database" | "source" | "access" | "unknown";
  label: string;
  explanation: string;
};

export type RunHealthGroup = RunHealthClassification & {
  groupKey: string;
  runs: ScraperRun[];
  latestRun: ScraperRun;
};

const CLASSIFIERS: Array<{
  key: Exclude<RunHealthClassification["key"], "unknown">;
  pattern: RegExp;
  label: string;
  explanation: string;
}> = [
  {
    key: "timeout",
    pattern: /\b(timeout|timed out|deadline exceeded|took too long)\b/i,
    label: "Took too long",
    explanation:
      "The scraper did not finish within its allowed time. Try fewer areas before running it again.",
  },
  {
    key: "database",
    pattern:
      /\b(emaxconnsession|connection pool|pool reached|too many connections|database (?:connection )?(?:failed|busy|unavailable))\b/i,
    label: "Database was busy",
    explanation:
      "The database could not accept this run at that moment. Wait briefly before trying again.",
  },
  {
    key: "source",
    pattern:
      /\b(network|connection reset|upstream|source unavailable|fetch failed|bad gateway|service unavailable|google maps)\b|\b50[23]\b/i,
    label: "Source was unavailable",
    explanation:
      "The external data source could not be reached reliably. Retry the run later.",
  },
  {
    key: "access",
    pattern: /\b(unauthorized|forbidden|permission denied|authentication failed)\b|\b40[13]\b/i,
    label: "Access issue",
    explanation:
      "The scraper could not access a required service. Technical review may be needed before retrying.",
  },
];

const UNKNOWN_CLASSIFICATION: RunHealthClassification = {
  key: "unknown",
  label: "Needs review",
  explanation:
    "This is a new failure pattern. The technical details are preserved for investigation.",
};

export function classifyRunError(
  error?: string | null,
): RunHealthClassification {
  const message = error?.trim() ?? "";
  const match = CLASSIFIERS.find((classifier) =>
    classifier.pattern.test(message),
  );

  return match
    ? {
        key: match.key,
        label: match.label,
        explanation: match.explanation,
      }
    : UNKNOWN_CLASSIFICATION;
}

export function normalizeErrorFingerprint(error?: string | null): string {
  const message = error?.trim().toLowerCase() || "no error details";

  return message
    .replace(
      /(?:[a-z]:)?[\\/](?:[^\\/\s,:]+[\\/])*[^\\/\s,:]+/gi,
      "<path>",
    )
    .replace(
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi,
      "<id>",
    )
    .replace(
      /\b\d{4}-\d{2}-\d{2}(?:[t\s]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?z?)?\b/gi,
      "<timestamp>",
    )
    .replace(/\bline\s+\d+\b/gi, "line <n>")
    .replace(/\b\d+\b/g, "<n>")
    .replace(/\s+/g, " ")
    .trim();
}

function runTimestamp(run: ScraperRun): number {
  const value = run.started_at ?? run.created_at ?? run.finished_at;
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function groupFailedRuns(
  runs: readonly ScraperRun[],
): RunHealthGroup[] {
  const groups = new Map<string, RunHealthGroup>();
  const failures = runs
    .filter((run) => run.status === "failed")
    .sort((a, b) => runTimestamp(b) - runTimestamp(a));

  for (const run of failures) {
    const classification = classifyRunError(run.error);
    const groupKey =
      classification.key === "unknown"
        ? `unknown:${normalizeErrorFingerprint(run.error)}`
        : classification.key;
    const existing = groups.get(groupKey);

    if (existing) {
      existing.runs.push(run);
      continue;
    }

    groups.set(groupKey, {
      ...classification,
      groupKey,
      runs: [run],
      latestRun: run,
    });
  }

  return [...groups.values()].sort(
    (a, b) => runTimestamp(b.latestRun) - runTimestamp(a.latestRun),
  );
}
