import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getReadContracts, getSigner } from "../lib/contracts";
import { fetchPositionIdsFromZan } from "../services/zan";
import type { Address } from "../types/domain";
import "../types/ethereum";

export type PositionDetails = {
  id: string;
  owner: Address;
  raw: unknown;
};

export function normalizePositionLookupError(caught: unknown, positionId: string) {
  if (caught instanceof Error && caught.message === "Position is not owned by the connected account") {
    return caught.message;
  }

  const message = caught instanceof Error ? caught.message : String(caught ?? "");
  if (/CALL_EXCEPTION|execution reverted|missing revert data|revert/i.test(message)) {
    return `Position ${positionId} could not be read from PositionManager. Check that the ID exists on Sepolia and belongs to the connected wallet.`;
  }

  return message || `Unable to query position ${positionId}`;
}

export function usePositions(account?: Address, enabled = false) {
  const [positions, setPositions] = useState<PositionDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const requestId = useRef(0);

  const loadPositionIds = useCallback(async () => {
    if (!account) return [];
    const endpoint = import.meta.env.VITE_ZAN_NFT_ENDPOINT as string | undefined;
    if (!endpoint) {
      throw new Error("NFT indexer is not configured. Mint a position or enter a known positionId manually.");
    }
    const apiKey = import.meta.env.VITE_ZAN_API_KEY as string | undefined;
    return fetchPositionIdsFromZan({ owner: account, endpoint, apiKey });
  }, [account]);

  const fetchManualPosition = useCallback(async (positionId: string) => {
    if (!/^\d+$/.test(positionId.trim())) throw new Error("Position ID must be a non-negative integer");
    if (!window.ethereum) throw new Error("MetaMask is not installed");
    const contracts = getReadContracts(window.ethereum);
    const signer = await getSigner(window.ethereum);
    const positionManager = contracts.positionManager.connect(signer) as typeof contracts.positionManager;
    const normalizedId = BigInt(positionId.trim()).toString();
    try {
      const [raw, ownerValue] = await Promise.all([
        positionManager.getPositionInfo(normalizedId),
        positionManager.ownerOf(normalizedId),
      ]);
      const owner = String(ownerValue) as Address;
      if (account && owner.toLowerCase() !== account.toLowerCase()) {
        throw new Error("Position is not owned by the connected account");
      }
      return { id: normalizedId, owner, raw };
    } catch (caught) {
      throw new Error(normalizePositionLookupError(caught, normalizedId));
    }
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
