import { Interface } from "ethers";
import { describe, expect, it } from "vitest";
import { poolManagerAbi } from "./poolManager";
import type { Address } from "../types/domain";

const pool = "0xfCd4EF33E495dB176f142D084cC43c970d771917" as Address;
const token0 = "0x4798388e3adE569570Df626040F07DF71135C48E" as Address;
const token1 = "0x86B5df6FF459854ca91318274E47F4eEE245CF28" as Address;

describe("poolManager ABI", () => {
  it("decodes getAllPools entries with the deployed pool address prefix", () => {
    const deployedShape = new Interface([
      "function getAllPools() view returns (tuple(address pool,address token0,address token1,uint32 index,uint24 fee,int24 tickSpacing,int24 tickLower,int24 tickUpper,int24 tick,uint160 sqrtPriceX96,uint128 liquidity)[])",
    ]);
    const appShape = new Interface(poolManagerAbi);
    const encoded = deployedShape.encodeFunctionResult("getAllPools", [
      [[pool, token0, token1, 0, 3000, 0, -887220, 887220, -465, 77410673440994234587911759577n, 1234045354338811703593n]],
    ]);

    const decoded = appShape.decodeFunctionResult("getAllPools", encoded)[0][0];

    expect(decoded.pool).toBe(pool);
    expect(decoded.token0).toBe(token0);
    expect(decoded.token1).toBe(token1);
    expect(decoded.index).toBe(0n);
    expect(decoded.fee).toBe(3000n);
    expect(decoded.tickLower).toBe(-887220n);
    expect(decoded.tickUpper).toBe(887220n);
    expect(decoded.tick).toBe(-465n);
    expect(decoded.sqrtPriceX96).toBe(77410673440994234587911759577n);
    expect(decoded.liquidity).toBe(1234045354338811703593n);
  });
});
