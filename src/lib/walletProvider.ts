import type { EthereumProvider } from "../types/ethereum";

export type WalletInfo = {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
};

export type DiscoveredWallet = {
  info: WalletInfo;
  provider: EthereumProvider;
};

const wallets = new Map<string, DiscoveredWallet>();
const subscribers = new Set<(wallets: DiscoveredWallet[]) => void>();
let listening = false;

function snapshot() {
  return [...wallets.values()].sort((a, b) => a.info.name.localeCompare(b.info.name));
}

function notify() {
  const next = snapshot();
  for (const subscriber of subscribers) subscriber(next);
}

function register(wallet: DiscoveredWallet) {
  if (!wallet?.info?.uuid || !wallet.info.name || !wallet.provider?.request) return;
  for (const [uuid, existing] of wallets) {
    if (existing.provider === wallet.provider && uuid !== wallet.info.uuid) wallets.delete(uuid);
  }
  wallets.set(wallet.info.uuid, wallet);
  notify();
}

function handleAnnouncement(event: Event) {
  register((event as CustomEvent<DiscoveredWallet>).detail);
}

function registerLegacyProviders() {
  if (typeof window === "undefined") return;
  if (window.metaNodeWallet && !snapshot().some((wallet) => wallet.provider === window.metaNodeWallet)) {
    register({
      info: { uuid: "legacy-zero-wallet", name: "zeroWallet", icon: "", rdns: "io.zerowallet.wallet" },
      provider: window.metaNodeWallet,
    });
  }
  if (window.ethereum && !snapshot().some((wallet) => wallet.provider === window.ethereum)) {
    register({
      info: { uuid: "legacy-injected-wallet", name: "Browser wallet", icon: "", rdns: "injected.browser" },
      provider: window.ethereum,
    });
  }
}

export function requestWallets() {
  if (typeof window === "undefined") return;
  if (!listening) {
    listening = true;
    window.addEventListener("eip6963:announceProvider", handleAnnouncement);
  }
  window.dispatchEvent(new Event("eip6963:requestProvider"));
  window.setTimeout(registerLegacyProviders, 100);
}

export function getWallets(): DiscoveredWallet[] {
  return snapshot();
}

export function subscribeWallets(subscriber: (wallets: DiscoveredWallet[]) => void) {
  subscribers.add(subscriber);
  subscriber(snapshot());
  requestWallets();
  return () => {
    subscribers.delete(subscriber);
  };
}

export function resetWalletRegistry() {
  wallets.clear();
  notify();
}

requestWallets();
