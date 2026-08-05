import { describe, expect, it } from "vitest";

import { communicationsNavigation } from "./communications-navigation";

describe("communicationsNavigation", () => {
  it("defines the approved workspace sections in order", () => {
    expect(communicationsNavigation.map((item) => item.label)).toEqual([
      "Overview",
      "Cold Outreach",
      "Follow-ups",
      "Newsletters",
      "Templates",
      "Automations",
      "Sender Settings",
    ]);
  });

  it("enables only the implemented Overview route in Slice 1", () => {
    const enabled = communicationsNavigation.filter(
      (item) => item.enabled,
    );
    const disabled = communicationsNavigation.filter(
      (item) => !item.enabled,
    );

    expect(enabled).toEqual([
      {
        label: "Overview",
        to: "/communications",
        enabled: true,
      },
    ]);
    expect(disabled).toHaveLength(6);
    expect(disabled.every((item) => item.to.startsWith("/communications/")))
      .toBe(true);
  });

  it("does not duplicate labels or route destinations", () => {
    const labels = communicationsNavigation.map((item) => item.label);
    const routes = communicationsNavigation.map((item) => item.to);

    expect(new Set(labels).size).toBe(labels.length);
    expect(new Set(routes).size).toBe(routes.length);
  });
});
