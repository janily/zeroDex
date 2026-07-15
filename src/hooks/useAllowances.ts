import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getReadContracts } from "../lib/contracts";
import { resolveMissingAllowances, type AllowanceCheck } from "../lib/allowance";
import type { Address } from "../types/domain";
import "../types/ethereum";

export function useAllowances(owner?: Address, checks: AllowanceCheck[] = [], enabled = false) {
  const [missing, setMissing] = useState<AllowanceCheck[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [ready, setReady] = useState(false);
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;
    if (!enabled || !owner || !window.ethereum || checks.length === 0) {
      setMissing([]);
      setLoading(false);
      setError(undefined);
      setReady(false);
      return;
    }

    setMissing([]);
    setLoading(true);
    setError(undefined);
    setReady(false);
    try {
      const contracts = getReadContracts(window.ethereum);
      const nextMissing = await resolveMissingAllowances(checks, async (token, spender) =>
          BigInt(await contracts.erc20(token).allowance(owner, spender)),
        );
      if (requestId.current !== currentRequest) return;
      setMissing(nextMissing);
      setReady(true);
    } catch (caught) {
      if (requestId.current !== currentRequest) return;
      setMissing([]);
      setError(caught instanceof Error ? caught.message : "Unable to read allowances");
    } finally {
      if (requestId.current !== currentRequest) return;
      setLoading(false);
    }
  }, [checks, enabled, owner]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return useMemo(() => ({ missing, loading, error, ready, refresh, next: missing[0] }), [error, loading, missing, ready, refresh]);
}
