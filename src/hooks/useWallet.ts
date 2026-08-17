import { useCallback, useEffect, useMemo, useState } from "react";
import { SEPOLIA_CHAIN_ID, SEPOLIA_HEX_CHAIN_ID, SEPOLIA_PARAMS } from "../config/chains";
import { getWallets, requestWallets, subscribeWallets, type DiscoveredWallet } from "../lib/walletProvider";
import type { Address } from "../types/domain";

export type WalletStatus = "missing" | "disconnected" | "wrong-network" | "connected" | "error";

export type WalletState = {
  status: WalletStatus;
  account?: Address;
  chainId?: number;
  error?: string;
};

const LAST_WALLET_KEY = "zerodex:last-wallet-rdns";

function parseChainId(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "string") return value.startsWith("0x") ? Number.parseInt(value, 16) : Number(value);
  return undefined;
}

function connectedStatus(account?: string, chainId?: number): WalletStatus {
  if (!account) return "disconnected";
  return chainId === SEPOLIA_CHAIN_ID ? "connected" : "wrong-network";
}

export function useWallet() {
  const [wallets, setWallets] = useState<DiscoveredWallet[]>(() => getWallets());
  const [selectedWallet, setSelectedWallet] = useState<DiscoveredWallet>();
  const [state, setState] = useState<WalletState>(() => ({ status: getWallets().length ? "disconnected" : "missing" }));
  const provider = selectedWallet?.provider;

  useEffect(() => subscribeWallets((next) => {
    setWallets(next);
    setState((current) => current.status === "missing" && next.length ? { status: "disconnected" } : current);
    setSelectedWallet((current) => {
      if (current) return next.find((wallet) => wallet.info.uuid === current.info.uuid) ?? current;
      const preferredRdns = window.localStorage.getItem(LAST_WALLET_KEY);
      return preferredRdns ? next.find((wallet) => wallet.info.rdns === preferredRdns) : undefined;
    });
  }), []);

  const refresh = useCallback(async () => {
    if (!provider) {
      requestWallets();
      setState({ status: wallets.length ? "disconnected" : "missing" });
      return;
    }
    try {
      const [accounts, chainIdHex] = await Promise.all([
        provider.request<string[]>({ method: "eth_accounts" }),
        provider.request<string>({ method: "eth_chainId" }),
      ]);
      const account = accounts[0] as Address | undefined;
      const chainId = parseChainId(chainIdHex);
      setState({ account, chainId, status: connectedStatus(account, chainId) });
    } catch (error) {
      setState({ status: "error", error: error instanceof Error ? error.message : "Unable to read wallet state" });
    }
  }, [provider, wallets.length]);

  const connect = useCallback(async (wallet: DiscoveredWallet) => {
    setSelectedWallet(wallet);
    window.localStorage.setItem(LAST_WALLET_KEY, wallet.info.rdns);
    try {
      const accounts = await wallet.provider.request<string[]>({ method: "eth_requestAccounts" });
      const chainIdHex = await wallet.provider.request<string>({ method: "eth_chainId" });
      const account = accounts[0] as Address | undefined;
      const chainId = parseChainId(chainIdHex);
      setState({ account, chainId, status: connectedStatus(account, chainId) });
    } catch (error) {
      setState({ status: "error", error: error instanceof Error ? error.message : "Wallet connection rejected" });
    }
  }, []);

  const switchToSepolia = useCallback(async () => {
    if (!provider) return;
    try {
      await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: SEPOLIA_HEX_CHAIN_ID }] });
      await refresh();
    } catch (error) {
      const code = typeof error === "object" && error !== null && "code" in error ? (error as { code?: number }).code : undefined;
      if (code === 4902) {
        await provider.request({ method: "wallet_addEthereumChain", params: [SEPOLIA_PARAMS] });
        await refresh();
        return;
      }
      setState((current) => ({ ...current, status: "error", error: error instanceof Error ? error.message : "Network switch rejected" }));
    }
  }, [provider, refresh]);

  const disconnect = useCallback(async () => {
    if (provider) {
      try {
        await provider.request({ method: "wallet_revokePermissions", params: [{ eth_accounts: {} }] });
      } catch {
        // Not every EIP-1193 wallet supports permission revocation.
      }
    }
    window.localStorage.removeItem(LAST_WALLET_KEY);
    setSelectedWallet(undefined);
    setState({ status: wallets.length ? "disconnected" : "missing" });
  }, [provider, wallets.length]);

  useEffect(() => {
    if (!provider) return;
    void refresh();
    const handleAccounts = (accounts: unknown) => {
      const account = Array.isArray(accounts) ? (accounts[0] as Address | undefined) : undefined;
      setState((current) => ({ account, chainId: current.chainId, status: connectedStatus(account, current.chainId) }));
    };
    const handleChain = (chain: unknown) => {
      const chainId = parseChainId(chain);
      setState((current) => ({ account: current.account, chainId, status: connectedStatus(current.account, chainId) }));
    };
    provider.on?.("accountsChanged", handleAccounts);
    provider.on?.("chainChanged", handleChain);
    return () => {
      provider.removeListener?.("accountsChanged", handleAccounts);
      provider.removeListener?.("chainChanged", handleChain);
    };
  }, [provider, refresh]);

  return useMemo(() => ({ ...state, wallets, selectedWallet, provider, connect, disconnect, refresh, switchToSepolia }), [connect, disconnect, provider, refresh, selectedWallet, state, switchToSepolia, wallets]);
}
