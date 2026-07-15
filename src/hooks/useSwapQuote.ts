import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getReadContracts } from "../lib/contracts";
import { getSwapPriceLimitForPools } from "../lib/price";
import { getCandidatePools, getCandidateRoutes, selectBestQuote, type QuoteResult } from "../lib/routing";
import type { Address, DisplayPool, SwapMode } from "../types/domain";
import "../types/ethereum";

export type SwapQuoteState = {
  quote?: QuoteResult;
  candidates: DisplayPool[];
  loading: boolean;
  error?: string;
  refresh(): Promise<void>;
};

export function useSwapQuote(input: {
  enabled: boolean;
  pools: DisplayPool[];
  tokenIn?: Address;
  tokenOut?: Address;
  mode: SwapMode;
  amountIn?: bigint;
  amountOut?: bigint;
}): SwapQuoteState {
  const { enabled, pools, tokenIn, tokenOut, mode, amountIn, amountOut } = input;
  const [quote, setQuote] = useState<QuoteResult | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const requestId = useRef(0);
  const poolsKey = pools
    .map((pool) =>
      [
        pool.index,
        pool.token0.address.toLowerCase(),
        pool.token1.address.toLowerCase(),
        pool.status,
        pool.fee,
        pool.tickLower.toString(),
        pool.tickUpper.toString(),
        pool.tick.toString(),
        pool.sqrtPriceX96.toString(),
        pool.liquidity.toString(),
      ].join(":"),
    )
    .join("|");

  const candidates = useMemo(() => {
    if (!tokenIn || !tokenOut) return [];
    return getCandidatePools(pools, tokenIn, tokenOut);
  }, [poolsKey, tokenIn, tokenOut]);

  const refresh = useCallback(async () => {
    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;
    const quoteAmount = mode === "exact-input" ? amountIn : amountOut;

    if (!enabled || !window.ethereum || !tokenIn || !tokenOut || candidates.length === 0 || quoteAmount === undefined || quoteAmount <= 0n) {
      setQuote(undefined);
      setError(undefined);
      setLoading(false);
      return;
    }

    setQuote(undefined);
    setLoading(true);
    setError(undefined);
    try {
      const contracts = getReadContracts(window.ethereum);
      const routes = getCandidateRoutes(candidates)
        .map((pools) => ({ pools, sqrtPriceLimitX96: getSwapPriceLimitForPools(pools, tokenIn) }))
        .filter((route): route is { pools: DisplayPool[]; sqrtPriceLimitX96: bigint } => route.sqrtPriceLimitX96 !== undefined);
      const settledQuotes = await Promise.allSettled(
        routes.map(async ({ pools: routePools, sqrtPriceLimitX96 }) => {
          const pool = routePools[0];
          const indexPath = routePools.map((candidate) => candidate.index);
          if (mode === "exact-input") {
            const quotedAmountIn = amountIn ?? 0n;
            const quotedAmountOut = BigInt(
              await contracts.swapRouter.quoteExactInput.staticCall({
                tokenIn,
                tokenOut,
                indexPath,
                amountIn: quotedAmountIn,
                sqrtPriceLimitX96,
              }),
            );
            return { pool, pools: routePools, indexPath, amountIn: quotedAmountIn, amountOut: quotedAmountOut, sqrtPriceLimitX96 };
          }

          const quotedAmountOut = amountOut ?? 0n;
          const quotedAmountIn = BigInt(
            await contracts.swapRouter.quoteExactOutput.staticCall({
              tokenIn,
              tokenOut,
              indexPath,
              amountOut: quotedAmountOut,
              sqrtPriceLimitX96,
            }),
          );
          return { pool, pools: routePools, indexPath, amountIn: quotedAmountIn, amountOut: quotedAmountOut, sqrtPriceLimitX96 };
        }),
      );

      if (requestId.current !== currentRequest) return;

      const quotes = settledQuotes
        .filter((result): result is PromiseFulfilledResult<QuoteResult> => result.status === "fulfilled")
        .map((result) => result.value);
      const bestQuote = selectBestQuote(mode, quotes);
      setQuote(bestQuote);
      setError(bestQuote ? undefined : "No route quoted successfully");
    } catch (caught) {
      if (requestId.current !== currentRequest) return;
      setError(caught instanceof Error ? caught.message : "Unable to quote swap");
    } finally {
      if (requestId.current !== currentRequest) return;
      setLoading(false);
    }
  }, [amountIn, amountOut, candidates, enabled, mode, tokenIn, tokenOut]);

  useEffect(() => {
    const quoteAmount = mode === "exact-input" ? amountIn : amountOut;
    const canQuote =
      enabled &&
      Boolean(window.ethereum && tokenIn && tokenOut && candidates.length > 0 && quoteAmount !== undefined && quoteAmount > 0n);
    if (!canQuote) {
      void refresh();
      return;
    }

    requestId.current += 1;
    setQuote(undefined);
    setError(undefined);
    setLoading(true);
    const timeout = window.setTimeout(() => void refresh(), 200);
    return () => window.clearTimeout(timeout);
  }, [amountIn, amountOut, candidates.length, enabled, mode, refresh, tokenIn, tokenOut]);

  return useMemo(() => ({ quote, candidates, loading, error, refresh }), [candidates, error, loading, quote, refresh]);
}
