import { describe, expect, it } from "vitest";
import { derivePoolStatus, feeToPercent, formatRange, formatRate, sortTokenAddresses } from "./price";

describe("price utilities", () => {
  it("sorts token addresses lexicographically", () => {
    expect(sortTokenAddresses("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")).toEqual([
      "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    ]);
  });

  it("derives pool status from liquidity and ticks", () => {
    expect(derivePoolStatus({ liquidity: 0n, tick: 5n, tickLower: 1n, tickUpper: 10n })).toBe("No liquidity");
    expect(derivePoolStatus({ liquidity: 1n, tick: 1n, tickLower: 1n, tickUpper: 10n })).toBe("At boundary");
    expect(derivePoolStatus({ liquidity: 1n, tick: 5n, tickLower: 1n, tickUpper: 10n })).toBe("Tradable");
  });

  it("formats user-facing rates", () => {
    expect(formatRate("MNTA", "MNTB", "1.2846")).toBe("1 MNTA = 1.2846 MNTB");
    expect(formatRange("MNTA", "MNTB", "0.8600", "1.6200")).toBe("1 MNTA = 0.8600 - 1.6200 MNTB");
    expect(feeToPercent(3000)).toBe("0.30%");
  });
});
