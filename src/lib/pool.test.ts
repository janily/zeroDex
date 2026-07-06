import { describe, expect, it } from "vitest";
import { TOKENS } from "../config/tokens";
import type { DisplayPool, PoolInfo } from "../types/domain";
import { filterPools, normalizePool } from "./pool";

const basePool: PoolInfo = {
  token0: TOKENS[0].address,
  token1: TOKENS[1].address,
  index: 0n,
  fee: 3000n,
  tickLower: 1n,
  tickUpper: 10n,
  tick: 5n,
  sqrtPriceX96: 1n,
  liquidity: 100n,
};

describe("pool utilities", () => {
  it("normalizes known token pools", () => {
    expect(normalizePool(basePool)).toMatchObject({
      index: 0,
      fee: 3000,
      status: "Tradable",
    });
  });

  it("filters pools by query, fee, and empty state", () => {
    const normalized = normalizePool(basePool) as DisplayPool;
    const empty = { ...normalized, index: 1, liquidity: 0n };
    expect(filterPools([normalized, empty], { query: "MNTA", fee: "0.30%", hideEmpty: true })).toHaveLength(1);
    expect(filterPools([normalized, empty], { query: "1", fee: "All fees", hideEmpty: false })).toEqual([empty]);
  });
});
