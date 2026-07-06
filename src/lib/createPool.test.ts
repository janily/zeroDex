import { describe, expect, it } from "vitest";
import { TOKENS } from "../config/tokens";
import { buildCreatePoolParams, feePercentToUnits, priceToTick } from "./createPool";

describe("create pool params", () => {
  it("rejects identical tokens", () => {
    expect(() =>
      buildCreatePoolParams({
        tokenA: TOKENS[0].address,
        tokenB: TOKENS[0].address,
        feePercent: "0.30%",
        initialRate: "1.2",
        minRate: "1.0",
        maxRate: "1.5",
      }),
    ).toThrow("two different tokens");
  });

  it("rejects invalid rate ordering", () => {
    expect(() =>
      buildCreatePoolParams({
        tokenA: TOKENS[1].address,
        tokenB: TOKENS[0].address,
        feePercent: "0.30%",
        initialRate: "1.0",
        minRate: "1.2",
        maxRate: "1.5",
      }),
    ).toThrow("minimum < initial < maximum");
  });

  it("sorts tokens, converts fee, ticks, and sqrt price", () => {
    const params = buildCreatePoolParams({
      tokenA: TOKENS[1].address,
      tokenB: TOKENS[0].address,
      feePercent: "0.30%",
      initialRate: "1.2",
      minRate: "1.0",
      maxRate: "1.5",
    });

    expect(params.token0.toLowerCase()).toBe(TOKENS[0].address.toLowerCase());
    expect(params.token1.toLowerCase()).toBe(TOKENS[1].address.toLowerCase());
    expect(params.fee).toBe(3000);
    expect(params.tickLower).toBe(priceToTick(1.0));
    expect(params.tickUpper).toBe(priceToTick(1.5));
    expect(params.sqrtPriceX96).toBeGreaterThan(0n);
  });

  it("converts percent fee to hundredths of a bip", () => {
    expect(feePercentToUnits("0.05%")).toBe(500);
    expect(feePercentToUnits("1.00")).toBe(10000);
  });
});
