import type { Address } from "../types/domain";
import { sortTokenAddresses } from "./price";

export type CreatePoolInput = {
  tokenA: Address;
  tokenB: Address;
  feePercent: string;
  initialRate: string;
  minRate: string;
  maxRate: string;
};

export type CreatePoolParams = {
  token0: Address;
  token1: Address;
  fee: number;
  tickLower: number;
  tickUpper: number;
  sqrtPriceX96: bigint;
};

export function parsePositiveRate(value: string, label: string): number {
  const rate = Number(value.trim());
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error(`${label} must be a positive number`);
  }
  return rate;
}

export function feePercentToUnits(value: string): number {
  const normalized = value.trim().replace("%", "");
  const percent = Number(normalized);
  if (!Number.isFinite(percent) || percent <= 0) {
    throw new Error("Fee must be a positive percent");
  }
  return Math.round(percent * 10_000);
}

export function priceToTick(price: number): number {
  return Math.floor(Math.log(price) / Math.log(1.0001));
}

export function priceToSqrtPriceX96(price: number): bigint {
  const sqrt = Math.sqrt(price);
  const scaled = sqrt * 2 ** 96;
  if (!Number.isFinite(scaled) || scaled <= 0) {
    throw new Error("Price is outside supported range");
  }
  return BigInt(Math.floor(scaled));
}

export function buildCreatePoolParams(input: CreatePoolInput): CreatePoolParams {
  if (input.tokenA.toLowerCase() === input.tokenB.toLowerCase()) {
    throw new Error("Token pair must use two different tokens");
  }

  const minRate = parsePositiveRate(input.minRate, "Minimum rate");
  const initialRate = parsePositiveRate(input.initialRate, "Initial rate");
  const maxRate = parsePositiveRate(input.maxRate, "Maximum rate");
  if (!(minRate < initialRate && initialRate < maxRate)) {
    throw new Error("Rates must satisfy minimum < initial < maximum");
  }

  const [token0, token1] = sortTokenAddresses(input.tokenA, input.tokenB);
  return {
    token0,
    token1,
    fee: feePercentToUnits(input.feePercent),
    tickLower: priceToTick(minRate),
    tickUpper: priceToTick(maxRate),
    sqrtPriceX96: priceToSqrtPriceX96(initialRate),
  };
}
