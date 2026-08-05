import { describe, expect, it } from "vitest";

import type {
  CommunicationsOverview,
  CommunicationsReadiness,
} from "../../lib/communications-api";
import {
  buildOverviewViewModel,
  emptyOverview,
} from "./overview-model";

function overview(
  overrides: Partial<CommunicationsOverview> = {},
): CommunicationsOverview {
  return {
    ...emptyOverview,
    ...overrides,
  };
}

function readiness(
  overrides: Partial<CommunicationsReadiness> = {},
): CommunicationsReadiness {
  return {
    ready: true,
    environment: "development",
    issues: [],
    schema: {
      ready: true,
      missing_tables: [],
      missing_columns: [],
      missing_indexes: [],
      mismatched_constraints: [],
    },
    checked_at: "2026-08-05T10:00:00+00:00",
    ...overrides,
  };
}

describe("buildOverviewViewModel", () => {
  it("calculates delivery, open, and click rates from backend counters", () => {
    const model = buildOverviewViewModel(
      overview({
        total_messages: 80,
        sent_messages: 80,
        delivered_messages: 72,
        opens: 36,
        clicks: 9,
      }),
      readiness(),
    );

    expect(model.rates).toEqual([
      expect.objectContaining({
        id: "delivery",
        value: 90,
        numerator: 72,
        denominator: 80,
      }),
      expect.objectContaining({
        id: "open",
        value: 50,
        numerator: 36,
        denominator: 72,
      }),
      expect.objectContaining({
        id: "click",
        value: 12.5,
        numerator: 9,
        denominator: 72,
      }),
    ]);
  });

  it("returns zero rates when a denominator is zero", () => {
    const model = buildOverviewViewModel(emptyOverview, readiness());

    expect(model.rates.map((rate) => rate.value)).toEqual([0, 0, 0]);
  });

  it("marks a clean ready report as healthy", () => {
    const model = buildOverviewViewModel(
      overview({ total_messages: 1 }),
      readiness(),
    );

    expect(model.readiness.status).toBe("healthy");
    expect(model.readiness.label).toBe("Ready");
  });

  it("marks an issue-bearing report as degraded", () => {
    const model = buildOverviewViewModel(
      overview({ total_messages: 1 }),
      readiness({
        ready: false,
        issues: ["Missing table: email_messages"],
        schema: {
          ready: false,
          missing_tables: ["email_messages"],
          missing_columns: [],
          missing_indexes: [],
          mismatched_constraints: [],
        },
      }),
    );

    expect(model.readiness.status).toBe("degraded");
    expect(model.readiness.label).toBe("Needs attention");
    expect(model.readiness.issues).toEqual([
      "Missing table: email_messages",
    ]);
  });

  it("identifies a completely empty operational state", () => {
    const emptyModel = buildOverviewViewModel(
      emptyOverview,
      readiness(),
    );
    const activeModel = buildOverviewViewModel(
      overview({ active_campaigns: 1 }),
      readiness(),
    );

    expect(emptyModel.isEmpty).toBe(true);
    expect(activeModel.isEmpty).toBe(false);
  });

  it("produces stable metric cards and bounded delivery status percentages", () => {
    const model = buildOverviewViewModel(
      overview({
        total_messages: 10,
        delivered_messages: 8,
        failed_messages: 2,
        active_campaigns: 3,
        active_newsletters: 1,
        suppressed_contacts: 4,
      }),
      readiness(),
    );

    expect(model.metrics).toEqual([
      { id: "total", label: "Total messages", value: 10 },
      { id: "delivered", label: "Delivered", value: 8 },
      { id: "campaigns", label: "Active campaigns", value: 3 },
      { id: "newsletters", label: "Active newsletters", value: 1 },
      { id: "suppressed", label: "Suppressed contacts", value: 4 },
    ]);

    expect(
      model.deliveryStatuses.find((item) => item.id === "delivered"),
    ).toEqual({
      id: "delivered",
      label: "Delivered",
      value: 8,
      percentage: 80,
    });
  });
});
