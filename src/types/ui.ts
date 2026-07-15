export type Page = "swap" | "pools" | "positions" | "activity";

export type PositionStatus = "Active" | "Collectable" | "Closed";

export type Pool = {
  id: string;
  index: number;
  pair: string;
  token0: string;
  token1: string;
  fee: string;
  price: string;
  range: string;
  liquidity: number;
  status: "Tradable" | "No liquidity" | "At boundary";
  volume: string;
};

export type Position = {
  id: string;
  owner?: string;
  pair: string;
  poolIndex: number;
  range: string;
  liquidity: string;
  owed0: string;
  owed1: string;
  status: PositionStatus;
};
