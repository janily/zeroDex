import type { Address, DisplayPool, SwapMode } from "../types/domain";

export type QuoteResult = {
  pool: DisplayPool;
  pools: DisplayPool[];
  indexPath: number[];
  amountIn: bigint;
  amountOut: bigint;
  sqrtPriceLimitX96: bigint;
};

export function getCandidateRoutes(candidates: DisplayPool[]): DisplayPool[][] {
  if (candidates.length <= 1) return candidates.map((pool) => [pool]);
  const byLiquidity = [...candidates].sort((a, b) => (a.liquidity === b.liquidity ? a.index - b.index : a.liquidity > b.liquidity ? -1 : 1));
  return [
    ...candidates.map((pool) => [pool]),
    ...candidates.map((first) => [first, ...byLiquidity.filter((pool) => pool.index !== first.index)]),
  ];
}

export function isSamePair(pool: DisplayPool, tokenIn: Address, tokenOut: Address): boolean {
  const selected = [tokenIn.toLowerCase(), tokenOut.toLowerCase()].sort();
  const poolPair = [pool.token0.address.toLowerCase(), pool.token1.address.toLowerCase()].sort();
  return selected[0] === poolPair[0] && selected[1] === poolPair[1];
}

export function getCandidatePools(pools: DisplayPool[], tokenIn: Address, tokenOut: Address): DisplayPool[] {
  return pools.filter((pool) => isSamePair(pool, tokenIn, tokenOut) && pool.status === "Tradable" && pool.liquidity > 0n);
}

export function selectBestQuote(mode: SwapMode, quotes: QuoteResult[]): QuoteResult | undefined {
  if (quotes.length === 0) return undefined;
  return quotes.reduce((best, quote) => {
    if (mode === "exact-input") {
      return quote.amountOut > best.amountOut ? quote : best;
    }
    return quote.amountIn < best.amountIn ? quote : best;
  });
}
