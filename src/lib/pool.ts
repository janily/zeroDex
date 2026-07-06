import { getTokenByAddress } from "../config/tokens";
import type { DisplayPool, PoolInfo } from "../types/domain";
import { derivePoolStatus } from "./price";

export function normalizePool(pool: PoolInfo): DisplayPool | undefined {
  const token0 = getTokenByAddress(pool.token0);
  const token1 = getTokenByAddress(pool.token1);
  if (!token0 || !token1) return undefined;

  return {
    token0,
    token1,
    index: Number(pool.index),
    fee: Number(pool.fee),
    tickLower: pool.tickLower,
    tickUpper: pool.tickUpper,
    tick: pool.tick,
    sqrtPriceX96: pool.sqrtPriceX96,
    liquidity: pool.liquidity,
    status: derivePoolStatus(pool),
  };
}

export function filterPools(
  pools: DisplayPool[],
  options: { query: string; fee: string; hideEmpty: boolean },
): DisplayPool[] {
  const query = options.query.trim().toLowerCase();
  return pools.filter((pool) => {
    const pair = `${pool.token0.symbol} / ${pool.token1.symbol}`;
    const matchesQuery = query.length === 0 || `${pair} ${pool.index}`.toLowerCase().includes(query);
    const matchesFee = options.fee === "All fees" || `${(pool.fee / 10_000).toFixed(2)}%` === options.fee;
    const matchesEmpty = !options.hideEmpty || pool.liquidity > 0n;
    return matchesQuery && matchesFee && matchesEmpty;
  });
}
