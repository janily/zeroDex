import { ArrowDownUp, Settings2 } from "lucide-react";
import { TOKENS } from "../config/tokens";
import { mockPools } from "../data/mockData";
import type { SwapQuoteState } from "../hooks/useSwapQuote";
import { displayPoolToUiPool, tokenSymbol } from "../lib/uiFormat";
import type { OpenDrawer, RunTransaction, TokenAddress } from "../types/app";
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
  runTransaction: RunTransaction;
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
        <TokenSelect label="Pay token" value={props.tokenIn} onChange={props.setTokenIn} />
        <TokenAmount label="Pay" token={tokenSymbol(props.tokenIn)} value={props.swapIn} onChange={props.setSwapIn} />
        <button
          className="swap-switch"
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
        <TokenAmount label="Receive" token={tokenSymbol(props.tokenOut)} value={props.swapOut} onChange={props.setSwapOut} />
        <div className="quote-box">
          <Metric label="Best route" value={props.quote.quote ? `#${props.quote.quote.pool.index}` : props.quote.loading ? "Quoting..." : "No route"} />
          <Metric label="Candidates" value={`${props.quote.candidates.length}`} />
          <Metric
            label={props.swapMode === "input" ? "Quoted output" : "Quoted input"}
            value={
              props.quote.quote
                ? props.swapMode === "input"
                  ? props.quote.quote.amountOut.toString()
                  : props.quote.quote.amountIn.toString()
                : props.quote.error ?? "Connect Sepolia to quote"
            }
          />
        </div>
        <button className="primary-button wide" onClick={() => props.openDrawer("swap")}>
          {props.isReady ? "Review swap" : "Connect wallet"}
        </button>
      </div>
      <div className="route-panel">
        <h3>Route candidates</h3>
        {(props.quote.candidates.length > 0 ? props.quote.candidates.map(displayPoolToUiPool) : mockPools.slice(0, 3)).map((pool, index) => (
          <div className="candidate" key={`${pool.index}-${pool.pair}`}>
            <span className="candidate-rank">{index + 1}</span>
            <div>
              <strong>{pool.pair} #{pool.index}</strong>
              <span>
                {pool.fee} fee, {pool.range}
              </span>
            </div>
            <code>{index === 0 ? "best" : `${(index + 1) * 0.21}% worse`}</code>
          </div>
        ))}
      </div>
    </section>
  );
}
