import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TOKENS } from "../config/tokens";
import { getReadContracts } from "../lib/contracts";
import { normalizePool } from "../lib/pool";
import type { Address, DisplayPool, PoolInfo } from "../types/domain";
import "../types/ethereum";

export type TokenBalance = {
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
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;
    if (!enabled || !window.ethereum) {
      setPools([]);
      setBalances([]);
      setLoading(false);
      setError(undefined);
      return;
    }

    setLoading(true);
    setError(undefined);
    setPools([]);
    setBalances([]);
    try {
      const contracts = getReadContracts(window.ethereum);
      const rawPools = (await contracts.poolManager.getAllPools()) as Record<string, unknown>[];
      const normalizedPools = rawPools.map((pool) => normalizePool(toPoolInfo(pool))).filter((pool): pool is DisplayPool => Boolean(pool));
      if (requestId.current !== currentRequest) return;
      setPools(normalizedPools);

      if (account) {
        const settledBalances = await Promise.allSettled(
          TOKENS.map(async (token) => ({
            token: token.address,
            value: BigInt(await contracts.erc20(token.address).balanceOf(account)),
          })),
        );
        if (requestId.current !== currentRequest) return;
        const nextBalances: TokenBalance[] = [];
        for (const result of settledBalances) {
          if (result.status === "fulfilled") nextBalances.push(result.value);
        }
        setBalances(nextBalances);
        if (nextBalances.length !== TOKENS.length) {
          setError(`Unable to read ${TOKENS.length - nextBalances.length} token balance(s)`);
        }
      } else {
        setBalances([]);
      }
    } catch (caught) {
      if (requestId.current !== currentRequest) return;
      setPools([]);
      setBalances([]);
      setError(caught instanceof Error ? caught.message : "Unable to load chain data");
    } finally {
      if (requestId.current !== currentRequest) return;
      setLoading(false);
    }
  }, [account, enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return useMemo(() => ({ pools, balances, loading, error, refresh }), [balances, error, loading, pools, refresh]);
}
