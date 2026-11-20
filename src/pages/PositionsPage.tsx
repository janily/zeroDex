import { useState } from "react";
import { ArrowRight, CircleAlert, ExternalLink, Layers3, Loader2, Plus, Search, Wallet } from "lucide-react";
import type { OpenDrawer, RunTransaction } from "../types/app";
import type { Position } from "../types/ui";
import { Metric } from "../components/common";
import { PageHeader } from "../components/layout";
import { WorkspaceState } from "../components/WorkspaceState";
import "../workspace-pages.css";

export function PositionsPage(props: {
  manualPosition: string;
  setManualPosition: (position: string) => void;
  manualPositionError?: string;
  runTransaction: RunTransaction;
  openDrawer: OpenDrawer;
  canAddLiquidity: boolean;
  canWritePositions: boolean;
  walletAccount?: string;
  positions: Position[];
  positionsLoading: boolean;
  positionsError?: string;
  isReady: boolean;
  showManualLookup: boolean;
  queryManualPosition: (positionId: string) => Promise<void>;
  onConnect: () => void;
  onConnectLabel: string;
}) {
  const [lookingUp, setLookingUp] = useState(false);
  return (
    <div className="market-page">
      <PageHeader title="Positions" description="Manage your liquidity positions and collect tokens owed to your wallet." action={
        <button className="primary-button" onClick={() => props.openDrawer("liquidity")} disabled={!props.canAddLiquidity}>
          <Plus size={17} /> Add liquidity
        </button>
      } />
      <section className="market-card" aria-labelledby="positions-title">
        <header className="market-card-heading"><Layers3 size={19} aria-hidden="true" /><h2 id="positions-title">Your positions</h2>
          {props.isReady && !props.positionsLoading && !props.positionsError && <span className="market-count">{props.positions.length} {props.positions.length === 1 ? "position" : "positions"}</span>}
        </header>
        {props.positionsError && (
          <div className="market-notice" role="alert"><CircleAlert size={17} /><div><strong>Position lookup warning</strong><p>{props.positionsError}</p></div></div>
        )}
        {!props.positions.length && (
          !props.isReady ? <WorkspaceState icon={Wallet} title="Connect to view positions" description="Connect your wallet to load the liquidity positions you own on Sepolia." action={
            <button className="primary-button" onClick={props.onConnect}>{props.onConnectLabel}<ArrowRight size={15} /></button>
          } /> :
          props.positionsLoading ? <WorkspaceState icon={Loader2} title="Loading positions" description="Looking up your position NFTs and reading their on-chain details." loading /> :
          <WorkspaceState icon={Layers3} title="No positions to display" description="Add liquidity to mint a position, or look up an existing position by its ID." />
        )}
        <div className="owned-positions">
          {props.positions.map((position) => {
            const isOwned = Boolean(props.canWritePositions && props.walletAccount && position.owner &&
              props.walletAccount.toLowerCase() === position.owner.toLowerCase());
            const action = position.status === "Active" ? "burn" : position.status === "Collectable" ? "collect" : undefined;
            return (
              <article className="owned-position" key={position.id}>
                <header>
                  <div><span className="label">Position {position.id}</span><h3>{position.pair}</h3></div>
                  <span className={`position-status ${position.status.toLowerCase()}`}>{position.status}</span>
                </header>
                <div className="position-metrics">
                  <Metric label="Pool index" value={`#${position.poolIndex}`} />
                  <Metric label="Tick range" value={position.range} />
                  <Metric label="Liquidity" value={position.liquidity} />
                  <Metric label="Tokens owed" value={`${position.owed0} / ${position.owed1}`} />
                </div>
                <button className="secondary-button" disabled={!isOwned || !action} onClick={() => {
                  if (action) void props.runTransaction(action, { type: "position", positionId: position.id.replace("#", "") });
                }}>{position.status === "Active" ? "Burn" : position.status === "Collectable" ? "Collect" : "Closed"}</button>
              </article>
            );
          })}
        </div>
      </section>
      {props.showManualLookup && (
        <section className="market-card" aria-labelledby="lookup-title">
          <header className="market-card-heading"><Search size={19} aria-hidden="true" /><h2 id="lookup-title">Find a position by ID</h2></header>
          <div className="manual-lookup">
            <p>Enter the NFT ID from your mint transaction to look up a position owned by this wallet.</p>
            <form noValidate onSubmit={async (event) => {
              event.preventDefault();
              if (lookingUp) return;
              setLookingUp(true);
              try { await props.queryManualPosition(props.manualPosition); } finally { setLookingUp(false); }
            }}>
              <label className="field"><span>Position ID</span>
                <input inputMode="numeric" value={props.manualPosition} onChange={(event) => props.setManualPosition(event.target.value)}
                  aria-invalid={Boolean(props.manualPositionError)} aria-describedby={props.manualPositionError ? "lookup-error" : undefined} />
              </label>
              <button className="secondary-button" type="submit" disabled={lookingUp} aria-busy={lookingUp}>{lookingUp ? "Looking up…" : "Find position"}</button>
            </form>
            {props.manualPositionError && <p id="lookup-error" role="alert" className="manual-error">{props.manualPositionError}</p>}
            <a href="https://sepolia.etherscan.io/address/0xbe766Bf20eFfe431829C5d5a2744865974A0B610#tokentxnsErc721" target="_blank" rel="noreferrer">
              Find NFT transfers on Etherscan <ExternalLink size={13} />
            </a>
          </div>
        </section>
      )}
    </div>
  );
}
