import { useCallback, useEffect, useMemo, useState } from "react";
import { SEPOLIA_CHAIN_ID, SEPOLIA_HEX_CHAIN_ID, SEPOLIA_PARAMS } from "../config/chains";
import type { Address } from "../types/domain";
import "../types/ethereum";

export type WalletStatus = "missing" | "disconnected" | "wrong-network" | "connected" | "error";

export type WalletState = {
  status: WalletStatus;
  account?: Address;
  chainId?: number;
  error?: string;
};

function parseChainId(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "string") return value.startsWith("0x") ? Number.parseInt(value, 16) : Number(value);
  return undefined;
}

function getStatus(account?: string, chainId?: number): WalletStatus {
  if (!window.ethereum) return "missing";
  if (!account) return "disconnected";
  if (chainId !== SEPOLIA_CHAIN_ID) return "wrong-network";
  return "connected";
}

export function useWallet() {
  const [state, setState] = useState<WalletState>(() => ({
    status: typeof window === "undefined" || !window.ethereum ? "missing" : "disconnected",
  }));

  const refresh = useCallback(async () => {
    if (!window.ethereum) {
      setState({ status: "missing" });
      return;
    }

    try {
      const [accounts, chainIdHex] = await Promise.all([
        window.ethereum.request<string[]>({ method: "eth_accounts" }),
        window.ethereum.request<string>({ method: "eth_chainId" }),
      ]);
      const account = accounts[0] as Address | undefined;
      const chainId = parseChainId(chainIdHex);
      setState({ account, chainId, status: getStatus(account, chainId) });
    } catch (error) {
      setState({ status: "error", error: error instanceof Error ? error.message : "Unable to read wallet state" });
    }
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setState({ status: "missing", error: "MetaMask is not installed" });
      return;
    }

    try {
      const accounts = await window.ethereum.request<string[]>({ method: "eth_requestAccounts" });
      const chainIdHex = await window.ethereum.request<string>({ method: "eth_chainId" });
      const account = accounts[0] as Address | undefined;
      const chainId = parseChainId(chainIdHex);
      setState({ account, chainId, status: getStatus(account, chainId) });
    } catch (error) {
      setState({ status: "error", error: error instanceof Error ? error.message : "Wallet connection rejected" });
    }
  }, []);

  const switchToSepolia = useCallback(async () => {
    if (!window.ethereum) {
      setState({ status: "missing", error: "MetaMask is not installed" });
      return;
    }

    try {
      await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: SEPOLIA_HEX_CHAIN_ID }] });
      await refresh();
    } catch (error) {
      const code = typeof error === "object" && error !== null && "code" in error ? (error as { code?: number }).code : undefined;
      if (code === 4902) {
        await window.ethereum.request({ method: "wallet_addEthereumChain", params: [SEPOLIA_PARAMS] });
        await refresh();
        return;
      }
      setState((current) => ({
        ...current,
        status: "error",
        error: error instanceof Error ? error.message : "Network switch rejected",
      }));
    }
  }, [refresh]);

  const switchAccount = useCallback(async () => {
    if (!window.ethereum) {
      setState({ status: "missing", error: "MetaMask is not installed" });
      return;
    }

    try {
      await window.ethereum.request({ method: "wallet_requestPermissions", params: [{ eth_accounts: {} }] });
      await refresh();
    } catch (error) {
      setState((current) => ({
        ...current,
        status: "error",
        error: error instanceof Error ? error.message : "Wallet account switch rejected",
      }));
    }
  }, [refresh]);

  const disconnect = useCallback(async () => {
    if (!window.ethereum) {
      setState({ status: "missing" });
      return;
    }

    try {
      await window.ethereum.request({ method: "wallet_revokePermissions", params: [{ eth_accounts: {} }] });
    } catch {
      // Some injected wallets do not support permission revocation. The app can still clear local wallet state.
    } finally {
      setState({ status: "disconnected" });
    }
  }, []);

  useEffect(() => {
    void refresh();
    if (!window.ethereum?.on) return;

    const handleAccounts = (accounts: unknown) => {
      const account = Array.isArray(accounts) ? (accounts[0] as Address | undefined) : undefined;
      setState((current) => ({ account, chainId: current.chainId, status: getStatus(account, current.chainId) }));
    };
    const handleChain = (chain: unknown) => {
      const chainId = parseChainId(chain);
      setState((current) => ({ account: current.account, chainId, status: getStatus(current.account, chainId) }));
    };

    window.ethereum.on("accountsChanged", handleAccounts);
    window.ethereum.on("chainChanged", handleChain);
    return () => {
      window.ethereum?.removeListener?.("accountsChanged", handleAccounts);
      window.ethereum?.removeListener?.("chainChanged", handleChain);
    };
  }, [refresh]);

  return useMemo(
    () => ({ ...state, connect, disconnect, refresh, switchAccount, switchToSepolia }),
    [connect, disconnect, refresh, state, switchAccount, switchToSepolia],
  );
}
