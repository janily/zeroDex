import { Loader2, Plus, SlidersHorizontal, X } from "lucide-react";
import type { OpenDrawer, RunTransaction } from "../types/app";
import type { Position } from "../types/ui";
import { Metric } from "../components/common";

export function PositionsPage(props: {
  zanFailed: boolean;
  setZanFailed: (failed: boolean) => void;
  manualPosition: string;
  setManualPosition: (position: string) => void;
  runTransaction: RunTransaction;
  openDrawer: OpenDrawer;
  canWritePositions: boolean;
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
              disabled={!props.canWritePositions}
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
