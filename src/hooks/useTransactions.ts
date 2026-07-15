import { useCallback, useMemo, useRef, useState } from "react";
import { getWriteContracts } from "../lib/contracts";
import type { Address, TransactionStage } from "../types/domain";
import "../types/ethereum";

export type TransactionState = {
  stage: TransactionStage;
  hash?: string;
  error?: string;
  syncError?: string;
};

const idleState: TransactionState = { stage: "idle" };

function normalizeTransactionError(error: unknown): TransactionState {
  const code = typeof error === "object" && error !== null && "code" in error ? (error as { code?: string | number }).code : undefined;
  if (code === 4001 || code === "ACTION_REJECTED") {
    return { stage: "rejected", error: "User rejected the wallet signature" };
  }
  return { stage: "error", error: error instanceof Error ? error.message : "Transaction failed" };
}

export function useTransactions() {
  const [state, setState] = useState<TransactionState>(idleState);
  const pending = useRef(false);

  const reset = useCallback(() => {
    if (!pending.current) setState(idleState);
  }, []);

  const approveToken = useCallback(async (token: Address, spender: Address, amount: bigint) => {
    if (pending.current) return false;
    if (!window.ethereum) {
      setState({ stage: "error", error: "MetaMask is not installed" });
      return false;
    }

    pending.current = true;
    try {
      setState({ stage: "waiting-signature" });
      const contracts = await getWriteContracts(window.ethereum);
      const tx = await contracts.erc20(token).approve(spender, amount);
      setState({ stage: "submitted", hash: tx.hash });
      setState({ stage: "confirming", hash: tx.hash });
      await tx.wait();
      setState({ stage: "success", hash: tx.hash });
      return true;
    } catch (error) {
      setState(normalizeTransactionError(error));
      return false;
    } finally {
      pending.current = false;
    }
  }, []);

  const runWrite = useCallback(async (write: () => Promise<{ hash: string; wait(): Promise<unknown> }>, afterSuccess?: () => Promise<void>) => {
    if (pending.current) return false;
    pending.current = true;
    let hash: string | undefined;
    try {
      setState({ stage: "waiting-signature" });
      const tx = await write();
      hash = tx.hash;
      setState({ stage: "submitted", hash: tx.hash });
      setState({ stage: "confirming", hash: tx.hash });
      await tx.wait();
      setState({ stage: "success", hash: tx.hash });
      if (afterSuccess) {
        try {
          await afterSuccess();
        } catch (error) {
          setState({
            stage: "success",
            hash: tx.hash,
            syncError: error instanceof Error ? error.message : "Transaction succeeded, but data refresh failed",
          });
        }
      }
      return true;
    } catch (error) {
      setState({ ...normalizeTransactionError(error), hash });
      return false;
    } finally {
      pending.current = false;
    }
  }, []);

  const isPending = state.stage === "waiting-signature" || state.stage === "submitted" || state.stage === "confirming";
  return useMemo(() => ({ ...state, isPending, approveToken, reset, runWrite }), [approveToken, isPending, reset, runWrite, state]);
}
