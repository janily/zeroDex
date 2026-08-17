import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EthereumProvider } from "../types/ethereum";
import { getWallets, requestWallets, resetWalletRegistry } from "./walletProvider";

describe("EIP-6963 wallet discovery", () => {
  beforeEach(() => {
    resetWalletRegistry();
    delete window.ethereum;
    delete window.metaNodeWallet;
  });

  it("collects multiple wallets without selecting window.ethereum", () => {
    const metaMask = { request: vi.fn() } as unknown as EthereumProvider;
    const zeroWallet = { request: vi.fn() } as unknown as EthereumProvider;
    window.ethereum = metaMask;

    window.dispatchEvent(new CustomEvent("eip6963:announceProvider", { detail: {
      info: { uuid: "metamask", name: "MetaMask", icon: "data:image/svg+xml,mm", rdns: "io.metamask" },
      provider: metaMask,
    } }));
    window.dispatchEvent(new CustomEvent("eip6963:announceProvider", { detail: {
      info: { uuid: "zero", name: "zeroWallet", icon: "data:image/svg+xml,zero", rdns: "io.zerowallet.wallet" },
      provider: zeroWallet,
    } }));

    expect(getWallets().map((wallet) => wallet.info.rdns)).toEqual(["io.metamask", "io.zerowallet.wallet"]);
  });

  it("requests providers to announce again", () => {
    const listener = vi.fn();
    window.addEventListener("eip6963:requestProvider", listener);
    requestWallets();
    expect(listener).toHaveBeenCalledOnce();
    window.removeEventListener("eip6963:requestProvider", listener);
  });
});
