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
import { usePositions } from "./hooks/usePositions";
import { useTransactions } from "./hooks/useTransactions";
import { useWallet, type WalletStatus } from "./hooks/useWallet";
import { getWriteContracts } from "./lib/contracts";
import { buildCreatePoolParams } from "./lib/createPool";
import { parseTokenAmount } from "./lib/amount";
import { feeToPercent } from "./lib/price";
import type { DisplayPool, TransactionStage } from "./types/domain";

type Page = "swap" | "pools" | "positions" | "activity";
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
  const [zanFailed, setZanFailed] = useState(false);
  const [manualPosition, setManualPosition] = useState("");
  const [manualQueriedPosition, setManualQueriedPosition] = useState<{ id: string; raw: unknown } | undefined>();
  const [swapMode, setSwapMode] = useState<"input" | "output">("input");
  const [swapIn, setSwapIn] = useState("250");
  const [swapOut, setSwapOut] = useState("319.42");
  const wallet = useWallet();
  const isReady = wallet.status === "connected";
  const transactions = useTransactions();
  const dexData = useDexData(wallet.account, isReady);
  const positionData = usePositions(wallet.account, isReady);
  const activePools = dexData.pools.length > 0 ? dexData.pools.map(displayPoolToUiPool) : pools;
  const chainPositions = [...positionData.positions, ...(manualQueriedPosition ? [manualQueriedPosition] : [])];
  const activePositions = chainPositions.length > 0 ? chainPositions.map(positionDetailsToUiPosition) : positions;

  const filteredPools = useMemo(() => {
    return activePools.filter((pool) => {
      const matchesQuery = `${pool.pair} ${pool.index}`.toLowerCase().includes(query.toLowerCase());
      const matchesFee = fee === "All fees" || pool.fee === fee;
      const matchesEmpty = !hideEmpty || pool.liquidity > 0;
      return matchesQuery && matchesFee && matchesEmpty;
    });
  }, [activePools, fee, hideEmpty, query]);

  const selectedPool = activePools.find((pool) => pool.index === selectedPoolIndex) ?? activePools[0] ?? pools[0];
  const selectedDisplayPool = dexData.pools.find((pool) => pool.index === selectedPool.index);

  async function runTransaction(kind: "approve" | "swap" | "mint" | "collect" | "burn" | "create", payload?: TransactionPayload) {
    if (!isReady || !wallet.account || !window.ethereum) return;
    if (kind === "approve") return;

    await transactions.runWrite(async () => {
      const contracts = await getWriteContracts(window.ethereum!);
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 20 * 60);

      if (kind === "create" && payload?.type === "create") {
        return contracts.poolManager.createAndInitializePoolIfNecessary(buildCreatePoolParams(payload));
      }

      if (kind === "mint" && selectedDisplayPool && payload?.type === "liquidity") {
        return contracts.positionManager.mint({
          token0: selectedDisplayPool.token0.address,
          token1: selectedDisplayPool.token1.address,
          index: BigInt(selectedDisplayPool.index),
          amount0Desired: parseTokenAmount(payload.amount0, selectedDisplayPool.token0.decimals),
          amount1Desired: parseTokenAmount(payload.amount1, selectedDisplayPool.token1.decimals),
          recipient: wallet.account,
          deadline,
        });
      }

      if (kind === "swap" && selectedDisplayPool && payload?.type === "swap") {
        return contracts.swapRouter.exactInput({
          tokenIn: selectedDisplayPool.token0.address,
          tokenOut: selectedDisplayPool.token1.address,
          indexPath: [BigInt(selectedDisplayPool.index)],
          recipient: wallet.account,
          deadline,
          amountIn: parseTokenAmount(payload.amountIn, selectedDisplayPool.token0.decimals),
          amountOutMinimum: 0n,
          sqrtPriceLimitX96: 0n,
        });
      }

      if (kind === "collect" && payload?.type === "position") {
        return contracts.positionManager.collect(BigInt(payload.positionId), wallet.account);
      }

      if (kind === "burn" && payload?.type === "position") {
        return contracts.positionManager.burn(BigInt(payload.positionId));
      }

      throw new Error("Load Sepolia pool data before submitting this transaction");
    });
    if (transactions.stage === "success") {
      await dexData.refresh();
    }
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
            positions={activePositions}
            positionsLoading={positionData.loading}
            positionsError={positionData.error}
            queryManualPosition={async (positionId) => {
              const next = await positionData.fetchManualPosition(positionId);
              setManualQueriedPosition(next);
              setManualPosition(next.id);
            }}
          />
        )}
        {page === "activity" && <ActivityPage txStage={transactions.stage} />}
      </section>
      <ContextPanel selectedPool={selectedPool} txStage={transactions.stage} openDrawer={setDrawer} />
      {drawer && (
        <Drawer
          type={drawer}
          onClose={() => setDrawer(null)}
          selectedPool={selectedPool}
          selectedDisplayPool={selectedDisplayPool}
          txStage={transactions.stage}
          txError={transactions.error}
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
  runTransaction: (kind: "approve" | "swap" | "mint" | "collect" | "burn" | "create") => Promise<void>;
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
  runTransaction: (kind: "approve" | "swap" | "mint" | "collect" | "burn" | "create") => Promise<void>;
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
  runTransaction: (kind: "approve" | "swap" | "mint" | "collect" | "burn" | "create", payload?: TransactionPayload) => Promise<void>;
  openDrawer: (drawer: "create" | "liquidity" | "swap") => void;
  isReady: boolean;
  positions: Position[];
  positionsLoading: boolean;
  positionsError?: string;
  queryManualPosition: (positionId: string) => Promise<void>;
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
      {(props.positionsLoading || props.positionsError) && (
        <div className={props.positionsError ? "inline-error compact-error" : "chain-banner"}>
          {props.positionsError ? <X size={16} /> : <Loader2 size={16} />}
          <div>
            <strong>{props.positionsError ? "Position lookup unavailable" : "Loading LP positions"}</strong>
            <span>{props.positionsError ?? "Reading ZAN NFT IDs and PositionManager.getPositionInfo."}</span>
          </div>
        </div>
      )}
      {props.zanFailed && (
        <div className="inline-error">
          <X size={16} />
          <div>
            <strong>ZAN query failed</strong>
            <span>Enter a positionId to call getPositionInfo directly.</span>
          </div>
          <input value={props.manualPosition} onChange={(event) => props.setManualPosition(event.target.value)} placeholder="positionId" />
          <button className="secondary-button" onClick={() => void props.queryManualPosition(props.manualPosition)}>
            Query
          </button>
        </div>
      )}
      <div className="position-grid">
        {props.positions.map((position) => (
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
            <button
              className="secondary-button"
              disabled={!props.isReady}
              onClick={() =>
                void props.runTransaction(position.status === "Collectable" ? "collect" : "burn", {
                  type: "position",
                  positionId: position.id.replace("#", ""),
                })
              }
            >
              {position.status === "Collectable" ? "Collect" : position.status === "Closed" ? "Review" : "Burn"}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function ActivityPage({ txStage }: { txStage: TransactionStage }) {
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
  txStage: TransactionStage;
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
  selectedDisplayPool,
  txStage,
  txError,
  runTransaction,
  isReady,
}: {
  type: "create" | "liquidity" | "swap";
  onClose: () => void;
  selectedPool: Pool;
  selectedDisplayPool?: DisplayPool;
  txStage: TransactionStage;
  txError?: string;
  runTransaction: (kind: "approve" | "swap" | "mint" | "collect" | "burn" | "create", payload?: TransactionPayload) => Promise<void>;
  isReady: boolean;
}) {
  const [createForm, setCreateForm] = useState<CreateDrawerState>({
    type: "create",
    tokenA: TOKENS[0].address,
    tokenB: TOKENS[1].address,
    feePercent: "0.30%",
    initialRate: "1.2",
    minRate: "1.0",
    maxRate: "1.5",
  });
  const [liquidityForm, setLiquidityForm] = useState<LiquidityDrawerState>({
    type: "liquidity",
    amount0: "140",
    amount1: "179.84",
  });
  const [swapForm, setSwapForm] = useState<SwapDrawerState>({
    type: "swap",
    amountIn: "250",
  });
  const title = type === "create" ? "Create pool" : type === "liquidity" ? "Add liquidity" : "Swap through pool";
  const action = type === "create" ? "create" : type === "liquidity" ? "mint" : "swap";
  const payload = type === "create" ? createForm : type === "liquidity" ? liquidityForm : swapForm;
  const canSubmit = isReady && (type === "create" || Boolean(selectedDisplayPool));
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
        {type === "create" ? (
          <CreatePoolForm value={createForm} onChange={setCreateForm} />
        ) : type === "liquidity" ? (
          <LiquidityForm selectedPool={selectedPool} value={liquidityForm} onChange={setLiquidityForm} />
        ) : (
          <SwapDrawerForm selectedPool={selectedPool} value={swapForm} onChange={setSwapForm} />
        )}
        {!selectedDisplayPool && type !== "create" && (
          <div className="inline-error compact-error">
            <X size={16} />
            <div>
              <strong>Chain pool required</strong>
              <span>Connect Sepolia and refresh pools before submitting this write.</span>
            </div>
          </div>
        )}
        {txError && (
          <div className="inline-error compact-error">
            <X size={16} />
            <div>
              <strong>Transaction failed</strong>
              <span>{txError}</span>
            </div>
          </div>
        )}
        <TxTimeline stage={txStage} />
        <button className="primary-button wide" disabled={!canSubmit} onClick={() => void runTransaction(action, payload)}>
          {isReady ? primaryLabel(type, txStage) : "Connect wallet"}
        </button>
      </aside>
    </div>
  );
}

type CreateDrawerState = {
  type: "create";
  tokenA: (typeof TOKENS)[number]["address"];
  tokenB: (typeof TOKENS)[number]["address"];
  feePercent: string;
  initialRate: string;
  minRate: string;
  maxRate: string;
};

type LiquidityDrawerState = {
  type: "liquidity";
  amount0: string;
  amount1: string;
};

type SwapDrawerState = {
  type: "swap";
  amountIn: string;
};

type DrawerSubmitPayload = CreateDrawerState | LiquidityDrawerState | SwapDrawerState;
type PositionSubmitPayload = {
  type: "position";
  positionId: string;
};
type TransactionPayload = DrawerSubmitPayload | PositionSubmitPayload;

function CreatePoolForm({ value, onChange }: { value: CreateDrawerState; onChange: (value: CreateDrawerState) => void }) {
  return (
    <div className="form-stack">
      <TokenSelect label="Token 0" value={value.tokenA} onChange={(tokenA) => onChange({ ...value, tokenA })} />
      <TokenSelect label="Token 1" value={value.tokenB} onChange={(tokenB) => onChange({ ...value, tokenB })} />
      <InputBlock label="Fee tier" value={value.feePercent} onChange={(feePercent) => onChange({ ...value, feePercent })} helper="Sorted token order is handled before contract call." />
      <InputBlock label="Initial rate" value={value.initialRate} onChange={(initialRate) => onChange({ ...value, initialRate })} />
      <InputBlock label="Minimum rate" value={value.minRate} onChange={(minRate) => onChange({ ...value, minRate })} />
      <InputBlock label="Maximum rate" value={value.maxRate} onChange={(maxRate) => onChange({ ...value, maxRate })} />
    </div>
  );
}

function LiquidityForm({
  selectedPool,
  value,
  onChange,
}: {
  selectedPool: Pool;
  value: LiquidityDrawerState;
  onChange: (value: LiquidityDrawerState) => void;
}) {
  return (
    <div className="form-stack">
      <InputBlock label="Pool" value={`${selectedPool.pair} #${selectedPool.index}`} helper={`Fixed range ${selectedPool.range}`} />
      <TokenAmount label={`${selectedPool.token0} amount`} token={selectedPool.token0} value={value.amount0} onChange={(amount0) => onChange({ ...value, amount0 })} />
      <TokenAmount label={`${selectedPool.token1} amount`} token={selectedPool.token1} value={value.amount1} onChange={(amount1) => onChange({ ...value, amount1 })} />
      <div className="quote-box">
        <Metric label="Desired amounts" value={`${value.amount0} ${selectedPool.token0} / ${value.amount1} ${selectedPool.token1}`} />
        <Metric label="Approve target" value="PositionManager" />
      </div>
    </div>
  );
}

function SwapDrawerForm({
  selectedPool,
  value,
  onChange,
}: {
  selectedPool: Pool;
  value: SwapDrawerState;
  onChange: (value: SwapDrawerState) => void;
}) {
  return (
    <div className="form-stack">
      <InputBlock label="Route" value={`${selectedPool.pair} #${selectedPool.index}`} helper="Only same-pair multi-pool routing is included." />
      <TokenAmount label="Pay" token={selectedPool.token0} value={value.amountIn} onChange={(amountIn) => onChange({ ...value, amountIn })} />
      <InputBlock label="Receive" value="Quoted on submit" />
      <InputBlock label="Slippage" value="0.50%" />
    </div>
  );
}

function TokenSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: (typeof TOKENS)[number]["address"];
  onChange: (value: (typeof TOKENS)[number]["address"]) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value as (typeof TOKENS)[number]["address"])}>
        {tokens.map((token) => (
          <option key={token} value={TOKENS.find((item) => item.symbol === token)?.address}>
            {token}
          </option>
        ))}
      </select>
    </label>
  );
}

