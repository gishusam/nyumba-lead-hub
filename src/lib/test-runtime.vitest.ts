import { describe, expect, it } from "vitest";

describe("frontend test runtime", () => {
  it("runs TypeScript tests under the supported runtime", () => {
    expect(Number(process.versions.node.split(".")[0])).toBe(22);
  });
});
