import { describe, expect, it } from "vitest";
import { CONTRACTS } from "../config/contracts";
import { TOKENS } from "../config/tokens";
import { findMissingAllowances, getMintAllowancePlan, getSwapAllowancePlan, resolveMissingAllowances } from "./allowance";

describe("allowance planning", () => {
  it("checks SwapRouter for exact input swaps", () => {
    expect(
      getSwapAllowancePlan({
        tokenIn: TOKENS[0].address,
        mode: "exact-input",
        amountIn: 10n,
        amountInMaximum: 20n,
      }),
    ).toEqual({ token: TOKENS[0].address, spender: CONTRACTS.swapRouter, required: 10n });
  });

  it("checks amountInMaximum for exact output swaps", () => {
    expect(
      getSwapAllowancePlan({
        tokenIn: TOKENS[0].address,
        mode: "exact-output",
        amountIn: 10n,
        amountInMaximum: 20n,
      }).required,
    ).toBe(20n);
  });

  it("checks both tokens against PositionManager for mint", () => {
    expect(
      getMintAllowancePlan({
        token0: TOKENS[0].address,
        token1: TOKENS[1].address,
        amount0Desired: 10n,
        amount1Desired: 20n,
      }),
    ).toEqual([
      { token: TOKENS[0].address, spender: CONTRACTS.positionManager, required: 10n },
      { token: TOKENS[1].address, spender: CONTRACTS.positionManager, required: 20n },
    ]);
  });

  it("returns only missing allowances", () => {
    const checks = getMintAllowancePlan({
      token0: TOKENS[0].address,
      token1: TOKENS[1].address,
      amount0Desired: 10n,
      amount1Desired: 20n,
    });
    const missing = findMissingAllowances(checks, (token) => (token === TOKENS[0].address ? 10n : 0n));
    expect(missing).toEqual([checks[1]]);
  });

  it("resolves missing allowances from an async chain reader", async () => {
    const checks = getMintAllowancePlan({
      token0: TOKENS[0].address,
      token1: TOKENS[1].address,
      amount0Desired: 10n,
      amount1Desired: 20n,
    });

    const missing = await resolveMissingAllowances(checks, async (token) => (token === TOKENS[0].address ? 10n : 5n));

    expect(missing).toEqual([checks[1]]);
  });
});
