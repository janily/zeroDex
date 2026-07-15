import { describe, expect, it } from "vitest";
import { TOKENS } from "../config/tokens";
import type { DisplayPool } from "../types/domain";
import {
  derivePoolStatus,
  feeToPercent,
  formatRange,
  formatRate,
  getSwapPriceLimit,
  getSwapPriceLimitForPools,
  sortTokenAddresses,
  tickToSqrtPriceX96,
} from "./price";

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

  it("uses the pool boundary in the swap direction as the price limit", () => {
    const pool: DisplayPool = {
      token0: TOKENS[0],
      token1: TOKENS[1],
      index: 1,
      fee: 3000,
      tickLower: -1080n,
      tickUpper: 960n,
      tick: -339n,
      sqrtPriceX96: 77900362028167090246352068855n,
      liquidity: 100n,
      status: "Tradable",
    };

    expect(getSwapPriceLimit(pool, TOKENS[0].address)).toBe(tickToSqrtPriceX96(pool.tickLower));
    expect(getSwapPriceLimit(pool, TOKENS[1].address)).toBe(tickToSqrtPriceX96(pool.tickUpper));
  });

  it("uses the shared reachable boundary for a multi-pool path", () => {
    const first: DisplayPool = {
      token0: TOKENS[0], token1: TOKENS[1], index: 1, fee: 3000,
      tickLower: -100n, tickUpper: 100n, tick: 0n, sqrtPriceX96: 1n, liquidity: 100n, status: "Tradable",
    };
    const second = { ...first, index: 2, tickLower: -50n, tickUpper: 80n, tick: 10n };

    expect(getSwapPriceLimitForPools([first, second], TOKENS[0].address)).toBe(tickToSqrtPriceX96(-50n));
    expect(getSwapPriceLimitForPools([first, second], TOKENS[1].address)).toBe(tickToSqrtPriceX96(80n));
  });

  it("rejects a path whose pools have no shared reachable price limit", () => {
    const first: DisplayPool = {
      token0: TOKENS[0], token1: TOKENS[1], index: 1, fee: 3000,
      tickLower: -100n, tickUpper: 100n, tick: -80n, sqrtPriceX96: 1n, liquidity: 100n, status: "Tradable",
    };
    const second = { ...first, index: 2, tickLower: -50n, tickUpper: 80n, tick: 0n };

    expect(getSwapPriceLimitForPools([first, second], TOKENS[0].address)).toBeUndefined();
  });
});
