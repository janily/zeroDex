import { describe, expect, it } from "vitest";
import { TOKENS } from "../config/tokens";
import { positionDetailsToUiPosition, safeParseSwapAmount } from "./uiFormat";

describe("safeParseSwapAmount", () => {
  it("returns undefined for empty or invalid swap amounts", () => {
    expect(safeParseSwapAmount("", TOKENS[0].address)).toBeUndefined();
    expect(safeParseSwapAmount("-1", TOKENS[0].address)).toBeUndefined();
  });

  it("parses a valid amount using token decimals", () => {
    expect(safeParseSwapAmount("1.5", TOKENS[0].address)).toBe(1_500_000_000_000_000_000n);
  });
});

describe("positionDetailsToUiPosition", () => {
  it("keeps a position active while liquidity remains even when fees are owed", () => {
    expect(
      positionDetailsToUiPosition({
        id: "7",
        raw: {
          owner: "0x1111111111111111111111111111111111111111",
          token0: TOKENS[0].address,
          token1: TOKENS[1].address,
          index: 2n,
          liquidity: 100n,
          tickLower: -10n,
          tickUpper: 10n,
          tokensOwed0: 5n,
          tokensOwed1: 6n,
        },
      }),
    ).toMatchObject({
      owner: "0x1111111111111111111111111111111111111111",
      pair: "MNTA / MNTB",
      status: "Active",
    });
  });

  it("only marks a zero-liquidity position collectable when tokens are owed", () => {
    expect(
      positionDetailsToUiPosition({
        id: "8",
        raw: {
          token0: TOKENS[0].address,
          token1: TOKENS[1].address,
          liquidity: 0n,
          tokensOwed0: 1n,
          tokensOwed1: 0n,
        },
      }).status,
    ).toBe("Collectable");
  });
});
