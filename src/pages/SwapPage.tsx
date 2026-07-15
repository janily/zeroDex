import { ArrowDownUp, Database } from "lucide-react";
import type { SwapQuoteState } from "../hooks/useSwapQuote";
import { displayPoolToUiPool, tokenSymbol } from "../lib/uiFormat";
import type { OpenDrawer, TokenAddress } from "../types/app";
import { Metric, TokenAmount, TokenSelect } from "../components/common";

export function SwapPage(props: {
  swapMode: "input" | "output";
  setSwapMode: (mode: "input" | "output") => void;
  swapIn: string;
  swapOut: string;
  setSwapIn: (value: string) => void;
  setSwapOut: (value: string) => void;
  tokenIn: TokenAddress;
  tokenOut: TokenAddress;
  setTokenIn: (value: TokenAddress) => void;
  setTokenOut: (value: TokenAddress) => void;
  quote: SwapQuoteState;
  openDrawer: OpenDrawer;
  isReady: boolean;
  canReview: boolean;
  payBalanceLabel: string;
  receiveBalanceLabel: string;
  reviewDisabledReason?: string;
}) {
  return (
    <section className="swap-layout">
      <div className="swap-panel">
        <div className="section-header compact">
          <div>
            <h2>Swap</h2>
            <p>Quote against all same-pair pools and pick the better path.</p>
          </div>
        </div>
        <div className="segment">
          <button className={props.swapMode === "input" ? "active" : ""} onClick={() => props.setSwapMode("input")}>
            Exact input
          </button>
          <button className={props.swapMode === "output" ? "active" : ""} onClick={() => props.setSwapMode("output")}>
            Exact output
          </button>
        </div>
        <TokenSelect label="Pay token" value={props.tokenIn} onChange={props.setTokenIn} />
        <TokenAmount
          label="Pay"
          token={tokenSymbol(props.tokenIn)}
          value={props.swapIn}
          onChange={props.swapMode === "input" ? props.setSwapIn : undefined}
          helper={props.payBalanceLabel}
        />
        <button
          className="swap-switch"
          aria-label="Switch pay and receive tokens"
          onClick={() => {
            props.setSwapIn(props.swapOut);
            props.setSwapOut(props.swapIn);
            props.setTokenIn(props.tokenOut);
            props.setTokenOut(props.tokenIn);
          }}
        >
          <ArrowDownUp size={16} />
        </button>
        <TokenSelect label="Receive token" value={props.tokenOut} onChange={props.setTokenOut} />
        <TokenAmount
          label="Receive"
          token={tokenSymbol(props.tokenOut)}
          value={props.swapOut}
          onChange={props.swapMode === "output" ? props.setSwapOut : undefined}
          helper={props.receiveBalanceLabel}
        />
        <div className="quote-box">
          <Metric label="Best route" value={props.quote.quote ? props.quote.quote.indexPath.map((index) => `#${index}`).join(" → ") : props.quote.loading ? "Quoting..." : "No route"} />
          <Metric label="Candidates" value={`${props.quote.candidates.length}`} />
          <Metric
            label={props.swapMode === "input" ? "Quoted output" : "Quoted input"}
            value={
              props.quote.loading
                ? "Quoting..."
                : props.quote.quote
                  ? props.swapMode === "input"
                    ? props.swapOut
                    : props.swapIn
                  : props.quote.error ?? "Connect Sepolia to quote"
            }
          />
        </div>
        <button className="primary-button wide" disabled={!props.isReady || !props.canReview} onClick={() => props.openDrawer("swap")}>
          {props.isReady ? "Review swap" : "Connect wallet"}
        </button>
        {props.isReady && props.reviewDisabledReason && <p className="action-hint">{props.reviewDisabledReason}</p>}
      </div>
      <div className="route-panel">
        <h3>Route candidates</h3>
        {props.quote.candidates.length === 0 && (
          <div className="empty-state"><Database size={24} /><strong>No route candidates</strong><span>Select a supported pair with tradable liquidity.</span></div>
        )}
        {props.quote.candidates.map(displayPoolToUiPool).map((pool, index) => (
          <div className="candidate" key={`${pool.index}-${pool.pair}`}>
            <span className="candidate-rank">{index + 1}</span>
            <div>
              <strong>{pool.pair} #{pool.index}</strong>
              <span>
                {pool.fee} fee, {pool.range}
              </span>
            </div>
            <code>{props.quote.quote?.indexPath.includes(pool.index) ? "best path" : "candidate"}</code>
          </div>
        ))}
      </div>
    </section>
  );
}
