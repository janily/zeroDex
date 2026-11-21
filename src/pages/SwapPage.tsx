import { ArrowDownUp, ArrowRight, ChevronDown, GitFork, Route, Wallet } from "lucide-react";
import { Metric, TokenAmount, TokenSelect } from "../components/common";
import { PageHeader } from "../components/layout";
import type { SwapQuoteState } from "../hooks/useSwapQuote";
import { displayPoolToUiPool, tokenSymbol } from "../lib/uiFormat";
import type { OpenDrawer, TokenAddress } from "../types/app";
import "../swap.css";

function SwapLeg({ label, token, onTokenChange, amount, onAmountChange, balance }: {
  label: string;
  token: TokenAddress;
  onTokenChange: (value: TokenAddress) => void;
  amount: string;
  onAmountChange?: (value: string) => void;
  balance: string;
}) {
  const symbol = tokenSymbol(token);
  return (
    <div className={`swap-leg ${onAmountChange ? "editable" : "estimated"}`}>
      <TokenAmount label={label} token={symbol} value={amount} onChange={onAmountChange} helper={balance} />
      <div className="swap-asset-picker">
        <TokenSelect label={`${label} token`} value={token} onChange={onTokenChange} />
        <ChevronDown size={14} aria-hidden="true" />
      </div>
    </div>
  );
}

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
  poolsLoading?: boolean;
  poolsError?: string;
  onConnect?: () => void;
  onConnectLabel?: string;
  payBalanceLabel: string;
  receiveBalanceLabel: string;
  reviewDisabledReason?: string;
}) {
  const exactInput = props.swapMode === "input";
  const { quote, candidates, loading } = props.quote;
  const inputSymbol = tokenSymbol(props.tokenIn);
  const outputSymbol = tokenSymbol(props.tokenOut);
  const quotedAmount = exactInput ? `${props.swapOut} ${outputSymbol}` : `${props.swapIn} ${inputSymbol}`;
  const quoteStatus = loading ? "Quoting…" : quote ? "Quoted" : props.quote.error ? "Quote unavailable" : "Awaiting quote";
  let emptyRouteMessage = "No tradable pools for this pair. Try another token pair.";
  if (!props.isReady) emptyRouteMessage = "Connect a wallet on Sepolia to compare eligible pools.";
  else if (props.poolsLoading) emptyRouteMessage = "Loading pools from Sepolia…";
  else if (props.poolsError) emptyRouteMessage = "Chain data is incomplete. Refresh chain data to check available routes.";
  return (
    <div className="swap-page">
      <PageHeader title="Swap" description="Exchange tokens at the best quoted rate across compatible Sepolia pools." />
      <div className="swap-workbench">
        <section className="swap-ticket" aria-labelledby="swap-order-title">
          <div className="swap-ticket-header">
            <h2 id="swap-order-title">Token amounts</h2>
            <div className="swap-modes" role="group" aria-label="Swap mode">
              <button type="button" aria-pressed={exactInput} onClick={() => props.setSwapMode("input")}>Exact input</button>
              <button type="button" aria-pressed={!exactInput} onClick={() => props.setSwapMode("output")}>Exact output</button>
            </div>
          </div>
          <div className="swap-legs">
            <SwapLeg label="Pay" token={props.tokenIn} onTokenChange={props.setTokenIn}
              amount={props.swapIn} onAmountChange={exactInput ? props.setSwapIn : undefined} balance={props.isReady ? props.payBalanceLabel : "Balance —"} />
            <div className="swap-reverse-row">
              <button className="swap-reverse" type="button" title="Switch pay and receive tokens" aria-label="Switch pay and receive tokens"
                onClick={() => {
                  props.setSwapIn(props.swapOut);
                  props.setSwapOut(props.swapIn);
                  props.setTokenIn(props.tokenOut);
                  props.setTokenOut(props.tokenIn);
                }}>
                <ArrowDownUp size={17} aria-hidden="true" />
              </button>
            </div>
            <SwapLeg label="Receive" token={props.tokenOut} onTokenChange={props.setTokenOut}
              amount={props.swapOut} onAmountChange={!exactInput ? props.setSwapOut : undefined} balance={props.isReady ? props.receiveBalanceLabel : "Balance —"} />
          </div>
          <button type="button" className="primary-button swap-cta" disabled={props.isReady ? !props.canReview : !props.onConnect}
            aria-describedby={props.isReady && props.reviewDisabledReason ? "swap-review-hint" : undefined}
            onClick={() => props.isReady ? props.openDrawer("swap") : props.onConnect?.()}>
            {props.isReady ? <><span>Review swap</span><ArrowRight size={16} /></> : <><Wallet size={16} /><span>{props.onConnectLabel ?? "Connect wallet"}</span></>}
          </button>
          {props.isReady && props.reviewDisabledReason && <p className="swap-review-hint" id="swap-review-hint">{props.reviewDisabledReason}</p>}
        </section>
        <section className="swap-routing" aria-labelledby="swap-route-title">
          <div className="swap-route-heading"><Route size={19} aria-hidden="true" /><h2 id="swap-route-title">Route details</h2></div>
          <div className={`swap-route-map ${quote ? "quoted" : ""}`}>
            <span>{inputSymbol}</span><i aria-hidden="true" /><GitFork size={19} aria-hidden="true" /><i aria-hidden="true" /><span>{outputSymbol}</span>
          </div>
          <div className="swap-metrics" role="status" aria-live="polite" aria-busy={loading}>
            <Metric label="Quote status" value={quoteStatus} />
            <Metric label="Best route" value={quote ? quote.indexPath.map((index) => `#${index}`).join(" → ") : "—"} />
            <Metric label={exactInput ? "Quoted output" : "Quoted input"} value={quote ? quotedAmount : "—"} />
          </div>
          <div className="swap-candidate-heading"><h3>Route candidates</h3>{props.isReady && !props.poolsLoading && !props.poolsError && <span>{candidates.length}</span>}</div>
          {candidates.length === 0 && (
            <p className="swap-routing-empty" role="status">{emptyRouteMessage}</p>
          )}
          {candidates.map(displayPoolToUiPool).map((pool) => {
            const best = quote?.indexPath.includes(pool.index);
            return (
              <div className="candidate swap-candidate" key={pool.id}>
                <div><strong>{pool.pair} #{pool.index}</strong><span>{pool.fee} fee · {pool.range}</span></div>
                <small className={best ? "best" : ""}>{best ? "best path" : "candidate"}</small>
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}
