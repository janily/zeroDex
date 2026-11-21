import { Activity, ArrowDownUp, ChartNoAxesColumn, ChevronDown, Database, ExternalLink, Layers3, LogOut, Plus, RefreshCw, Repeat2, Wallet } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { TOKENS } from "../config/tokens";
import { SEPOLIA_CHAIN_ID } from "../config/chains";
import type { TokenBalance } from "../hooks/useDexData";
import type { WalletStatus } from "../hooks/useWallet";
import { formatTokenAmount } from "../lib/amount";
import type { OpenDrawer } from "../types/app";
import type { TransactionStage } from "../types/domain";
import type { Page, Pool } from "../types/ui";
import { TxTimeline } from "./common";

const destinations = [
  { id: "pools", label: "Pools", icon: Database },
  { id: "swap", label: "Swap", icon: ArrowDownUp },
  { id: "positions", label: "Positions", icon: Layers3 },
  { id: "activity", label: "Activity", icon: Activity },
] as const;

export function Navigation({ page, setPage }: { page: Page; setPage: (page: Page) => void }) {
  return (
    <>
      <div className="brand" aria-label="zeroDex">
        <span className="brand-mark" aria-hidden="true"><i /><i /></span>
        <span>zero<strong>Dex</strong></span>
      </div>
      <nav className="nav-list" aria-label="Workspace">
        {destinations.map(({ id, label, icon: Icon }) => (
          <button key={id} className="nav-item" aria-current={page === id ? "page" : undefined} onClick={() => setPage(id)}>
            <Icon size={16} aria-hidden="true" />{label}
          </button>
        ))}
      </nav>
    </>
  );
}

export function PageHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <header className="page-hero">
      <div className="hero-copy">
        <div className="network-tag"><span aria-hidden="true" />Sepolia testnet</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action && <div className="hero-action">{action}</div>}
    </header>
  );
}

export function Topbar({
  page, setPage, account, status, error, connect, disconnect, switchAccount, switchToSepolia, refresh, refreshing,
}: {
  page: Page;
  setPage: (page: Page) => void;
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const connected = status === "connected" && Boolean(account);
  useEffect(() => {
    if (!menuOpen) return;
    const dismiss = (event: PointerEvent) => {
      if (!menu.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [menuOpen]);

  const closeAndRun = (handler: () => Promise<void>) => {
    setMenuOpen(false);
    trigger.current?.focus();
    void handler();
  };
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Navigation page={page} setPage={setPage} />
        <div className="topbar-actions">
          <button className="icon-button" aria-label="Refresh chain data" title="Refresh chain data" onClick={() => void refresh()} disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? "spinning" : undefined} />
          </button>
          <div className="wallet-menu-wrap" ref={menu}
            onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setMenuOpen(false); }}
            onKeyDown={event => { if (event.key === "Escape") { setMenuOpen(false); trigger.current?.focus(); } }}>
            <button className="wallet-button" ref={trigger} aria-expanded={connected ? menuOpen : undefined}
              onClick={() => connected ? setMenuOpen(!menuOpen) : void (status === "wrong-network" ? switchToSepolia() : connect())}>
              <Wallet size={16} />
              {connected && account ? `${account.slice(0, 6)}…${account.slice(-4)}` : status === "wrong-network" ? "Switch to Sepolia" : "Connect wallet"}
              {connected && <ChevronDown size={14} />}
            </button>
            {connected && menuOpen && (
              <div className="wallet-menu">
                <button onClick={() => closeAndRun(switchAccount)}><Repeat2 size={15} />Switch wallet</button>
                <button onClick={() => closeAndRun(disconnect)}><LogOut size={15} />Disconnect</button>
              </div>
            )}
          </div>
        </div>
      </div>
      {error && <p className="topbar-error" role="alert">{error}</p>}
    </header>
  );
}

export function ContextPanel({
  selectedPool, txStage, openDrawer, balances, balancesLoading, isReady,
}: {
  selectedPool: Pool;
  txStage: TransactionStage;
  openDrawer: OpenDrawer;
  balances: TokenBalance[];
  balancesLoading: boolean;
  isReady: boolean;
}) {
  return (
    <aside className="context-strip" aria-label="Wallet and transaction details">
      <section>
        <h2><Wallet size={17} />Wallet balances</h2>
        <dl className="balance-list">
          {TOKENS.map(token => {
            const balance = balances.find(item => item.token.toLowerCase() === token.address.toLowerCase())?.value;
            return <div key={token.address}><dt>{token.symbol}</dt><dd>{balance !== undefined ? formatTokenAmount(balance, token.decimals) : balancesLoading ? "Loading…" : "—"}</dd></div>;
          })}
        </dl>
      </section>
      {selectedPool.id !== "no-pool" && <section>
        <h2><ChartNoAxesColumn size={17} />Pool context</h2>
        <strong>{selectedPool.pair}</strong>
        <p>{selectedPool.price}. Liquidity can only be added inside the fixed pool range.</p>
        <button className="secondary-button" onClick={() => openDrawer("liquidity")} disabled={!isReady}><Plus size={15} />Mint position</button>
      </section>}
      <section>
        <h2><Activity size={17} />Transaction progress</h2>
        <TxTimeline stage={txStage} compact />
      </section>
    </aside>
  );
}

export function NetworkFooter() {
  return <footer className="network-footer">
    <span>MetaNodeSwap <b aria-hidden="true">/</b> Sepolia <b aria-hidden="true">/</b> Chain ID {SEPOLIA_CHAIN_ID}</span>
    <a href="https://sepolia.etherscan.io" target="_blank" rel="noreferrer">Etherscan <ExternalLink size={13} /></a>
  </footer>;
}
