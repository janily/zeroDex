import { useCallback, useEffect, useMemo, useState } from "react";
import { getReadContracts } from "../lib/contracts";
import { resolveMissingAllowances, type AllowanceCheck } from "../lib/allowance";
import type { Address } from "../types/domain";
import "../types/ethereum";

export function useAllowances(owner?: Address, checks: AllowanceCheck[] = [], enabled = false) {
  const [missing, setMissing] = useState<AllowanceCheck[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const refresh = useCallback(async () => {
    if (!enabled || !owner || !window.ethereum || checks.length === 0) {
      setMissing([]);
      setLoading(false);
      setError(undefined);
      return;
    }

    setLoading(true);
    setError(undefined);
    try {
      const contracts = getReadContracts(window.ethereum);
      setMissing(
        await resolveMissingAllowances(checks, async (token, spender) =>
          BigInt(await contracts.erc20(token).allowance(owner, spender)),
        ),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to read allowances");
    } finally {
      setLoading(false);
    }
  }, [checks, enabled, owner]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return useMemo(() => ({ missing, loading, error, refresh, next: missing[0] }), [error, loading, missing, refresh]);
}
