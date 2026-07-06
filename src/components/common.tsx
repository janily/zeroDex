import { Check, Loader2 } from "lucide-react";
import { TOKENS } from "../config/tokens";
import type { TransactionStage } from "../types/domain";
import type { Pool } from "../types/ui";
import type { TokenAddress } from "../types/app";

const tokens = TOKENS.map((token) => token.symbol);

export function TokenSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: TokenAddress;
  onChange: (value: TokenAddress) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value as TokenAddress)}>
        {tokens.map((token) => (
          <option key={token} value={TOKENS.find((item) => item.symbol === token)?.address}>
            {token}
          </option>
        ))}
      </select>
    </label>
  );
}

export function InputBlock({ label, value, helper, onChange }: { label: string; value: string; helper?: string; onChange?: (value: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange?.(event.target.value)} readOnly={!onChange} />
      {helper && <small>{helper}</small>}
    </label>
  );
}

export function TokenAmount({
  label,
  token,
  value,
  onChange,
}: {
  label: string;
  token: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="token-amount">
      <span>{label}</span>
      <div>
        <input value={value} onChange={(event) => onChange(event.target.value)} />
        <button type="button">{token}</button>
      </div>
      <small>Balance 1,260.42</small>
    </label>
  );
}

export function TxTimeline({ stage, compact = false }: { stage: TransactionStage; compact?: boolean }) {
  const steps = [
    ["waiting-signature", "Sign"],
    ["submitted", "Submit"],
    ["confirming", "Confirm"],
    ["success", "Complete"],
  ] as const;
  const order = ["idle", "waiting-signature", "submitted", "confirming", "success", "rejected", "error"];
  const activeIndex = Math.max(0, order.indexOf(stage));

  return (
    <div className={`tx-timeline ${compact ? "compact" : ""}`}>
      {steps.map(([key, label], index) => {
        const active = activeIndex >= index + 1;
        const current = stage === key;
        return (
          <div className={`tx-step ${active ? "active" : ""} ${current ? "current" : ""}`} key={key}>
            <span>{current ? <Loader2 size={13} /> : active ? <Check size={13} /> : index + 1}</span>
            <strong>{label}</strong>
          </div>
        );
      })}
    </div>
  );
}

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function StatusPill({ status }: { status: Pool["status"] }) {
  return <span className={`status-pill ${status.toLowerCase().replace(" ", "-")}`}>{status}</span>;
}
