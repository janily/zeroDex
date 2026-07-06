export type Address = `0x${string}`;

export type TokenConfig = {
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
  mintUrl: string;
};

export type PoolInfo = {
  token0: Address;
  token1: Address;
  index: bigint;
  fee: bigint;
  tickLower: bigint;
  tickUpper: bigint;
  tick: bigint;
  sqrtPriceX96: bigint;
  liquidity: bigint;
};

export type PoolStatus = "Tradable" | "No liquidity" | "At boundary";

export type DisplayPool = {
  token0: TokenConfig;
  token1: TokenConfig;
  index: number;
  fee: number;
  tickLower: bigint;
  tickUpper: bigint;
  tick: bigint;
  sqrtPriceX96: bigint;
  liquidity: bigint;
  status: PoolStatus;
};

export type SwapMode = "exact-input" | "exact-output";

export type TransactionStage =
  | "idle"
  | "waiting-signature"
  | "submitted"
  | "confirming"
  | "success"
  | "rejected"
  | "error";
