import { useCallback, useEffect, useMemo, useState } from "react";
import { getReadContracts } from "../lib/contracts";
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
  const [quote, setQuote] = useState<QuoteResult | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const candidates = useMemo(() => {
    if (!input.tokenIn || !input.tokenOut) return [];
    return getCandidatePools(input.pools, input.tokenIn, input.tokenOut);
  }, [input.pools, input.tokenIn, input.tokenOut]);

  const refresh = useCallback(async () => {
    if (!input.enabled || !window.ethereum || !input.tokenIn || !input.tokenOut || candidates.length === 0) {
      setQuote(undefined);
      setError(undefined);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(undefined);
    try {
      const contracts = getReadContracts(window.ethereum);
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 20 * 60);
      const recipient = input.account ?? "0x0000000000000000000000000000000000000000";
      const quotes = await Promise.all(
        candidates.map(async (pool) => {
          const indexPath = [BigInt(pool.index)];
          if (input.mode === "exact-input") {
            const amountIn = input.amountIn ?? 0n;
            const amountOutMinimum = 0n;
            const amountOut = BigInt(
              await contracts.swapRouter.quoteExactInput.staticCall({
                tokenIn: input.tokenIn,
                tokenOut: input.tokenOut,
                indexPath,
                recipient,
                deadline,
                amountIn,
                amountOutMinimum,
                sqrtPriceLimitX96: 0n,
              }),
            );
            return { pool, amountIn, amountOut };
          }

          const amountOut = input.amountOut ?? 0n;
          const amountInMaximum = (amountOut * (10_000n + input.slippageBps)) / 10_000n;
          const amountIn = BigInt(
            await contracts.swapRouter.quoteExactOutput.staticCall({
              tokenIn: input.tokenIn,
              tokenOut: input.tokenOut,
              indexPath,
              recipient,
              deadline,
              amountOut,
              amountInMaximum,
              sqrtPriceLimitX96: 0n,
            }),
          );
          return { pool, amountIn, amountOut };
        }),
      );
      setQuote(selectBestQuote(input.mode, quotes));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to quote swap");
    } finally {
      setLoading(false);
    }
  }, [candidates, input]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return useMemo(() => ({ quote, candidates, loading, error, refresh }), [candidates, error, loading, quote, refresh]);
}
