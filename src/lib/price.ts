import type { Address, PoolStatus } from "../types/domain";

export function sortTokenAddresses(a: Address, b: Address): [Address, Address] {
  return a.toLowerCase() < b.toLowerCase() ? [a, b] : [b, a];
}

export function derivePoolStatus(input: {
  liquidity: bigint;
  tick: bigint;
  tickLower: bigint;
  tickUpper: bigint;
}): PoolStatus {
  if (input.liquidity === 0n) return "No liquidity";
  if (input.tick <= input.tickLower || input.tick >= input.tickUpper) return "At boundary";
  return "Tradable";
}

export function formatRate(baseSymbol: string, quoteSymbol: string, value: string): string {
  return `1 ${baseSymbol} = ${value} ${quoteSymbol}`;
}

export function formatRange(baseSymbol: string, quoteSymbol: string, min: string, max: string): string {
  return `1 ${baseSymbol} = ${min} - ${max} ${quoteSymbol}`;
}

export function feeToPercent(fee: number | bigint): string {
  const feeNumber = typeof fee === "bigint" ? Number(fee) : fee;
  return `${(feeNumber / 10_000).toFixed(2)}%`;
}
