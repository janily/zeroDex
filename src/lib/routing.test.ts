import { describe, expect, it } from "vitest";
import { TOKENS } from "../config/tokens";
import type { DisplayPool } from "../types/domain";
import { getCandidatePools, getCandidateRoutes, selectBestQuote } from "./routing";

const pool = (index: number, liquidity: bigint, status: DisplayPool["status"]): DisplayPool => ({
  token0: TOKENS[0],
  token1: TOKENS[1],
  index,
  fee: 3000,
  tickLower: 1n,
  tickUpper: 10n,
  tick: 5n,
  sqrtPriceX96: 1n,
  liquidity,
  status,
});

describe("routing utilities", () => {
  it("finds same-pair candidate pools in either token order", () => {
    expect(getCandidatePools([pool(0, 100n, "Tradable"), pool(1, 0n, "No liquidity")], TOKENS[1].address, TOKENS[0].address)).toHaveLength(1);
  });

  it("selects best exact input quote by maximum output", () => {
    const firstPool = pool(0, 100n, "Tradable");
    const secondPool = pool(1, 100n, "Tradable");
    const first = { pool: firstPool, pools: [firstPool], indexPath: [0], amountIn: 10n, amountOut: 12n, sqrtPriceLimitX96: 1n };
    const second = { pool: secondPool, pools: [secondPool], indexPath: [1], amountIn: 10n, amountOut: 13n, sqrtPriceLimitX96: 1n };
    expect(selectBestQuote("exact-input", [first, second])).toBe(second);
  });

  it("selects best exact output quote by minimum input", () => {
    const firstPool = pool(0, 100n, "Tradable");
    const secondPool = pool(1, 100n, "Tradable");
    const first = { pool: firstPool, pools: [firstPool], indexPath: [0], amountIn: 10n, amountOut: 12n, sqrtPriceLimitX96: 1n };
    const second = { pool: secondPool, pools: [secondPool], indexPath: [1], amountIn: 9n, amountOut: 12n, sqrtPriceLimitX96: 1n };
    expect(selectBestQuote("exact-output", [first, second])).toBe(second);
  });

  it("quotes each pool alone and each possible multi-pool starting path", () => {
    const pools = [pool(3, 30n, "Tradable"), pool(1, 100n, "Tradable"), pool(2, 60n, "Tradable")];

    expect(getCandidateRoutes(pools).map((route) => route.map((candidate) => candidate.index))).toEqual([
      [3],
      [1],
      [2],
      [3, 1, 2],
      [1, 2, 3],
      [2, 1, 3],
    ]);
  });
});
