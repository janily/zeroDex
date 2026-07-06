import { useCallback, useEffect, useMemo, useState } from "react";
import { TOKENS } from "../config/tokens";
import { getReadContracts } from "../lib/contracts";
import { normalizePool } from "../lib/pool";
import type { Address, DisplayPool, PoolInfo } from "../types/domain";
import "../types/ethereum";

type TokenBalance = {
  token: Address;
  value: bigint;
};

export type DexDataState = {
  pools: DisplayPool[];
  balances: TokenBalance[];
  loading: boolean;
  error?: string;
  refresh(): Promise<void>;
};

function toPoolInfo(raw: Record<string, unknown>): PoolInfo {
  return {
    token0: raw.token0 as Address,
    token1: raw.token1 as Address,
    index: BigInt(raw.index as bigint | number | string),
    fee: BigInt(raw.fee as bigint | number | string),
    tickLower: BigInt(raw.tickLower as bigint | number | string),
    tickUpper: BigInt(raw.tickUpper as bigint | number | string),
    tick: BigInt(raw.tick as bigint | number | string),
    sqrtPriceX96: BigInt(raw.sqrtPriceX96 as bigint | number | string),
    liquidity: BigInt(raw.liquidity as bigint | number | string),
  };
}

export function useDexData(account?: Address, enabled = false): DexDataState {
  const [pools, setPools] = useState<DisplayPool[]>([]);
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const refresh = useCallback(async () => {
    if (!enabled || !window.ethereum) {
      setPools([]);
      setBalances([]);
      setLoading(false);
      setError(undefined);
      return;
    }

    setLoading(true);
    setError(undefined);
    try {
      const contracts = getReadContracts(window.ethereum);
      const rawPools = (await contracts.poolManager.getAllPools()) as Record<string, unknown>[];
      const normalizedPools = rawPools.map((pool) => normalizePool(toPoolInfo(pool))).filter((pool): pool is DisplayPool => Boolean(pool));
      setPools(normalizedPools);

      if (account) {
        const nextBalances = await Promise.all(
          TOKENS.map(async (token) => ({
            token: token.address,
            value: BigInt(await contracts.erc20(token.address).balanceOf(account)),
          })),
        );
        setBalances(nextBalances);
      } else {
        setBalances([]);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load chain data");
    } finally {
      setLoading(false);
    }
  }, [account, enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return useMemo(() => ({ pools, balances, loading, error, refresh }), [balances, error, loading, pools, refresh]);
}
