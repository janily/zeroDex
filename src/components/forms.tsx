import type { CreateDrawerState, LiquidityDrawerState } from "../types/app";
import type { Pool } from "../types/ui";
import { InputBlock, Metric, TokenAmount, TokenSelect } from "./common";

export function CreatePoolForm({ value, onChange }: { value: CreateDrawerState; onChange: (value: CreateDrawerState) => void }) {
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

export function LiquidityForm({
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

export function SwapDrawerForm({
  selectedPool,
  summary,
}: {
  selectedPool: Pool;
  summary?: {
    route?: string;
    pay: string;
    receive: string;
    slippage: string;
  };
}) {
  return (
    <div className="form-stack">
      <InputBlock label="Route" value={summary?.route ?? `${selectedPool.pair} #${selectedPool.index}`} helper="Best same-pair pool selected from the latest quote." />
      <InputBlock label="Pay" value={summary?.pay ?? "Quote required"} />
      <InputBlock label="Receive" value={summary?.receive ?? "Quote required"} />
      <InputBlock label="Slippage" value={summary?.slippage ?? "0.50%"} />
    </div>
  );
}
