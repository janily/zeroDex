import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TOKENS } from "../config/tokens";
import { displayPoolToUiPool } from "../lib/uiFormat";
import type { DisplayPool } from "../types/domain";
import { Drawer } from "./Drawer";

const mocks = vi.hoisted(() => ({ useAllowances: vi.fn() }));

vi.mock("../hooks/useAllowances", () => ({ useAllowances: mocks.useAllowances }));

const displayPool: DisplayPool = {
  token0: TOKENS[0],
  token1: TOKENS[1],
  index: 17,
  fee: 3000,
  tickLower: -100n,
  tickUpper: 100n,
  tick: 0n,
  sqrtPriceX96: 1n,
  liquidity: 100n,
  status: "Tradable",
};

function renderDrawer(overrides: Partial<React.ComponentProps<typeof Drawer>> = {}) {
  const props: React.ComponentProps<typeof Drawer> = {
    type: "swap",
    onClose: vi.fn(),
    selectedPool: displayPoolToUiPool(displayPool),
    selectedDisplayPool: displayPool,
    txStage: "idle",
    transactionPending: false,
    tokenBalances: [{ token: TOKENS[0].address, value: 100n }],
    chainDataLoading: false,
    approveToken: vi.fn(async () => true),
    resetTransaction: vi.fn(),
    walletAccount: TOKENS[2].address,
    swapExecution: {
      type: "swap",
      mode: "exact-input",
      tokenIn: TOKENS[0].address,
      tokenOut: TOKENS[1].address,
      poolIndices: [17],
      amountIn: 10n,
      amountOutMinimum: 9n,
      sqrtPriceLimitX96: 1n,
    },
    swapHasInputBalance: true,
    swapInputBalanceKnown: true,
    runTransaction: vi.fn(async () => undefined),
    isReady: true,
    ...overrides,
  };
  render(<Drawer {...props} />);
  return props;
}

describe("Drawer transaction actions", () => {
  beforeEach(() => {
    mocks.useAllowances.mockReturnValue({
      missing: [],
      loading: false,
      error: undefined,
      ready: true,
      refresh: vi.fn(async () => undefined),
      next: undefined,
    });
  });

  it("closes after a completed write instead of submitting it again", async () => {
    const props = renderDrawer({ txStage: "success" });

    await userEvent.click(screen.getByRole("button", { name: "Close review" }));

    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.runTransaction).not.toHaveBeenCalled();
  });

  it("refreshes allowances and resets approval state before exposing the write action", async () => {
    const refresh = vi.fn(async () => undefined);
    mocks.useAllowances.mockReturnValue({
      missing: [],
      loading: false,
      error: undefined,
      ready: true,
      refresh,
      next: { token: TOKENS[0].address, spender: TOKENS[3].address, required: 10n },
    });
    const props = renderDrawer();

    await userEvent.click(screen.getByRole("button", { name: "Approve MNTA" }));

    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    expect(props.resetTransaction).toHaveBeenCalledTimes(1);
    expect(props.runTransaction).not.toHaveBeenCalled();
  });
});
