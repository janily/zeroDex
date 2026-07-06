import { describe, expect, it } from "vitest";
import { formatTokenAmount, isPositiveAmount, parseTokenAmount } from "./amount";

describe("amount utilities", () => {
  it("parses decimal token amounts into bigint base units", () => {
    expect(parseTokenAmount("1.23", 18)).toBe(1_230_000_000_000_000_000n);
  });

  it("rejects invalid and over-precise amounts", () => {
    expect(() => parseTokenAmount("-1", 18)).toThrow("positive decimal");
    expect(() => parseTokenAmount("1.123", 2)).toThrow("more than 2 decimals");
  });

  it("formats tiny non-zero values", () => {
    expect(formatTokenAmount(1n, 18, 6)).toBe("<0.000001");
  });

  it("detects positive amount strings", () => {
    expect(isPositiveAmount("0")).toBe(false);
    expect(isPositiveAmount("0.01")).toBe(true);
    expect(isPositiveAmount("abc")).toBe(false);
  });
});
