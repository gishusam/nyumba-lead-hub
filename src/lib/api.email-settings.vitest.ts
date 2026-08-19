import { afterEach, describe, expect, it, vi } from "vitest";

import {
  API_BASE_URL,
  emailSettingsApi,
} from "./api";

describe("emailSettingsApi", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads the central email templates", async () => {
    const payload = {
      sender_name: "Nyumba Zetu Sales",
      template_cold: {
        label: "Cold Outreach Template",
        subject: "Cold subject",
        body: "Cold body {rep_name}",
      },
      template_followup: {
        label: "Follow-up Template",
        subject: "Follow-up subject",
        body: "Follow-up body {rep_name}",
      },
      placeholders: {},
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => payload,
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await emailSettingsApi.get();

    expect(result).toEqual(payload);

    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/settings/email`,
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      }),
    );
  });
});
