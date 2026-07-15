import type { Address, SwapMode } from "../types/domain";
import type { QuoteResult } from "./routing";

export type ExactInputSwapPayload = {
  type: "swap";
  mode: "exact-input";
  tokenIn: Address;
  tokenOut: Address;
  poolIndices: number[];
  amountIn: bigint;
  amountOutMinimum: bigint;
  sqrtPriceLimitX96: bigint;
};

export type ExactOutputSwapPayload = {
  type: "swap";
  mode: "exact-output";
  tokenIn: Address;
  tokenOut: Address;
  poolIndices: number[];
  amountOut: bigint;
  amountInMaximum: bigint;
  sqrtPriceLimitX96: bigint;
};

export type SwapExecutionPayload = ExactInputSwapPayload | ExactOutputSwapPayload;

export type SwapExecutionInput = {
  mode: SwapMode;
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  amountOut: bigint;
  quote?: QuoteResult;
  slippageBps: bigint;
};

export function buildSwapExecution(input: SwapExecutionInput): SwapExecutionPayload | undefined {
  if (!input.quote) return undefined;

  if (input.mode === "exact-input") {
    return {
      type: "swap",
      mode: "exact-input",
      tokenIn: input.tokenIn,
      tokenOut: input.tokenOut,
      poolIndices: input.quote.indexPath,
      amountIn: input.amountIn,
      amountOutMinimum: applyNegativeSlippage(input.quote.amountOut, input.slippageBps),
      sqrtPriceLimitX96: input.quote.sqrtPriceLimitX96,
    };
  }

  return {
    type: "swap",
    mode: "exact-output",
    tokenIn: input.tokenIn,
    tokenOut: input.tokenOut,
    poolIndices: input.quote.indexPath,
    amountOut: input.amountOut,
    amountInMaximum: applyPositiveSlippage(input.quote.amountIn, input.slippageBps),
    sqrtPriceLimitX96: input.quote.sqrtPriceLimitX96,
  };
}

function applyNegativeSlippage(value: bigint, slippageBps: bigint): bigint {
  return (value * (10_000n - slippageBps)) / 10_000n;
}

function applyPositiveSlippage(value: bigint, slippageBps: bigint): bigint {
  const numerator = value * (10_000n + slippageBps);
  return (numerator + 9_999n) / 10_000n;
}
