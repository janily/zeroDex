import { TOKENS } from "../config/tokens";
import { feeToPercent } from "./price";
import { parseTokenAmount } from "./amount";
import type { DisplayPool } from "../types/domain";
import type { Pool, Position, PositionStatus } from "../types/ui";

export function formatNumber(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function displayPoolToUiPool(pool: DisplayPool): Pool {
  const pair = `${pool.token0.symbol} / ${pool.token1.symbol}`;
  return {
    id: `${pool.token0.address.toLowerCase()}-${pool.token1.address.toLowerCase()}-${pool.index}`,
    index: pool.index,
    pair,
    token0: pool.token0.symbol,
    token1: pool.token1.symbol,
    fee: feeToPercent(pool.fee),
    price: `tick ${pool.tick.toString()}`,
    range: `${pool.tickLower.toString()} - ${pool.tickUpper.toString()} ticks`,
    liquidity: Number(pool.liquidity > BigInt(Number.MAX_SAFE_INTEGER) ? BigInt(Number.MAX_SAFE_INTEGER) : pool.liquidity),
    status: pool.status,
    volume: "chain",
  };
}

export function tokenSymbol(address: string) {
  return TOKENS.find((token) => token.address.toLowerCase() === address.toLowerCase())?.symbol ?? "Token";
}

export function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function safeParseSwapAmount(value: string, tokenAddress: string) {
  try {
    const token = TOKENS.find((item) => item.address.toLowerCase() === tokenAddress.toLowerCase());
    return parseTokenAmount(value, token?.decimals ?? 18);
  } catch {
    return 0n;
  }
}

export function positionDetailsToUiPosition(position: { id: string; raw: unknown }): Position {
  const raw = position.raw as Record<string, unknown>;
  const liquidity = BigInt((raw.liquidity as bigint | string | number | undefined) ?? 0);
  const owed0 = BigInt((raw.tokensOwed0 as bigint | string | number | undefined) ?? 0);
  const owed1 = BigInt((raw.tokensOwed1 as bigint | string | number | undefined) ?? 0);
  const status: PositionStatus = owed0 > 0n || owed1 > 0n ? "Collectable" : liquidity > 0n ? "Active" : "Closed";
  return {
    id: `#${position.id}`,
    pair: "PositionManager NFT",
    poolIndex: Number((raw.index as bigint | string | number | undefined) ?? 0),
    range: `${String(raw.tickLower ?? "-")} - ${String(raw.tickUpper ?? "-")}`,
    liquidity: liquidity.toString(),
    owed0: owed0.toString(),
    owed1: owed1.toString(),
    status,
  };
}
