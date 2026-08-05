import { describe, expect, it, vi } from "vitest";

import {
  createCommunicationsApi,
  type ApiRequester,
} from "./communications-api";

describe("communicationsApi", () => {
  it("uses the authenticated overview and readiness endpoints", async () => {
    const requester = vi.fn(async () => ({})) as unknown as ApiRequester;
    const api = createCommunicationsApi(requester);

    await api.overview();
    await api.readiness();

    expect(requester).toHaveBeenNthCalledWith(
      1,
      "/api/communications/overview",
    );
    expect(requester).toHaveBeenNthCalledWith(
      2,
      "/api/communications/readiness",
    );
  });

  it("requests recent provider events with the requested limit", async () => {
    const requester = vi.fn(async () => []) as unknown as ApiRequester;
    const api = createCommunicationsApi(requester);

    await api.events({ limit: 8 });

    expect(requester).toHaveBeenCalledWith(
      "/api/communications/events?limit=8",
    );
  });

  it("defaults recent provider events to eight rows", async () => {
    const requester = vi.fn(async () => []) as unknown as ApiRequester;
    const api = createCommunicationsApi(requester);

    await api.events();

    expect(requester).toHaveBeenCalledWith(
      "/api/communications/events?limit=8",
    );
  });
});
