import { CONTRACTS } from "../config/contracts";
import type { Address } from "../types/domain";

export type AllowanceCheck = {
  token: Address;
  spender: Address;
  required: bigint;
};

export function getSwapAllowancePlan(input: {
  tokenIn: Address;
  mode: "exact-input" | "exact-output";
  amountIn: bigint;
  amountInMaximum: bigint;
}): AllowanceCheck {
  return {
    token: input.tokenIn,
    spender: CONTRACTS.swapRouter,
    required: input.mode === "exact-input" ? input.amountIn : input.amountInMaximum,
  };
}

export function getMintAllowancePlan(input: {
  token0: Address;
  token1: Address;
  amount0Desired: bigint;
  amount1Desired: bigint;
}): AllowanceCheck[] {
  return [
    { token: input.token0, spender: CONTRACTS.positionManager, required: input.amount0Desired },
    { token: input.token1, spender: CONTRACTS.positionManager, required: input.amount1Desired },
  ];
}

export function findMissingAllowances(
  checks: AllowanceCheck[],
  allowanceOf: (token: Address, spender: Address) => bigint,
): AllowanceCheck[] {
  return checks.filter((check) => allowanceOf(check.token, check.spender) < check.required);
}
