import { Database, Loader2, Plus, X } from "lucide-react";
import type { OpenDrawer, RunTransaction } from "../types/app";
import type { Position } from "../types/ui";
import { Metric } from "../components/common";

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
}) {
  return (
    <section className="main-column full">
      <div className="section-header">
        <div>
          <h2>Positions</h2>
          <p>LP NFTs from PositionManager, enriched through ZAN with a manual fallback path.</p>
        </div>
        <div className="inline-actions">
          <button className="primary-button" onClick={() => props.openDrawer("liquidity")} disabled={!props.canAddLiquidity}>
            <Plus size={16} /> Add liquidity
          </button>
        </div>
      </div>
      {!props.isReady && <div className="chain-banner"><Database size={16} /><div><strong>Chain data paused</strong><span>Connect a Sepolia wallet to load positions owned by your account.</span></div></div>}
      {(props.positionsLoading || props.positionsError) && (
        <div className={props.positionsError ? "inline-error compact-error" : "chain-banner"}>
          {props.positionsError ? <X size={16} /> : <Loader2 size={16} />}
          <div>
            <strong>{props.positionsError ? "Position lookup warning" : "Loading LP positions"}</strong>
            <span>{props.positionsError ?? "Reading ZAN NFT IDs and PositionManager.getPositionInfo."}</span>
          </div>
        </div>
      )}
      {props.showManualLookup && (
        <div className="inline-error">
          <X size={16} />
          <div>
            <strong>Manual position lookup</strong>
            <span>No indexed positions were found. Enter a positionId owned by the connected account.</span>
          </div>
          <input value={props.manualPosition} onChange={(event) => props.setManualPosition(event.target.value)} placeholder="positionId" />
          <button className="secondary-button" onClick={() => void props.queryManualPosition(props.manualPosition)}>
            Query
          </button>
        </div>
      )}
      {props.manualPositionError && <div className="inline-error compact-error"><X size={16} /><div><strong>Position lookup failed</strong><span>{props.manualPositionError}</span></div></div>}
      <div className="position-grid">
        {props.positions.length === 0 && !props.positionsLoading && (
          <div className="empty-state"><Database size={24} /><strong>{props.isReady ? "No positions found" : "Connect wallet to load positions"}</strong><span>{props.isReady ? "Mint liquidity or use the manual lookup above." : "Position data is read from Sepolia and the configured NFT indexer."}</span></div>
        )}
        {props.positions.map((position) => {
          const isOwned = Boolean(
            props.canWritePositions &&
              props.walletAccount &&
              position.owner &&
              props.walletAccount.toLowerCase() === position.owner.toLowerCase(),
          );
          const action = position.status === "Active" ? "burn" : position.status === "Collectable" ? "collect" : undefined;
          return (
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
              disabled={!isOwned || !action}
              onClick={() => {
                if (!action) return;
                void props.runTransaction(action, {
                  type: "position",
                  positionId: position.id.replace("#", ""),
                });
              }}
            >
              {position.status === "Active" ? "Burn" : position.status === "Collectable" ? "Collect" : "Closed"}
            </button>
          </article>
          );
        })}
      </div>
    </section>
  );
}
