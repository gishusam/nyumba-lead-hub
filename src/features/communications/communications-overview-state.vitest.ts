import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { OverviewError } from "./OverviewError";
import { OverviewSkeleton } from "./OverviewSkeleton";
import {
  canManageCommunications,
  providerEventLabel,
  resolveOverviewState,
} from "./communications-overview-state";

describe("resolveOverviewState", () => {
  it("keeps the core overview loading until both required queries settle", () => {
    expect(
      resolveOverviewState({
        overviewPending: true,
        readinessPending: false,
        overviewFailed: false,
        readinessFailed: false,
      }),
    ).toBe("loading");

    expect(
      resolveOverviewState({
        overviewPending: false,
        readinessPending: true,
        overviewFailed: false,
        readinessFailed: false,
      }),
    ).toBe("loading");
  });

  it("returns an error when either required query fails", () => {
    expect(
      resolveOverviewState({
        overviewPending: false,
        readinessPending: false,
        overviewFailed: true,
        readinessFailed: false,
      }),
    ).toBe("error");

    expect(
      resolveOverviewState({
        overviewPending: false,
        readinessPending: false,
        overviewFailed: false,
        readinessFailed: true,
      }),
    ).toBe("error");
  });

  it("returns ready only when both required queries have usable data", () => {
    expect(
      resolveOverviewState({
        overviewPending: false,
        readinessPending: false,
        overviewFailed: false,
        readinessFailed: false,
      }),
    ).toBe("ready");
  });
});

describe("communications role and event presentation", () => {
  it("permits only admins and managers to see future management actions", () => {
    expect(canManageCommunications("admin")).toBe(true);
    expect(canManageCommunications("manager")).toBe(true);
    expect(canManageCommunications("sales")).toBe(false);
    expect(canManageCommunications(undefined)).toBe(false);
  });

  it("translates provider event enums into readable labels", () => {
    expect(providerEventLabel("hard_bounce")).toBe("Hard bounce");
    expect(providerEventLabel("soft_bounce")).toBe("Soft bounce");
    expect(providerEventLabel("opened")).toBe("Opened");
  });
});

describe("Overview state components", () => {
  it("renders a stable, labelled loading skeleton", () => {
    const html = renderToStaticMarkup(
      createElement(OverviewSkeleton),
    );

    expect(html).toContain(
      'aria-label="Loading Communications overview"',
    );
    expect(html.match(/data-overview-skeleton-card/g)).toHaveLength(8);
  });

  it("renders a retryable core error without hiding its explanation", () => {
    const html = renderToStaticMarkup(
      createElement(OverviewError, {
        title: "Communications data unavailable",
        message: "The overview service could not be reached.",
        onRetry: vi.fn(),
      }),
    );

    expect(html).toContain("Communications data unavailable");
    expect(html).toContain(
      "The overview service could not be reached.",
    );
    expect(html).toContain("Retry");
  });
});
