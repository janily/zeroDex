import { useRef, useState } from "react";
import { ArrowDownUp, ArrowRight, ChevronDown, ChevronLeft, ChevronRight, CircleAlert, Layers3, ListFilter, Loader2, Plus, ScanLine, Search, Wallet, X } from "lucide-react";
import { Metric, StatusPill } from "../components/common";
import { PageHeader } from "../components/layout";
import { WorkspaceState } from "../components/WorkspaceState";
import { formatNumber } from "../lib/uiFormat";
import type { OpenDrawer } from "../types/app";
import type { Pool } from "../types/ui";
import "../workspace-pages.css";

const pageSize = 10;

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
  onConnect: () => void;
  onConnectLabel: string;
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(props.pools.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const search = useRef<HTMLInputElement>(null);
  const inspector = useRef<HTMLElement>(null);
  const hasFilters = Boolean(props.query || props.fee !== "All fees" || props.hideEmpty);

  const selectPool = (pool: Pool) => {
    props.setSelectedPoolId(pool.id);
    if (window.matchMedia("(max-width: 900px)").matches) inspector.current?.focus();
  };

  return (
    <div className="market-page">
      <PageHeader title="Liquidity pools" description="Explore token pairs, compare fee tiers, and manage liquidity on Sepolia." action={
        <button className="primary-button" onClick={() => props.openDrawer("create")} disabled={!props.isReady}>
          <Plus size={17} /> Create pool
        </button>
      } />
      <div className="market-layout">
        <section className="market-card" aria-labelledby="directory-title">
          <header className="market-card-heading">
            <Layers3 aria-hidden="true" size={19} />
            <h2 id="directory-title">Pool directory</h2>
            {props.isReady && !props.chainLoading && !props.chainError &&
              <span className="market-count">{props.pools.length} {props.pools.length === 1 ? "pool" : "pools"}</span>}
          </header>
          <div className="market-toolbar">
            <div className="pool-search">
              <Search size={16} aria-hidden="true" />
              <input ref={search} aria-label="Search pools by pair or index" value={props.query}
                onChange={(event) => { props.setQuery(event.target.value); setPage(1); }} placeholder="Search pair or index" />
              {props.query && <button className="clear-query" aria-label="Clear search" onClick={() => {
                props.setQuery(""); setPage(1); search.current?.focus();
              }}><X size={15} /></button>}
            </div>
            <label className="pool-fee">
              <ListFilter size={15} aria-hidden="true" />
              <select aria-label="Fee tier" value={props.fee} onChange={(event) => { props.setFee(event.target.value); setPage(1); }}>
                <option>All fees</option>
                <option>0.05%</option>
                <option>0.30%</option>
                <option>1.00%</option>
              </select>
              <ChevronDown size={13} aria-hidden="true" />
            </label>
            <button className="pool-toggle" aria-pressed={props.hideEmpty} onClick={() => { props.setHideEmpty(!props.hideEmpty); setPage(1); }}>
              <span aria-hidden="true" /> Hide empty
            </button>
          </div>
          {props.chainError && (
            <div className="market-notice" role="alert">
              <CircleAlert size={17} />
              <div><strong>Chain data warning</strong><p>{props.chainError}</p></div>
              <button className="secondary-button" onClick={() => void props.refreshChainData()}>Retry</button>
            </div>
          )}
          <div className="pool-table-scroll">
            <table className="pool-directory" aria-label="Liquidity pools">
              <thead><tr>{["Token pair", "Fee tier", "Tick / range", "Liquidity", "Status"].map((label) => <th key={label} scope="col">{label}</th>)}</tr></thead>
              <tbody>
                {props.pools.slice(start, start + pageSize).map((pool) => (
                  <tr key={pool.id} className={pool.id === props.selectedPool.id ? "is-selected" : undefined}
                    onClick={() => selectPool(pool)}>
                    <td><button className="pool-pair-button" aria-pressed={pool.id === props.selectedPool.id} onClick={(event) => {
                      event.stopPropagation(); selectPool(pool);
                    }}>
                      <strong>{pool.pair}</strong><small>Pool #{pool.index}</small>
                    </button></td>
                    <td>{pool.fee}</td>
                    <td>{pool.price}<small>{pool.range}</small></td>
                    <td>{formatNumber(pool.liquidity)}</td>
                    <td><StatusPill status={pool.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!props.pools.length && (
            !props.isReady ? <WorkspaceState icon={Wallet} title="Connect to view pools"
              description="Connect your wallet to load live pool data from Sepolia." action={
                <button className="primary-button" onClick={props.onConnect}>{props.onConnectLabel}<ArrowRight size={15} /></button>
              } /> :
            props.chainLoading ? <WorkspaceState icon={Loader2} title="Loading pools" description="Reading the latest liquidity and fees from Sepolia." loading /> :
            props.chainError ? <WorkspaceState icon={Layers3} title="No pools to display" description="Retry the chain data request to update the directory." /> :
            <WorkspaceState icon={Search} title="No pools found" description={hasFilters ? "Try a different pair, fee tier, or liquidity filter." : "Create a pool to make a new token pair available."}
              action={hasFilters && <button className="secondary-button" onClick={() => {
                props.setQuery(""); props.setFee("All fees"); props.setHideEmpty(false); setPage(1); search.current?.focus();
              }}>Clear filters</button>} />
          )}
          {totalPages > 1 && (
            <nav className="pool-pagination" aria-label="Pool directory pages">
              <span>{start + 1}–{Math.min(start + pageSize, props.pools.length)} of {props.pools.length} pools</span>
              <button className="icon-button" aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={16} /></button>
              <button className="icon-button" aria-label="Next page" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}><ChevronRight size={16} /></button>
            </nav>
          )}
        </section>
        <aside className="market-card pool-inspector" ref={inspector} tabIndex={-1} aria-labelledby="inspector-title">
          <header className="market-card-heading"><ScanLine size={19} aria-hidden="true" /><h2 id="inspector-title">Pool details</h2></header>
          {props.isReady && props.hasSelectedChainPool ? (
            <div className="pool-inspector-body">
              <div className="pool-inspector-pair"><h3>{props.selectedPool.pair}</h3><StatusPill status={props.selectedPool.status} /></div>
              <div className="pool-inspector-metrics">
                <Metric label="Pool index" value={`#${props.selectedPool.index}`} />
                <Metric label="Fee tier" value={props.selectedPool.fee} />
                <Metric label="Liquidity" value={formatNumber(props.selectedPool.liquidity)} />
                <Metric label="24h volume" value={props.selectedPool.volume} />
                <Metric label="Current tick" value={props.selectedPool.price} />
                <Metric label="Tick range" value={props.selectedPool.range} />
              </div>
              <div className="stacked-actions">
                <button className="primary-button" onClick={() => props.openDrawer("liquidity")}><Plus size={16} /> Add liquidity</button>
                <button className="secondary-button" onClick={() => props.onSwapPool(props.selectedPool)}><ArrowDownUp size={16} /> Swap through this pool</button>
              </div>
            </div>
          ) : (
            <WorkspaceState icon={ScanLine} title="No pool selected" description="Select a token pair to inspect its liquidity, fee tier, and tick range." />
          )}
        </aside>
      </div>
    </div>
  );
}
