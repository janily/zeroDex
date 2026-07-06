import { useCallback, useMemo, useState } from "react";
import { getWriteContracts } from "../lib/contracts";
import type { Address, TransactionStage } from "../types/domain";
import "../types/ethereum";

export type TransactionState = {
  stage: TransactionStage;
  hash?: string;
  error?: string;
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

  const reset = useCallback(() => setState(idleState), []);

  const approveToken = useCallback(async (token: Address, spender: Address, amount: bigint) => {
    if (!window.ethereum) {
      setState({ stage: "error", error: "MetaMask is not installed" });
      return;
    }

    try {
      setState({ stage: "waiting-signature" });
      const contracts = await getWriteContracts(window.ethereum);
      const tx = await contracts.erc20(token).approve(spender, amount);
      setState({ stage: "submitted", hash: tx.hash });
      setState({ stage: "confirming", hash: tx.hash });
      await tx.wait();
      setState({ stage: "success", hash: tx.hash });
    } catch (error) {
      setState(normalizeTransactionError(error));
    }
  }, []);

  const runWrite = useCallback(async (write: () => Promise<{ hash: string; wait(): Promise<unknown> }>) => {
    try {
      setState({ stage: "waiting-signature" });
      const tx = await write();
      setState({ stage: "submitted", hash: tx.hash });
      setState({ stage: "confirming", hash: tx.hash });
      await tx.wait();
      setState({ stage: "success", hash: tx.hash });
    } catch (error) {
      setState(normalizeTransactionError(error));
    }
  }, []);

  return useMemo(() => ({ ...state, approveToken, reset, runWrite }), [approveToken, reset, runWrite, state]);
}
