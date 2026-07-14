import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TOKENS } from "../config/tokens";
import { getReadContracts } from "../lib/contracts";
import type { DisplayPool } from "../types/domain";
import { useSwapQuote } from "./useSwapQuote";

vi.mock("../lib/contracts", () => ({
  getReadContracts: vi.fn(),
}));

const pool = (index: number): DisplayPool => ({
  token0: TOKENS[0],
  token1: TOKENS[1],
  index,
  fee: 3000,
  tickLower: 1n,
  tickUpper: 10n,
  tick: 5n,
  sqrtPriceX96: 1n,
  liquidity: 100n,
  status: "Tradable",
});

describe("useSwapQuote", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.ethereum = {
      request: vi.fn(),
    };
  });

  it("does not requote when rerendered with unchanged inputs", async () => {
    const quoteExactInput = vi.fn(async () => 12n);
    vi.mocked(getReadContracts).mockReturnValue({
      swapRouter: {
        quoteExactInput: { staticCall: quoteExactInput },
      },
    } as unknown as ReturnType<typeof getReadContracts>);

    const { rerender } = renderHook(
      ({ amountIn }) =>
        useSwapQuote({
          enabled: true,
          pools: [pool(1)],
          tokenIn: TOKENS[0].address,
          tokenOut: TOKENS[1].address,
          mode: "exact-input",
          amountIn,
          account: TOKENS[0].address,
          slippageBps: 50n,
        }),
      { initialProps: { amountIn: 10n } },
    );

    await waitFor(() => expect(quoteExactInput).toHaveBeenCalledTimes(1));

    rerender({ amountIn: 10n });

    expect(quoteExactInput).toHaveBeenCalledTimes(1);
  });

  it("keeps successful candidate quotes when another pool reverts", async () => {
    const quoteExactInput = vi.fn(async ({ indexPath }: { indexPath: number[] }) => {
      if (indexPath[0] === 1) throw new Error("pool reverted");
      return 15n;
    });
    vi.mocked(getReadContracts).mockReturnValue({
      swapRouter: {
        quoteExactInput: { staticCall: quoteExactInput },
      },
    } as unknown as ReturnType<typeof getReadContracts>);

    const { result } = renderHook(() =>
      useSwapQuote({
        enabled: true,
        pools: [pool(1), pool(2)],
        tokenIn: TOKENS[0].address,
        tokenOut: TOKENS[1].address,
        mode: "exact-input",
        amountIn: 10n,
        account: TOKENS[0].address,
        slippageBps: 50n,
      }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.quote?.pool.index).toBe(2);
    expect(result.current.quote?.sqrtPriceLimitX96).toBeGreaterThan(0n);
    expect(result.current.error).toBeUndefined();
    expect(quoteExactInput).toHaveBeenCalledWith(
      expect.objectContaining({
        amountIn: 10n,
        indexPath: [2],
        tokenIn: TOKENS[0].address,
        tokenOut: TOKENS[1].address,
        sqrtPriceLimitX96: expect.any(BigInt),
      }),
    );
  });
});
