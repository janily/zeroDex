import type { Address, DisplayPool, PoolStatus } from "../types/domain";

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

export function tickToSqrtPriceX96(tick: bigint | number): bigint {
  return BigInt(Math.floor(Math.sqrt(1.0001 ** Number(tick)) * 2 ** 96));
}

export function getSwapPriceLimit(pool: DisplayPool, tokenIn: Address): bigint {
  const zeroForOne = tokenIn.toLowerCase() === pool.token0.address.toLowerCase();
  return tickToSqrtPriceX96(zeroForOne ? pool.tickLower : pool.tickUpper);
}

export function getSwapPriceLimitForPools(pools: DisplayPool[], tokenIn: Address): bigint | undefined {
  if (pools.length === 0) return undefined;
  const zeroForOne = tokenIn.toLowerCase() === pools[0].token0.address.toLowerCase();
  const limitTick = zeroForOne
    ? pools.reduce((limit, pool) => (pool.tickLower > limit ? pool.tickLower : limit), pools[0].tickLower)
    : pools.reduce((limit, pool) => (pool.tickUpper < limit ? pool.tickUpper : limit), pools[0].tickUpper);
  const compatible = pools.every((pool) => (zeroForOne ? limitTick < pool.tick : limitTick > pool.tick));
  return compatible ? tickToSqrtPriceX96(limitTick) : undefined;
}
