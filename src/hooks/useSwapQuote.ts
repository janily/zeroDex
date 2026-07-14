import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getReadContracts } from "../lib/contracts";
import { getSwapPriceLimit } from "../lib/price";
import { getCandidatePools, selectBestQuote, type QuoteResult } from "../lib/routing";
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
  account?: Address;
  slippageBps: bigint;
}): SwapQuoteState {
  const { enabled, pools, tokenIn, tokenOut, mode, amountIn, amountOut, account, slippageBps } = input;
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

    if (!enabled || !window.ethereum || !tokenIn || !tokenOut || candidates.length === 0) {
      setQuote(undefined);
      setError(undefined);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(undefined);
    try {
      const contracts = getReadContracts(window.ethereum);
      const settledQuotes = await Promise.allSettled(
        candidates.map(async (pool) => {
          const indexPath = [pool.index];
          const sqrtPriceLimitX96 = getSwapPriceLimit(pool, tokenIn);
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
            return { pool, amountIn: quotedAmountIn, amountOut: quotedAmountOut, sqrtPriceLimitX96 };
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
          return { pool, amountIn: quotedAmountIn, amountOut: quotedAmountOut, sqrtPriceLimitX96 };
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
    void refresh();
  }, [refresh]);

  return useMemo(() => ({ quote, candidates, loading, error, refresh }), [candidates, error, loading, quote, refresh]);
}
