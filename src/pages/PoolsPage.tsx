import { ArrowDownUp, ChevronDown, Database, Filter, Loader2, Plus, Search, ShieldCheck, X } from "lucide-react";
import { formatNumber } from "../lib/uiFormat";
import type { OpenDrawer, RunTransaction } from "../types/app";
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
  setSelectedPoolIndex: (index: number) => void;
  openDrawer: OpenDrawer;
  runTransaction: RunTransaction;
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
  openDrawer: OpenDrawer;
  runTransaction: RunTransaction;
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
