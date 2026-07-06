import { describe, expect, it } from "vitest";

describe("test harness", () => {
  it("runs deterministic unit tests", () => {
    expect("zeroDex").toContain("Dex");
  });
});
