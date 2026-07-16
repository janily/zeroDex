import { ArrowDownUp, ChevronDown, Database, Filter, Loader2, Plus, Search, X } from "lucide-react";
import { formatNumber } from "../lib/uiFormat";
import type { OpenDrawer } from "../types/app";
import type { Pool } from "../types/ui";
import { Metric, StatusPill } from "../components/common";

export function PoolsPage(props: {
  query: string;
  setQuery: (query: string) => void;
  fee: string;
  setFee: (fee: string) => void;
  hideEmpty: boolean;
  setHideEmpty: (hide: boolean) => void;
  pools: Pool[];
  selectedPool: Pool;
  setSelectedPoolId: (id: string) => void;
  openDrawer: OpenDrawer;
  isReady: boolean;
  chainLoading: boolean;
  chainError?: string;
  refreshChainData: () => Promise<void>;
  onSwapPool: (pool: Pool) => void;
  hasSelectedChainPool: boolean;
}) {
  return (
    <div className="page-grid pools-page-grid">
      <section className="main-column">
        {!props.isReady && <div className="chain-banner"><Database size={16} /><div><strong>Chain data paused</strong><span>Connect a Sepolia wallet to load pools and balances.</span></div></div>}
        <div className="section-header">
          <div>
            <h2>Pools</h2>
            <p>All MetaNodeSwap pools, grouped by token pair, fee, range and current state.</p>
          </div>
          <button className="primary-button" onClick={() => props.openDrawer("create")} disabled={!props.isReady}>
            <Plus size={16} /> Create pool
          </button>
        </div>
        {(props.chainLoading || props.chainError) && (
          <div className={props.chainError ? "inline-error compact-error" : "chain-banner"}>
            {props.chainError ? <X size={16} /> : <Loader2 size={16} />}
            <div>
              <strong>{props.chainError ? "Chain data warning" : "Loading Sepolia data"}</strong>
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
        <PoolTable pools={props.pools} selectedPool={props.selectedPool} setSelectedPoolId={props.setSelectedPoolId} isReady={props.isReady} />
      </section>
      <section className="detail-column">
        <PoolDetail pool={props.selectedPool} openDrawer={props.openDrawer} onSwapPool={props.onSwapPool} isReady={props.isReady && props.hasSelectedChainPool} />
      </section>
    </div>
  );
}

function PoolTable({
  pools,
  selectedPool,
  setSelectedPoolId,
  isReady,
}: {
  pools: Pool[];
  selectedPool: Pool;
  setSelectedPoolId: (id: string) => void;
  isReady: boolean;
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
          <strong>{isReady ? "No pools found" : "Connect wallet to load pools"}</strong>
          <span>{isReady ? "Adjust the filters or create the first pool for this pair." : "Pool data is read directly from Sepolia."}</span>
        </div>
      ) : (
        pools.map((pool) => (
          <button
            key={pool.id}
            className={`table-row pool-row ${pool.id === selectedPool.id ? "selected" : ""}`}
            onClick={() => setSelectedPoolId(pool.id)}
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
  onSwapPool,
  isReady,
}: {
  pool: Pool;
  openDrawer: OpenDrawer;
  onSwapPool: (pool: Pool) => void;
  isReady: boolean;
}) {
  if (!isReady) {
    return (
      <div className="detail-surface">
        <div className="empty-state">
          <Database size={24} />
          <strong>No on-chain pool selected</strong>
          <span>Connect to Sepolia and select a pool to view its details.</span>
        </div>
      </div>
    );
  }

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
        <Metric label="24h volume" value={pool.volume} />
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
        <button className="primary-button wide" onClick={() => openDrawer("liquidity")} disabled={!isReady}>
          <Plus size={16} /> Add liquidity
        </button>
        <button className="secondary-button wide" onClick={() => onSwapPool(pool)} disabled={!isReady}>
          <ArrowDownUp size={16} /> Swap through this pool
        </button>
      </div>
    </div>
  );
}
