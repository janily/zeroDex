import { describe, expect, it } from "vitest";
import { SEPOLIA_CHAIN_ID, SEPOLIA_HEX_CHAIN_ID } from "./chains";
import { CONTRACTS } from "./contracts";
import { TOKENS } from "./tokens";

describe("zeroDex static config", () => {
  it("uses Sepolia as the only supported chain", () => {
    expect(SEPOLIA_CHAIN_ID).toBe(11155111);
    expect(SEPOLIA_HEX_CHAIN_ID).toBe("0xaa36a7");
  });

  it("defines the three MetaNodeSwap contracts", () => {
    expect(CONTRACTS.poolManager).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(CONTRACTS.positionManager).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(CONTRACTS.swapRouter).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it("defines exactly four test tokens", () => {
    expect(TOKENS).toHaveLength(4);
    expect(TOKENS.map((token) => token.symbol)).toEqual(["MNTA", "MNTB", "MNTC", "MNTD"]);
  });
});
