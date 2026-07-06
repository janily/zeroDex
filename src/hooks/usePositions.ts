import { useCallback, useEffect, useMemo, useState } from "react";
import { getReadContracts } from "../lib/contracts";
import { fetchPositionIdsFromZan } from "../services/zan";
import type { Address } from "../types/domain";
import "../types/ethereum";

export type PositionDetails = {
  id: string;
  raw: unknown;
};

export function usePositions(account?: Address, enabled = false) {
  const [positions, setPositions] = useState<PositionDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const loadPositionIds = useCallback(async () => {
    if (!account) return [];
    const endpoint = import.meta.env.VITE_ZAN_NFT_ENDPOINT as string | undefined;
    const apiKey = import.meta.env.VITE_ZAN_API_KEY as string | undefined;
    if (!endpoint) return [];
    return fetchPositionIdsFromZan({ owner: account, endpoint, apiKey });
  }, [account]);

  const fetchManualPosition = useCallback(async (positionId: string) => {
    if (!window.ethereum) throw new Error("MetaMask is not installed");
    const contracts = getReadContracts(window.ethereum);
    const raw = await contracts.positionManager.getPositionInfo(positionId);
    return { id: positionId, raw };
  }, []);

  const refresh = useCallback(async () => {
    if (!enabled || !window.ethereum) {
      setPositions([]);
      setError(undefined);
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const ids = await loadPositionIds();
      const next = await Promise.all(ids.map((id) => fetchManualPosition(id)));
      setPositions(next);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load positions");
    } finally {
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
