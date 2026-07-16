import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SEPOLIA_HEX_CHAIN_ID } from "../config/chains";
import type { EthereumProvider } from "../types/ethereum";
import { useWallet } from "./useWallet";

function installEthereum(handler: (args: { method: string; params?: unknown[] }) => Promise<unknown>) {
  const request = handler as EthereumProvider["request"];
  window.ethereum = {
    request,
    on: vi.fn(),
    removeListener: vi.fn(),
  };
}

describe("useWallet", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete window.ethereum;
  });

  it("reports missing MetaMask", async () => {
    const { result } = renderHook(() => useWallet());
    await waitFor(() => expect(result.current.status).toBe("missing"));
  });

  it("connects with eth_requestAccounts", async () => {
    const request = vi.fn(async ({ method }: { method: string }) => {
      if (method === "eth_accounts") return [];
      if (method === "eth_chainId") return SEPOLIA_HEX_CHAIN_ID;
      if (method === "eth_requestAccounts") return ["0x1111111111111111111111111111111111111111"];
      throw new Error(`unexpected ${method}`);
    });
    installEthereum(request);

    const { result } = renderHook(() => useWallet());
    await act(async () => {
      await result.current.connect();
    });

    expect(request).toHaveBeenCalledWith({ method: "eth_requestAccounts" });
    expect(result.current.status).toBe("connected");
  });

  it("switches to Sepolia with the hex chain id", async () => {
    const request = vi.fn(async ({ method }: { method: string }) => {
      if (method === "eth_accounts") return ["0x1111111111111111111111111111111111111111"];
      if (method === "eth_chainId") return "0x1";
      if (method === "wallet_switchEthereumChain") return null;
      throw new Error(`unexpected ${method}`);
    });
    installEthereum(request);

    const { result } = renderHook(() => useWallet());
    await act(async () => {
      await result.current.switchToSepolia();
    });

    expect(request).toHaveBeenCalledWith({ method: "wallet_switchEthereumChain", params: [{ chainId: SEPOLIA_HEX_CHAIN_ID }] });
  });

  it("requests account permissions when switching wallets", async () => {
    const request = vi.fn(async ({ method }: { method: string }) => {
      if (method === "eth_accounts") return ["0x2222222222222222222222222222222222222222"];
      if (method === "eth_chainId") return SEPOLIA_HEX_CHAIN_ID;
      if (method === "wallet_requestPermissions") return null;
      throw new Error(`unexpected ${method}`);
    });
    installEthereum(request);

    const { result } = renderHook(() => useWallet());
    await act(async () => {
      await result.current.switchAccount();
    });

    expect(request).toHaveBeenCalledWith({ method: "wallet_requestPermissions", params: [{ eth_accounts: {} }] });
    expect(result.current.status).toBe("connected");
  });

  it("revokes account permissions and clears wallet state when disconnecting", async () => {
    const request = vi.fn(async ({ method }: { method: string }) => {
      if (method === "eth_accounts") return ["0x1111111111111111111111111111111111111111"];
      if (method === "eth_chainId") return SEPOLIA_HEX_CHAIN_ID;
      if (method === "wallet_revokePermissions") return null;
      throw new Error(`unexpected ${method}`);
    });
    installEthereum(request);

    const { result } = renderHook(() => useWallet());
    await waitFor(() => expect(result.current.status).toBe("connected"));
    await act(async () => {
      await result.current.disconnect();
    });

    expect(request).toHaveBeenCalledWith({ method: "wallet_revokePermissions", params: [{ eth_accounts: {} }] });
    expect(result.current.status).toBe("disconnected");
    expect(result.current.account).toBeUndefined();
  });
});
