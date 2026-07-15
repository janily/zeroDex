import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getReadContracts } from "../lib/contracts";
import { fetchPositionIdsFromZan } from "../services/zan";
import type { Address } from "../types/domain";
import "../types/ethereum";

export type PositionDetails = {
  id: string;
  owner: Address;
  raw: unknown;
};

export function usePositions(account?: Address, enabled = false) {
  const [positions, setPositions] = useState<PositionDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const requestId = useRef(0);

  const loadPositionIds = useCallback(async () => {
    if (!account) return [];
    const endpoint = import.meta.env.VITE_ZAN_NFT_ENDPOINT as string | undefined;
    if (!endpoint) return [];
    return fetchPositionIdsFromZan({ owner: account, endpoint });
  }, [account]);

  const fetchManualPosition = useCallback(async (positionId: string) => {
    if (!/^\d+$/.test(positionId.trim())) throw new Error("Position ID must be a non-negative integer");
    if (!window.ethereum) throw new Error("MetaMask is not installed");
    const contracts = getReadContracts(window.ethereum);
    const normalizedId = BigInt(positionId.trim()).toString();
    const [raw, ownerValue] = await Promise.all([
      contracts.positionManager.getPositionInfo(normalizedId),
      contracts.positionManager.ownerOf(normalizedId),
    ]);
    const owner = String(ownerValue) as Address;
    if (account && owner.toLowerCase() !== account.toLowerCase()) {
      throw new Error("Position is not owned by the connected account");
    }
    return { id: normalizedId, owner, raw };
  }, [account]);

  const refresh = useCallback(async () => {
    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;
    if (!enabled || !window.ethereum) {
      setPositions([]);
      setLoading(false);
      setError(undefined);
      return;
    }
    setLoading(true);
    setError(undefined);
    setPositions([]);
    try {
      const ids = await loadPositionIds();
      const settled = await Promise.allSettled(ids.map((id) => fetchManualPosition(id)));
      if (requestId.current !== currentRequest) return;
      const next = settled.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
      const failedCount = settled.length - next.length;
      setPositions(next);
      if (failedCount > 0) {
        setError(
          next.length > 0
            ? `${failedCount} indexed position${failedCount === 1 ? "" : "s"} could not be read and were skipped`
            : "Indexed positions are not currently readable on-chain",
        );
      }
    } catch (caught) {
      if (requestId.current !== currentRequest) return;
      setPositions([]);
      setError(caught instanceof Error ? caught.message : "Unable to load positions");
    } finally {
      if (requestId.current !== currentRequest) return;
      setLoading(false);
    }
  }, [enabled, fetchManualPosition, loadPositionIds]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return useMemo(
    () => ({ positions, loading, error, refresh, fetchManualPosition }),
    [error, fetchManualPosition, loading, positions, refresh],
  );
}
