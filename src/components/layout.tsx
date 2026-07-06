import { Activity, ArrowDownUp, Database, ExternalLink, Layers3, Plus, RefreshCw, Wallet } from "lucide-react";
import { TOKENS } from "../config/tokens";
import type { WalletStatus } from "../hooks/useWallet";
import type { OpenDrawer } from "../types/app";
import type { TransactionStage } from "../types/domain";
import type { Page, Pool } from "../types/ui";
import { Metric, TxTimeline } from "./common";

const tokens = TOKENS.map((token) => token.symbol);

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
        <button className="ghost-button">
          Etherscan <ExternalLink size={14} />
        </button>
      </div>
    </aside>
  );
}

export function Topbar({
  account,
  status,
  error,
  connect,
  switchToSepolia,
}: {
  account?: string;
  status: WalletStatus;
  error?: string;
  connect: () => Promise<void>;
  switchToSepolia: () => Promise<void>;
}) {
  const label = getWalletLabel(status, account);
  const action = status === "wrong-network" ? switchToSepolia : connect;
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">MetaNodeSwap front end</p>
        <h1>Liquidity control console</h1>
        {error && <p className="topbar-error">{error}</p>}
      </div>
      <div className="topbar-actions">
        <button className="icon-button" title="Refresh chain data">
          <RefreshCw size={16} />
        </button>
        <button className={`wallet-button ${walletClass(status)}`} onClick={() => void action()}>
          <Wallet size={16} />
          {label}
        </button>
      </div>
    </header>
  );
}

export function ContextPanel({
  selectedPool,
  txStage,
  openDrawer,
}: {
  selectedPool: Pool;
  txStage: TransactionStage;
  openDrawer: OpenDrawer;
}) {
  return (
    <aside className="context-panel">
      <div className="context-block">
        <span className="label">Context</span>
        <h3>{selectedPool.pair}</h3>
        <p>{selectedPool.price}. Liquidity can only be added inside the fixed pool range.</p>
      </div>
      <div className="balance-list">
        {tokens.map((token, index) => (
          <div key={token}>
            <span>{token}</span>
            <strong>{[1260.42, 891.03, 342.19, 4207.88][index].toLocaleString()}</strong>
          </div>
        ))}
      </div>
      <TxTimeline stage={txStage} compact />
      <button className="primary-button wide" onClick={() => openDrawer("liquidity")}>
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
