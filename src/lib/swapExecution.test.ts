import { describe, expect, it } from "vitest";
import { buildSwapExecution } from "./swapExecution";
import type { Address, DisplayPool } from "../types/domain";

const tokenA = "0x0000000000000000000000000000000000000001" as Address;
const tokenB = "0x0000000000000000000000000000000000000002" as Address;

const pool: DisplayPool = {
  token0: { address: tokenA, name: "Token A", symbol: "TKNA", decimals: 18, mintUrl: "" },
  token1: { address: tokenB, name: "Token B", symbol: "TKNB", decimals: 18, mintUrl: "" },
  index: 7,
  fee: 3000,
  tickLower: 1n,
  tickUpper: 10n,
  tick: 5n,
  sqrtPriceX96: 1n,
  liquidity: 100n,
  status: "Tradable",
};

describe("buildSwapExecution", () => {
  it("builds exact input params from the selected quote and slippage", () => {
    expect(
      buildSwapExecution({
        mode: "exact-input",
        tokenIn: tokenA,
        tokenOut: tokenB,
        amountIn: 1000n,
        amountOut: 0n,
        quote: { pool, pools: [pool], indexPath: [7], amountIn: 1000n, amountOut: 500n, sqrtPriceLimitX96: 123n },
        slippageBps: 50n,
      }),
    ).toEqual({
      type: "swap",
      mode: "exact-input",
      tokenIn: tokenA,
      tokenOut: tokenB,
      poolIndices: [7],
      amountIn: 1000n,
      amountOutMinimum: 497n,
      sqrtPriceLimitX96: 123n,
    });
  });

  it("builds exact output params from the selected quote and slippage", () => {
    expect(
      buildSwapExecution({
        mode: "exact-output",
        tokenIn: tokenB,
        tokenOut: tokenA,
        amountIn: 0n,
        amountOut: 500n,
        quote: { pool, pools: [pool], indexPath: [7], amountIn: 1000n, amountOut: 500n, sqrtPriceLimitX96: 456n },
        slippageBps: 50n,
      }),
    ).toEqual({
      type: "swap",
      mode: "exact-output",
      tokenIn: tokenB,
      tokenOut: tokenA,
      poolIndices: [7],
      amountOut: 500n,
      amountInMaximum: 1005n,
      sqrtPriceLimitX96: 456n,
    });
  });

  it("rounds exact-output maximum input up to avoid a one-wei shortfall", () => {
    expect(
      buildSwapExecution({
        mode: "exact-output",
        tokenIn: tokenB,
        tokenOut: tokenA,
        amountIn: 0n,
        amountOut: 1n,
        quote: { pool, pools: [pool], indexPath: [7], amountIn: 1n, amountOut: 1n, sqrtPriceLimitX96: 456n },
        slippageBps: 50n,
      }),
    ).toMatchObject({ amountInMaximum: 2n });
  });
});
