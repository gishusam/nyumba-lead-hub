import assert from "node:assert/strict";
import test from "node:test";

import { API_BASE_URL, dashboardApi, scraperApi } from "./api.ts";

test("dashboard by-area ignores TanStack query context objects", async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = "";

  globalThis.fetch = (async (input: string | URL | Request) => {
    requestedUrl = String(input);
    return new Response("[]", {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;

  try {
    await dashboardApi.byArea({
      queryKey: ["dashboard", "by-area"],
    } as never);
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(
    requestedUrl,
    `${API_BASE_URL}/api/dashboard/by-area`,
  );
});

test("scraper API preserves the existing run, history, and audit contracts", async () => {
  const originalFetch = globalThis.fetch;
  const requests: Array<{ url: string; method: string; body?: unknown }> = [];

  globalThis.fetch = (async (
    input: string | URL | Request,
    init?: RequestInit,
  ) => {
    requests.push({
      url: String(input),
      method: init?.method ?? "GET",
      body: typeof init?.body === "string" ? JSON.parse(init.body) : undefined,
    });

    const response =
      String(input).endsWith("/api/scraper/run")
        ? { success: true, run_id: 91 }
        : String(input).endsWith("/records")
          ? {
              run_id: 45,
              summary: { imported: 0, rejected: 0, duplicate: 0, total: 0 },
              records: [],
            }
          : [];

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;

  try {
    await scraperApi.runs();
    await scraperApi.records(45);
    await scraperApi.run("apartments", ["ruiru", "thika"]);
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(requests, [
    {
      url: `${API_BASE_URL}/api/scraper/runs`,
      method: "GET",
      body: undefined,
    },
    {
      url: `${API_BASE_URL}/api/scraper/runs/45/records`,
      method: "GET",
      body: undefined,
    },
    {
      url: `${API_BASE_URL}/api/scraper/run`,
      method: "POST",
      body: {
        scraper_type: "apartments",
        areas: ["ruiru", "thika"],
      },
    },
  ]);
});
