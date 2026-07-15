import type { TOKENS } from "../config/tokens";
import type { SwapExecutionPayload } from "../lib/swapExecution";

export type TokenAddress = (typeof TOKENS)[number]["address"];

export type DrawerType = "create" | "liquidity" | "swap";

export type CreateDrawerState = {
  type: "create";
  tokenA: TokenAddress;
  tokenB: TokenAddress;
  feePercent: string;
  initialRate: string;
  minRate: string;
  maxRate: string;
};

export type LiquidityDrawerState = {
  type: "liquidity";
  amount0: string;
  amount1: string;
};

export type DrawerSubmitPayload = CreateDrawerState | LiquidityDrawerState | SwapExecutionPayload;

export type PositionSubmitPayload = {
  type: "position";
  positionId: string;
};

export type TransactionPayload = DrawerSubmitPayload | PositionSubmitPayload;
export type TransactionKind = "swap" | "mint" | "collect" | "burn" | "create";
export type RunTransaction = (kind: TransactionKind, payload?: TransactionPayload) => Promise<void>;
export type OpenDrawer = (drawer: DrawerType) => void;
