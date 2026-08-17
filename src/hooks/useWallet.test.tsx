import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SEPOLIA_HEX_CHAIN_ID } from "../config/chains";
import { resetWalletRegistry } from "../lib/walletProvider";
import type { EthereumProvider } from "../types/ethereum";
import { useWallet } from "./useWallet";

function announceWallet(handler: (args: { method: string; params?: unknown[] }) => Promise<unknown>, uuid = "wallet-1") {
  const provider: EthereumProvider = {
    request: handler as EthereumProvider["request"],
    on: vi.fn(),
    removeListener: vi.fn(),
  };
  window.dispatchEvent(new CustomEvent("eip6963:announceProvider", { detail: {
    info: { uuid, name: `Wallet ${uuid}`, icon: "data:image/svg+xml,wallet", rdns: `io.${uuid}` },
    provider,
  } }));
  return provider;
}

describe("useWallet", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetWalletRegistry();
    window.localStorage.clear();
    delete window.ethereum;
    delete window.metaNodeWallet;
  });

  it("reports missing when no wallet is announced", async () => {
    const { result } = renderHook(() => useWallet());
    await waitFor(() => expect(result.current.status).toBe("missing"));
  });

  it("connects the wallet selected by the user", async () => {
    let connected = false;
    const request = vi.fn(async ({ method }: { method: string }) => {
      if (method === "eth_accounts") return connected ? ["0x1111111111111111111111111111111111111111"] : [];
      if (method === "eth_chainId") return SEPOLIA_HEX_CHAIN_ID;
      if (method === "eth_requestAccounts") {
        connected = true;
        return ["0x1111111111111111111111111111111111111111"];
      }
      throw new Error(`unexpected ${method}`);
    });
    announceWallet(request);
    const { result } = renderHook(() => useWallet());
    await waitFor(() => expect(result.current.wallets).toHaveLength(1));

    await act(async () => result.current.connect(result.current.wallets[0]));

    expect(request).toHaveBeenCalledWith({ method: "eth_requestAccounts" });
    expect(result.current.status).toBe("connected");
    expect(result.current.selectedWallet?.info.uuid).toBe("wallet-1");
  });

  it("uses the selected provider when switching to Sepolia", async () => {
    const request = vi.fn(async ({ method }: { method: string }) => {
      if (method === "eth_accounts" || method === "eth_requestAccounts") return ["0x1111111111111111111111111111111111111111"];
      if (method === "eth_chainId") return "0x1";
      if (method === "wallet_switchEthereumChain") return null;
      throw new Error(`unexpected ${method}`);
    });
    announceWallet(request);
    const { result } = renderHook(() => useWallet());
    await waitFor(() => expect(result.current.wallets).toHaveLength(1));
    await act(async () => result.current.connect(result.current.wallets[0]));
    await act(async () => result.current.switchToSepolia());

    expect(request).toHaveBeenCalledWith({ method: "wallet_switchEthereumChain", params: [{ chainId: SEPOLIA_HEX_CHAIN_ID }] });
  });

  it("keeps providers isolated when multiple wallets are available", async () => {
    const first = vi.fn(async ({ method }: { method: string }) => method === "eth_chainId" ? SEPOLIA_HEX_CHAIN_ID : ["0x1111111111111111111111111111111111111111"]);
    const second = vi.fn(async ({ method }: { method: string }) => method === "eth_chainId" ? SEPOLIA_HEX_CHAIN_ID : ["0x2222222222222222222222222222222222222222"]);
    announceWallet(first, "first");
    announceWallet(second, "second");
    const { result } = renderHook(() => useWallet());
    await waitFor(() => expect(result.current.wallets).toHaveLength(2));
    const selected = result.current.wallets.find((wallet) => wallet.info.uuid === "second")!;

    await act(async () => result.current.connect(selected));

    expect(second).toHaveBeenCalledWith({ method: "eth_requestAccounts" });
    expect(first).not.toHaveBeenCalled();
    expect(result.current.account).toBe("0x2222222222222222222222222222222222222222");
  });

  it("clears the selected wallet when disconnecting", async () => {
    const request = vi.fn(async ({ method }: { method: string }) => {
      if (method === "eth_chainId") return SEPOLIA_HEX_CHAIN_ID;
      if (method === "eth_accounts" || method === "eth_requestAccounts") return ["0x1111111111111111111111111111111111111111"];
      if (method === "wallet_revokePermissions") return null;
      throw new Error(`unexpected ${method}`);
    });
    announceWallet(request);
    const { result } = renderHook(() => useWallet());
    await waitFor(() => expect(result.current.wallets).toHaveLength(1));
    await act(async () => result.current.connect(result.current.wallets[0]));
    await act(async () => result.current.disconnect());

    expect(result.current.status).toBe("disconnected");
    expect(result.current.provider).toBeUndefined();
  });
});