function InputBlock({ label, value, helper, onChange }: { label: string; value: string; helper?: string; onChange?: (value: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange?.(event.target.value)} readOnly={!onChange} />
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

function TxTimeline({ stage, compact = false }: { stage: TransactionStage; compact?: boolean }) {
  const steps = [
    ["waiting-signature", "Sign"],
    ["submitted", "Submit"],
    ["confirming", "Confirm"],
    ["success", "Complete"],
  ] as const;
  const order = ["idle", "waiting-signature", "submitted", "confirming", "success", "rejected", "error"];
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

function primaryLabel(type: "create" | "liquidity" | "swap", stage: TransactionStage) {
  if (stage === "waiting-signature") return "Waiting for signature";
  if (stage === "submitted") return "Submitted";
  if (stage === "confirming") return "Confirming";
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

function positionDetailsToUiPosition(position: { id: string; raw: unknown }): Position {
  const raw = position.raw as Record<string, unknown>;
  const liquidity = BigInt((raw.liquidity as bigint | string | number | undefined) ?? 0);
  const owed0 = BigInt((raw.tokensOwed0 as bigint | string | number | undefined) ?? 0);
  const owed1 = BigInt((raw.tokensOwed1 as bigint | string | number | undefined) ?? 0);
  const status: PositionStatus = owed0 > 0n || owed1 > 0n ? "Collectable" : liquidity > 0n ? "Active" : "Closed";
  return {
    id: `#${position.id}`,
    pair: "PositionManager NFT",
    poolIndex: Number((raw.index as bigint | string | number | undefined) ?? 0),
    range: `${String(raw.tickLower ?? "-")} - ${String(raw.tickUpper ?? "-")}`,
    liquidity: liquidity.toString(),
    owed0: owed0.toString(),
    owed1: owed1.toString(),
    status,
  };
}
