import type { Address, DisplayPool, SwapMode } from "../types/domain";

export type QuoteResult = {
  pool: DisplayPool;
  amountIn: bigint;
  amountOut: bigint;
};

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
