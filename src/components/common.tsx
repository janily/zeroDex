import { useId } from "react";
import { Check, Loader2 } from "lucide-react";
import { TOKENS } from "../config/tokens";
import type { TransactionStage } from "../types/domain";
import type { Pool } from "../types/ui";
import type { TokenAddress } from "../types/app";

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
        {TOKENS.map((token) => (
          <option key={token.address} value={token.address}>
            {token.symbol}
          </option>
        ))}
      </select>
    </label>
  );
}

export function InputBlock({ label, value, helper, onChange }: { label: string; value: string; helper?: string; onChange?: (value: string) => void }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        value={value}
        inputMode={onChange ? "decimal" : undefined}
        readOnly={!onChange}
        aria-describedby={helper ? `${id}-help` : undefined}
        onChange={(event) => onChange?.(event.target.value)}
      />
      {helper && <small id={`${id}-help`}>{helper}</small>}
    </div>
  );
}

export function TokenAmount({
  label,
  token,
  value,
  onChange,
  helper = "Balance unavailable",
}: {
  label: string;
  token: string;
  value: string;
  onChange?: (value: string) => void;
  helper?: string;
}) {
  const id = useId();
  return (
    <label className="token-amount">
      <span>{label}</span>
      <div>
        <input
          aria-label={label.includes(token) ? label : `${label} ${token}`}
          aria-describedby={`${id}-balance`}
          inputMode="decimal"
          placeholder={onChange ? "0.0" : "—"}
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          readOnly={!onChange}
        />
        <span className="token-badge">{token}</span>
      </div>
      <small id={`${id}-balance`}>{helper}</small>
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
  const activeIndex = ["waiting-signature", "submitted", "confirming", "success"].indexOf(stage) + 1;

  return (
    <div role="list" aria-label="Transaction progress" className={`tx-timeline ${compact ? "compact" : ""}`}>
      {steps.map(([key, label], index) => {
        const active = activeIndex >= index + 1;
        const current = stage === key;
        const pending = current && key !== "success";
        return (
          <div role="listitem" aria-current={current ? "step" : undefined} className={`tx-step ${active ? "active" : ""} ${current ? "current" : ""} ${pending ? "pending" : ""}`} key={key}>
            <span aria-hidden="true">{pending ? <Loader2 size={13} /> : active ? <Check size={13} /> : index + 1}</span>
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
