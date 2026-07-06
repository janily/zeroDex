import {
  Activity,
  ArrowDownUp,
  Check,
  ChevronDown,
  Clock3,
  Database,
  ExternalLink,
  Filter,
  Gauge,
  Layers3,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Wallet,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { TOKENS } from "./config/tokens";
import { useDexData } from "./hooks/useDexData";
import { useWallet, type WalletStatus } from "./hooks/useWallet";
import { feeToPercent } from "./lib/price";
import type { DisplayPool } from "./types/domain";

type Page = "swap" | "pools" | "positions" | "activity";
type TxStage = "idle" | "approve" | "sign" | "confirm" | "success" | "error";
type PositionStatus = "Active" | "Collectable" | "Closed";

type Pool = {
  index: number;
  pair: string;
  token0: string;
  token1: string;
  fee: string;
  price: string;
  range: string;
  liquidity: number;
  status: "Tradable" | "No liquidity" | "At boundary";
  volume: string;
};

type Position = {
  id: string;
  pair: string;
  poolIndex: number;
  range: string;
  liquidity: string;
  owed0: string;
  owed1: string;
  status: PositionStatus;
};

const pools: Pool[] = [
  {
    index: 0,
    pair: "MNTA / MNTB",
    token0: "MNTA",
    token1: "MNTB",
    fee: "0.30%",
    price: "1 MNTA = 1.2846 MNTB",
    range: "0.8600 - 1.6200",
    liquidity: 842300,
    status: "Tradable",
    volume: "128.44K",
  },
  {
    index: 1,
    pair: "MNTA / MNTB",
    token0: "MNTA",
    token1: "MNTB",
    fee: "0.05%",
    price: "1 MNTA = 1.3018 MNTB",
    range: "1.1000 - 1.4800",
    liquidity: 246900,
    status: "Tradable",
    volume: "41.08K",
  },
  {
    index: 2,
    pair: "MNTA / MNTC",
    token0: "MNTA",
    token1: "MNTC",
    fee: "0.30%",
    price: "1 MNTA = 0.7341 MNTC",
    range: "0.5000 - 0.9100",
    liquidity: 0,
    status: "No liquidity",
    volume: "0.00",
  },
  {
    index: 3,
    pair: "MNTB / MNTD",
    token0: "MNTB",
    token1: "MNTD",
    fee: "1.00%",
    price: "1 MNTB = 2.4781 MNTD",
    range: "2.1000 - 2.4800",
    liquidity: 102700,
    status: "At boundary",
    volume: "9.72K",
  },
  {
    index: 4,
    pair: "MNTC / MNTD",
    token0: "MNTC",
    token1: "MNTD",
    fee: "0.30%",
    price: "1 MNTC = 3.1104 MNTD",
    range: "2.4000 - 3.7000",
    liquidity: 532100,
    status: "Tradable",
    volume: "76.18K",
  },
];

const positions: Position[] = [
  {
    id: "#1842",
    pair: "MNTA / MNTB",
    poolIndex: 0,
    range: "0.8600 - 1.6200",
    liquidity: "42,810.39",
    owed0: "8.224 MNTA",
    owed1: "12.781 MNTB",
    status: "Collectable",
  },
  {
    id: "#1847",
    pair: "MNTC / MNTD",
    poolIndex: 4,
    range: "2.4000 - 3.7000",
    liquidity: "18,204.11",
    owed0: "0.000 MNTC",
    owed1: "0.000 MNTD",
    status: "Active",
  },
  {
    id: "#1795",
    pair: "MNTB / MNTD",
    poolIndex: 3,
    range: "2.1000 - 2.4800",
    liquidity: "0.00",
    owed0: "21.442 MNTB",
    owed1: "46.002 MNTD",
    status: "Closed",
  },
];

const tokens = TOKENS.map((token) => token.symbol);

export function App() {
  const [page, setPage] = useState<Page>("pools");
  const [query, setQuery] = useState("");
  const [fee, setFee] = useState("All fees");
  const [hideEmpty, setHideEmpty] = useState(true);
  const [selectedPoolIndex, setSelectedPoolIndex] = useState(0);
  const [drawer, setDrawer] = useState<"create" | "liquidity" | "swap" | null>(null);
  const [txStage, setTxStage] = useState<TxStage>("idle");
  const [zanFailed, setZanFailed] = useState(false);
  const [manualPosition, setManualPosition] = useState("");
  const [swapMode, setSwapMode] = useState<"input" | "output">("input");
  const [swapIn, setSwapIn] = useState("250");
  const [swapOut, setSwapOut] = useState("319.42");
  const wallet = useWallet();
  const isReady = wallet.status === "connected";
  const dexData = useDexData(wallet.account, isReady);
  const activePools = dexData.pools.length > 0 ? dexData.pools.map(displayPoolToUiPool) : pools;

  const filteredPools = useMemo(() => {
    return activePools.filter((pool) => {
      const matchesQuery = `${pool.pair} ${pool.index}`.toLowerCase().includes(query.toLowerCase());
      const matchesFee = fee === "All fees" || pool.fee === fee;
      const matchesEmpty = !hideEmpty || pool.liquidity > 0;
      return matchesQuery && matchesFee && matchesEmpty;
    });
  }, [activePools, fee, hideEmpty, query]);

  const selectedPool = activePools.find((pool) => pool.index === selectedPoolIndex) ?? activePools[0] ?? pools[0];

  function runTransaction(kind: "approve" | "swap" | "mint" | "collect" | "create") {
    if (!isReady) return;
    setTxStage(kind === "approve" ? "approve" : "sign");
    window.setTimeout(() => setTxStage("confirm"), 800);
    window.setTimeout(() => setTxStage("success"), 1800);
  }

  return (
    <main className="shell">
      <Sidebar page={page} setPage={setPage} />
      <section className="workspace">
        <Topbar
          account={wallet.account}
          status={wallet.status}
          error={wallet.error}
          connect={wallet.connect}
          switchToSepolia={wallet.switchToSepolia}
        />
        {page === "pools" && (
          <PoolsPage
            query={query}
            setQuery={setQuery}
            fee={fee}
            setFee={setFee}
            hideEmpty={hideEmpty}
            setHideEmpty={setHideEmpty}
            pools={filteredPools}
            selectedPool={selectedPool}
            setSelectedPoolIndex={setSelectedPoolIndex}
            openDrawer={setDrawer}
            runTransaction={runTransaction}
            isReady={isReady}
            chainLoading={dexData.loading}
            chainError={dexData.error}
            refreshChainData={dexData.refresh}
          />
        )}
        {page === "swap" && (
          <SwapPage
            swapMode={swapMode}
            setSwapMode={setSwapMode}
            swapIn={swapIn}
            swapOut={swapOut}
            setSwapIn={setSwapIn}
            setSwapOut={setSwapOut}
            openDrawer={setDrawer}
            runTransaction={runTransaction}
            isReady={isReady}
          />
        )}
        {page === "positions" && (
          <PositionsPage
            zanFailed={zanFailed}
            setZanFailed={setZanFailed}
            manualPosition={manualPosition}
            setManualPosition={setManualPosition}
            runTransaction={runTransaction}
            openDrawer={setDrawer}
            isReady={isReady}
          />
        )}
        {page === "activity" && <ActivityPage txStage={txStage} />}
      </section>
      <ContextPanel selectedPool={selectedPool} txStage={txStage} openDrawer={setDrawer} />
      {drawer && (
        <Drawer
          type={drawer}
          onClose={() => setDrawer(null)}
          selectedPool={selectedPool}
          txStage={txStage}
          runTransaction={runTransaction}
          isReady={isReady}
        />
      )}
    </main>
  );
}

function Sidebar({ page, setPage }: { page: Page; setPage: (page: Page) => void }) {
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

function Topbar({
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

function PoolsPage(props: {
  query: string;
  setQuery: (query: string) => void;
  fee: string;
  setFee: (fee: string) => void;
  hideEmpty: boolean;
  setHideEmpty: (hide: boolean) => void;
  pools: Pool[];
  selectedPool: Pool;
  setSelectedPoolIndex: (index: number) => void;
  openDrawer: (drawer: "create" | "liquidity" | "swap") => void;
  runTransaction: (kind: "approve" | "swap" | "mint" | "collect" | "create") => void;
  isReady: boolean;
  chainLoading: boolean;
  chainError?: string;
  refreshChainData: () => Promise<void>;
}) {
  return (
    <div className="page-grid">
      <section className="main-column">
        <div className="section-header">
          <div>
            <h2>Pools</h2>
            <p>All MetaNodeSwap pools, grouped by token pair, fee, range and current state.</p>
          </div>
          <button className="primary-button" onClick={() => props.openDrawer("create")}>
            <Plus size={16} /> Create pool
          </button>
        </div>
        {(props.chainLoading || props.chainError) && (
          <div className={props.chainError ? "inline-error compact-error" : "chain-banner"}>
            {props.chainError ? <X size={16} /> : <Loader2 size={16} />}
            <div>
              <strong>{props.chainError ? "Chain data unavailable" : "Loading Sepolia data"}</strong>
              <span>{props.chainError ?? "Reading PoolManager.getAllPools and ERC20 balances."}</span>
            </div>
            {props.chainError && (
              <button className="secondary-button" onClick={() => void props.refreshChainData()}>
                Retry
              </button>
            )}
          </div>
        )}
        <div className="toolbar">
          <label className="search-box">
            <Search size={16} />
            <input value={props.query} onChange={(event) => props.setQuery(event.target.value)} placeholder="Search pair or index" />
          </label>
          <label className="select-wrap">
            <Filter size={16} />
            <select value={props.fee} onChange={(event) => props.setFee(event.target.value)}>
              <option>All fees</option>
              <option>0.05%</option>
              <option>0.30%</option>
              <option>1.00%</option>
            </select>
            <ChevronDown size={14} />
          </label>
          <button className={`toggle ${props.hideEmpty ? "on" : ""}`} onClick={() => props.setHideEmpty(!props.hideEmpty)}>
            <span />
            Hide empty
          </button>
        </div>
        <PoolTable pools={props.pools} selectedPool={props.selectedPool} setSelectedPoolIndex={props.setSelectedPoolIndex} />
      </section>
      <section className="detail-column">
        <PoolDetail pool={props.selectedPool} openDrawer={props.openDrawer} runTransaction={props.runTransaction} isReady={props.isReady} />
      </section>
    </div>
  );
}

function PoolTable({
  pools,
  selectedPool,
  setSelectedPoolIndex,
}: {
  pools: Pool[];
  selectedPool: Pool;
  setSelectedPoolIndex: (index: number) => void;
}) {
  return (
    <div className="table-surface">
      <div className="table-row table-head">
        <span>Pair</span>
        <span>Index</span>
        <span>Fee</span>
        <span>Current rate</span>
        <span>Range</span>
        <span>Liquidity</span>
        <span>Status</span>
      </div>
      {pools.length === 0 ? (
        <div className="empty-state">
          <Database size={24} />
          <strong>No pools match this filter</strong>
          <span>Adjust token pair, fee, or include empty pools.</span>
        </div>
      ) : (
        pools.map((pool) => (
          <button
            key={pool.index}
            className={`table-row pool-row ${pool.index === selectedPool.index ? "selected" : ""}`}
            onClick={() => setSelectedPoolIndex(pool.index)}
          >
            <strong>{pool.pair}</strong>
            <code>#{pool.index}</code>
            <span>{pool.fee}</span>
            <span>{pool.price}</span>
            <span>{pool.range}</span>
            <span className="mono">{formatNumber(pool.liquidity)}</span>
            <StatusPill status={pool.status} />
          </button>
        ))
      )}
    </div>
  );
}

function PoolDetail({
  pool,
  openDrawer,
  runTransaction,
  isReady,
}: {
  pool: Pool;
  openDrawer: (drawer: "create" | "liquidity" | "swap") => void;
  runTransaction: (kind: "approve" | "swap" | "mint" | "collect" | "create") => void;
  isReady: boolean;
}) {
  return (
    <div className="detail-surface">
      <div className="detail-title">
        <div>
          <span className="label">Selected pool</span>
          <h3>{pool.pair}</h3>
        </div>
        <StatusPill status={pool.status} />
      </div>
      <div className="metric-list">
        <Metric label="Pool index" value={`#${pool.index}`} />
        <Metric label="Fee tier" value={pool.fee} />
        <Metric label="Liquidity" value={formatNumber(pool.liquidity)} />
        <Metric label="24h simulated volume" value={pool.volume} />
      </div>
      <div className="range-band">
        <div className="range-track">
          <span className="range-marker start" />
          <span className="range-marker current" />
          <span className="range-marker end" />
        </div>
        <div className="range-copy">
          <span>{pool.range}</span>
          <strong>{pool.price}</strong>
        </div>
      </div>
      <div className="stacked-actions">
        <button className="primary-button wide" onClick={() => openDrawer("liquidity")}>
          <Plus size={16} /> Add liquidity
        </button>
        <button className="secondary-button wide" onClick={() => openDrawer("swap")}>
          <ArrowDownUp size={16} /> Swap through this pool
        </button>
        <button className="ghost-button wide" onClick={() => runTransaction("approve")}>
          <ShieldCheck size={16} /> {isReady ? "Check allowances" : "Connect before write"}
        </button>
      </div>
    </div>
  );
}

function SwapPage(props: {
  swapMode: "input" | "output";
  setSwapMode: (mode: "input" | "output") => void;
  swapIn: string;
  swapOut: string;
  setSwapIn: (value: string) => void;
  setSwapOut: (value: string) => void;
  openDrawer: (drawer: "create" | "liquidity" | "swap") => void;
  runTransaction: (kind: "approve" | "swap" | "mint" | "collect" | "create") => void;
  isReady: boolean;
}) {
  return (
    <section className="swap-layout">
      <div className="swap-panel">
        <div className="section-header compact">
          <div>
            <h2>Swap</h2>
            <p>Quote against all same-pair pools and pick the better path.</p>
          </div>
          <button className="icon-button" title="Swap settings">
            <Settings2 size={16} />
          </button>
        </div>
        <div className="segment">
          <button className={props.swapMode === "input" ? "active" : ""} onClick={() => props.setSwapMode("input")}>
            Exact input
          </button>
          <button className={props.swapMode === "output" ? "active" : ""} onClick={() => props.setSwapMode("output")}>
            Exact output
          </button>
        </div>
        <TokenAmount label="Pay" token="MNTA" value={props.swapIn} onChange={props.setSwapIn} />
        <button className="swap-switch" onClick={() => {
          props.setSwapIn(props.swapOut);
          props.setSwapOut(props.swapIn);
        }}>
          <ArrowDownUp size={16} />
        </button>
        <TokenAmount label="Receive" token="MNTB" value={props.swapOut} onChange={props.setSwapOut} />
        <div className="quote-box">
          <Metric label="Best route" value="#0 then #1" />
          <Metric label="Rate" value="1 MNTA = 1.2776 MNTB" />
          <Metric label={props.swapMode === "input" ? "Minimum received" : "Maximum paid"} value={props.swapMode === "input" ? "316.21 MNTB" : "254.42 MNTA"} />
        </div>
        <button className="primary-button wide" onClick={() => props.runTransaction("swap")}>
          {props.isReady ? "Approve and swap" : "Connect wallet"}
        </button>
      </div>
      <div className="route-panel">
        <h3>Route candidates</h3>
        {pools.slice(0, 3).map((pool, index) => (
          <div className="candidate" key={pool.index}>
            <span className="candidate-rank">{index + 1}</span>
            <div>
              <strong>{pool.pair} #{pool.index}</strong>
              <span>{pool.fee} fee, {pool.range}</span>
            </div>
            <code>{index === 0 ? "best" : `${(index + 1) * 0.21}% worse`}</code>
          </div>
        ))}
      </div>
    </section>
  );
}

function PositionsPage(props: {
  zanFailed: boolean;
  setZanFailed: (failed: boolean) => void;
  manualPosition: string;
  setManualPosition: (position: string) => void;
  runTransaction: (kind: "approve" | "swap" | "mint" | "collect" | "create") => void;
  openDrawer: (drawer: "create" | "liquidity" | "swap") => void;
  isReady: boolean;
}) {
  return (
    <section className="main-column full">
      <div className="section-header">
        <div>
          <h2>Positions</h2>
          <p>LP NFTs from PositionManager, enriched through ZAN with a manual fallback path.</p>
        </div>
        <div className="inline-actions">
          <button className="secondary-button" onClick={() => props.setZanFailed(!props.zanFailed)}>
            <SlidersHorizontal size={16} /> Toggle ZAN state
          </button>
          <button className="primary-button" onClick={() => props.openDrawer("liquidity")}>
            <Plus size={16} /> Add liquidity
          </button>
        </div>
      </div>
      {props.zanFailed && (
        <div className="inline-error">
          <X size={16} />
          <div>
            <strong>ZAN query failed</strong>
            <span>Enter a positionId to call getPositionInfo directly.</span>
          </div>
          <input value={props.manualPosition} onChange={(event) => props.setManualPosition(event.target.value)} placeholder="positionId" />
          <button className="secondary-button">Query</button>
        </div>
      )}
      <div className="position-grid">
        {positions.map((position) => (
          <article className="position-row" key={position.id}>
            <div>
              <span className="label">{position.id}</span>
              <strong>{position.pair}</strong>
            </div>
            <Metric label="Pool" value={`#${position.poolIndex}`} />
            <Metric label="Range" value={position.range} />
            <Metric label="Liquidity" value={position.liquidity} />
            <Metric label="Owed" value={`${position.owed0} / ${position.owed1}`} />
            <span className={`position-status ${position.status.toLowerCase()}`}>{position.status}</span>
            <button className="secondary-button" onClick={() => props.runTransaction(position.status === "Collectable" ? "collect" : "mint")}>
              {position.status === "Collectable" ? "Collect" : position.status === "Closed" ? "Review" : "Manage"}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function ActivityPage({ txStage }: { txStage: TxStage }) {
  const events = [
    ["Quote refreshed", "quoteExactInput static call returned 319.42 MNTB"],
    ["Allowance checked", "MNTA allowance covers SwapRouter amountIn"],
    ["Pool sync", "getAllPools returned 5 pools"],
    ["Position sync", "ZAN returned 3 PositionManager NFTs"],
  ];

  return (
    <section className="main-column full">
      <div className="section-header">
        <div>
          <h2>Activity</h2>
          <p>Global transaction feedback and recent read/write actions.</p>
        </div>
      </div>
      <TxTimeline stage={txStage} />
      <div className="activity-list">
        {events.map(([title, detail]) => (
          <div className="activity-row" key={title}>
            <Clock3 size={16} />
            <div>
              <strong>{title}</strong>
              <span>{detail}</span>
            </div>
            <code>now</code>
          </div>
        ))}
      </div>
    </section>
  );
}

function ContextPanel({
  selectedPool,
  txStage,
  openDrawer,
}: {
  selectedPool: Pool;
  txStage: TxStage;
  openDrawer: (drawer: "create" | "liquidity" | "swap") => void;
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

function Drawer({
  type,
  onClose,
  selectedPool,
  txStage,
  runTransaction,
  isReady,
}: {
  type: "create" | "liquidity" | "swap";
  onClose: () => void;
  selectedPool: Pool;
  txStage: TxStage;
  runTransaction: (kind: "approve" | "swap" | "mint" | "collect" | "create") => void;
  isReady: boolean;
}) {
  const title = type === "create" ? "Create pool" : type === "liquidity" ? "Add liquidity" : "Swap through pool";
  const action = type === "create" ? "create" : type === "liquidity" ? "mint" : "swap";
  return (
    <div className="drawer-backdrop">
      <aside className="drawer">
        <header className="drawer-head">
          <div>
            <span className="label">{selectedPool.pair}</span>
            <h2>{title}</h2>
          </div>
          <button className="icon-button" onClick={onClose} title="Close">
            <X size={16} />
          </button>
        </header>
        {type === "create" ? <CreatePoolForm /> : type === "liquidity" ? <LiquidityForm selectedPool={selectedPool} /> : <SwapDrawerForm selectedPool={selectedPool} />}
        <TxTimeline stage={txStage} />
        <button className="primary-button wide" onClick={() => runTransaction(action)}>
          {isReady ? primaryLabel(type, txStage) : "Connect wallet"}
        </button>
      </aside>
    </div>
  );
}

function CreatePoolForm() {
  return (
    <div className="form-stack">
      <TokenSelect label="Token 0" value="MNTA" />
      <TokenSelect label="Token 1" value="MNTD" />
      <InputBlock label="Fee tier" value="0.30%" helper="Sorted token order is handled before contract call." />
      <InputBlock label="Initial rate" value="1 MNTA = 2.1200 MNTD" />
      <InputBlock label="Minimum rate" value="1.8000" />
      <InputBlock label="Maximum rate" value="2.7000" />
    </div>
  );
}

function LiquidityForm({ selectedPool }: { selectedPool: Pool }) {
  return (
    <div className="form-stack">
      <InputBlock label="Pool" value={`${selectedPool.pair} #${selectedPool.index}`} helper={`Fixed range ${selectedPool.range}`} />
      <TokenAmount label={`${selectedPool.token0} amount`} token={selectedPool.token0} value="140.00" onChange={() => undefined} />
      <TokenAmount label={`${selectedPool.token1} amount`} token={selectedPool.token1} value="179.84" onChange={() => undefined} />
      <div className="quote-box">
        <Metric label="Estimated use" value={`138.21 ${selectedPool.token0} / 177.40 ${selectedPool.token1}`} />
        <Metric label="Approve target" value="PositionManager" />
      </div>
    </div>
  );
}

function SwapDrawerForm({ selectedPool }: { selectedPool: Pool }) {
  return (
    <div className="form-stack">
      <InputBlock label="Route" value={`${selectedPool.pair} #${selectedPool.index}`} helper="Only same-pair multi-pool routing is included." />
      <TokenAmount label="Pay" token={selectedPool.token0} value="250.00" onChange={() => undefined} />
      <TokenAmount label="Receive" token={selectedPool.token1} value="319.42" onChange={() => undefined} />
      <InputBlock label="Slippage" value="0.50%" />
    </div>
  );
}

function TokenSelect({ label, value }: { label: string; value: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select defaultValue={value}>
        {tokens.map((token) => (
          <option key={token}>{token}</option>
        ))}
      </select>
    </label>
  );
}

function InputBlock({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input defaultValue={value} />
      {helper && <small>{helper}</small>}
    </label>
  );
}

function TokenAmount({
  label,
  token,
  value,
  onChange,
}: {
  label: string;
  token: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="token-amount">
      <span>{label}</span>
      <div>
        <input value={value} onChange={(event) => onChange(event.target.value)} />
        <button type="button">{token}</button>
      </div>
      <small>Balance 1,260.42</small>
    </label>
  );
}

function TxTimeline({ stage, compact = false }: { stage: TxStage; compact?: boolean }) {
  const steps = [
    ["approve", "Approve"],
    ["sign", "Sign"],
    ["confirm", "Confirm"],
    ["success", "Complete"],
  ] as const;
  const order = ["idle", "approve", "sign", "confirm", "success", "error"];
  const activeIndex = Math.max(0, order.indexOf(stage));

  return (
    <div className={`tx-timeline ${compact ? "compact" : ""}`}>
      {steps.map(([key, label], index) => {
        const active = activeIndex >= index + 1;
        const current = stage === key;
        return (
          <div className={`tx-step ${active ? "active" : ""} ${current ? "current" : ""}`} key={key}>
            <span>{current ? <Loader2 size={13} /> : active ? <Check size={13} /> : index + 1}</span>
            <strong>{label}</strong>
          </div>
        );
      })}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatusPill({ status }: { status: Pool["status"] }) {
  return <span className={`status-pill ${status.toLowerCase().replace(" ", "-")}`}>{status}</span>;
}

function primaryLabel(type: "create" | "liquidity" | "swap", stage: TxStage) {
  if (stage === "approve") return "Approving";
  if (stage === "sign") return "Waiting for signature";
  if (stage === "confirm") return "Confirming";
  if (stage === "success") return "Submitted";
  if (type === "create") return "Create pool";
  if (type === "liquidity") return "Approve and mint";
  return "Approve and swap";
}

function formatNumber(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function displayPoolToUiPool(pool: DisplayPool): Pool {
  const pair = `${pool.token0.symbol} / ${pool.token1.symbol}`;
  return {
    index: pool.index,
    pair,
    token0: pool.token0.symbol,
    token1: pool.token1.symbol,
    fee: feeToPercent(pool.fee),
    price: `tick ${pool.tick.toString()}`,
    range: `${pool.tickLower.toString()} - ${pool.tickUpper.toString()} ticks`,
    liquidity: Number(pool.liquidity > BigInt(Number.MAX_SAFE_INTEGER) ? BigInt(Number.MAX_SAFE_INTEGER) : pool.liquidity),
    status: pool.status,
    volume: "chain",
  };
}
