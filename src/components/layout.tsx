import { Activity, ArrowDownUp, Database, ExternalLink, Layers3, LogOut, Plus, RefreshCw, Repeat2, Wallet } from "lucide-react";
import { useState } from "react";
import { TOKENS } from "../config/tokens";
import type { TokenBalance } from "../hooks/useDexData";
import type { WalletStatus } from "../hooks/useWallet";
import { formatTokenAmount } from "../lib/amount";
import type { OpenDrawer } from "../types/app";
import type { TransactionStage } from "../types/domain";
import type { Page, Pool } from "../types/ui";
import { TxTimeline } from "./common";

export function Sidebar({ page, setPage }: { page: Page; setPage: (page: Page) => void }) {
  const items = [
    { id: "swap" as const, label: "Swap", icon: ArrowDownUp },
    { id: "pools" as const, label: "Pools", icon: Database },
    { id: "positions" as const, label: "Positions", icon: Layers3 },
    { id: "activity" as const, label: "Activity", icon: Activity },
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">zD</div>
        <div>
          <strong>zeroDex</strong>
          <span>Sepolia console</span>
        </div>
      </div>
      <nav className="nav-list">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`nav-item ${page === item.id ? "active" : ""}`}
              onClick={() => setPage(item.id)}
            >
              <Icon size={17} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <span className="label">Contracts</span>
        <code>11155111</code>
        <a className="ghost-button" href="https://sepolia.etherscan.io" target="_blank" rel="noreferrer">
          Etherscan <ExternalLink size={14} />
        </a>
      </div>
    </aside>
  );
}

export function Topbar({
  account,
  status,
  error,
  connect,
  disconnect,
  switchAccount,
  switchToSepolia,
  refresh,
  refreshing,
}: {
  account?: string;
  status: WalletStatus;
  error?: string;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  switchAccount: () => Promise<void>;
  switchToSepolia: () => Promise<void>;
  refresh: () => Promise<void>;
  refreshing: boolean;
}) {
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const label = getWalletLabel(status, account);
  const action = status === "wrong-network" ? switchToSepolia : connect;
  const hasConnectedWallet = status === "connected" && Boolean(account);
  const closeAndRun = (handler: () => Promise<void>) => {
    setWalletMenuOpen(false);
    void handler();
  };
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">MetaNodeSwap front end</p>
        <h1>Liquidity control console</h1>
        {error && <p className="topbar-error">{error}</p>}
      </div>
      <div className="topbar-actions">
        <button className="icon-button" title="Refresh chain data" onClick={() => void refresh()} disabled={refreshing}>
          <RefreshCw size={16} />
        </button>
        <div className="wallet-menu-wrap">
          <button
            className={`wallet-button ${walletClass(status)}`}
            onClick={() => (hasConnectedWallet ? setWalletMenuOpen((open) => !open) : void action())}
            aria-expanded={hasConnectedWallet ? walletMenuOpen : undefined}
            aria-haspopup={hasConnectedWallet ? "menu" : undefined}
          >
            <Wallet size={16} />
            {label}
          </button>
          {hasConnectedWallet && walletMenuOpen && (
            <div className="wallet-menu" role="menu">
              <button type="button" role="menuitem" onClick={() => closeAndRun(switchAccount)}>
                <Repeat2 size={15} /> Switch wallet
              </button>
              <button type="button" role="menuitem" onClick={() => closeAndRun(disconnect)}>
                <LogOut size={15} /> Disconnect
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export function ContextPanel({
  selectedPool,
  txStage,
  openDrawer,
  balances,
  balancesLoading,
  isReady,
}: {
  selectedPool: Pool;
  txStage: TransactionStage;
  openDrawer: OpenDrawer;
  balances: TokenBalance[];
  balancesLoading: boolean;
  isReady: boolean;
}) {
  return (
    <aside className="context-panel">
      <div className="context-block">
        <span className="label">Context</span>
        <h3>{selectedPool.pair}</h3>
        <p>{selectedPool.price}. Liquidity can only be added inside the fixed pool range.</p>
      </div>
      <div className="balance-list">
        {TOKENS.map((token) => {
          const balance = balances.find((item) => item.token.toLowerCase() === token.address.toLowerCase())?.value;
          return (
          <div key={token.address}>
            <span>{token.symbol}</span>
            <strong>{balance !== undefined ? formatTokenAmount(balance, token.decimals) : balancesLoading ? "Loading..." : "—"}</strong>
          </div>
          );
        })}
      </div>
      <TxTimeline stage={txStage} compact />
      <button className="primary-button wide" onClick={() => openDrawer("liquidity")} disabled={!isReady}>
        <Plus size={16} /> Mint position
      </button>
    </aside>
  );
}

function getWalletLabel(status: WalletStatus, account?: string) {
  if (status === "missing") return "Install MetaMask";
  if (status === "wrong-network") return "Switch to Sepolia";
  if (status === "connected" && account) return `${account.slice(0, 6)}...${account.slice(-4)}`;
  return "Connect wallet";
}

function walletClass(status: WalletStatus) {
  if (status === "connected") return "ready";
  if (status === "wrong-network" || status === "error") return "wrong";
  return "disconnected";
}
