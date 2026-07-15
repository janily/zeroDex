import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TOKENS } from "../config/tokens";
import type { SwapQuoteState } from "../hooks/useSwapQuote";
import type { DisplayPool } from "../types/domain";
import { SwapPage } from "./SwapPage";

function pool(index: number): DisplayPool {
  return {
    token0: TOKENS[0],
    token1: TOKENS[1],
    index,
    fee: 3000,
    tickLower: -100n,
    tickUpper: 100n,
    tick: 0n,
    sqrtPriceX96: 1n,
    liquidity: 100n,
    status: "Tradable",
  };
}

function renderSwapPage(overrides: Partial<React.ComponentProps<typeof SwapPage>> = {}) {
  const bestPool = pool(17);
  const quote: SwapQuoteState = {
    quote: { pool: bestPool, pools: [bestPool], indexPath: [17], amountIn: 10n, amountOut: 12n, sqrtPriceLimitX96: 1n },
    candidates: [pool(1), bestPool],
    loading: false,
    refresh: vi.fn(async () => undefined),
  };
  const props: React.ComponentProps<typeof SwapPage> = {
    swapMode: "input",
    setSwapMode: vi.fn(),
    swapIn: "10",
    swapOut: "12",
    setSwapIn: vi.fn(),
    setSwapOut: vi.fn(),
    tokenIn: TOKENS[0].address,
    tokenOut: TOKENS[1].address,
    setTokenIn: vi.fn(),
    setTokenOut: vi.fn(),
    quote,
    openDrawer: vi.fn(),
    isReady: true,
    canReview: true,
    payBalanceLabel: "Balance 100",
    receiveBalanceLabel: "Balance 50",
    ...overrides,
  };
  render(<SwapPage {...props} />);
  return props;
}

describe("SwapPage", () => {
  it("shows the exact-input quote in a read-only receive field and marks the actual best route", () => {
    renderSwapPage();

    expect(screen.getByRole("textbox", { name: /Pay MNTA/ })).not.toHaveAttribute("readonly");
    expect(screen.getByRole("textbox", { name: /Receive MNTB/ })).toHaveValue("12");
    expect(screen.getByRole("textbox", { name: /Receive MNTB/ })).toHaveAttribute("readonly");
    expect(screen.getByText("MNTA / MNTB #17").closest(".candidate")).toHaveTextContent("best path");
    expect(screen.getByText("MNTA / MNTB #1").closest(".candidate")).toHaveTextContent("candidate");
  });

  it("opens swap review when a valid quote is available", async () => {
    const props = renderSwapPage();

    await userEvent.click(screen.getByRole("button", { name: "Review swap" }));

    expect(props.openDrawer).toHaveBeenCalledWith("swap");
  });

  it("updates the editable pay amount", async () => {
    const props = renderSwapPage();

    fireEvent.change(screen.getByRole("textbox", { name: /Pay MNTA/ }), { target: { value: "310" } });

    expect(props.setSwapIn).toHaveBeenLastCalledWith("310");
  });

  it("explains why review is disabled", () => {
    renderSwapPage({ canReview: false, reviewDisabledReason: "A valid quote is required before review." });

    expect(screen.getByRole("button", { name: "Review swap" })).toBeDisabled();
    expect(screen.getByText("A valid quote is required before review.")).toBeVisible();
  });
});
