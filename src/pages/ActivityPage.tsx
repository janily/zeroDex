import { Activity, CircleAlert, Clock3, ExternalLink, List, Radio } from "lucide-react";
import type { TransactionStage } from "../types/domain";
import { TxTimeline } from "../components/common";
import { PageHeader } from "../components/layout";
import { WorkspaceState } from "../components/WorkspaceState";
import "../workspace-pages.css";

const stageLabels: Record<Exclude<TransactionStage, "idle">, string> = {
  "waiting-signature": "Waiting for your signature",
  submitted: "Transaction submitted",
  confirming: "Confirming on Sepolia",
  success: "Transaction complete",
  rejected: "Transaction rejected",
  error: "Transaction failed",
};

export function ActivityPage({ txStage, hash, error, syncError }: { txStage: TransactionStage; hash?: string; error?: string; syncError?: string }) {
  return (
    <div className="market-page">
      <PageHeader title="Activity" description="Follow your latest transaction from wallet signature to on-chain confirmation." />
      <section className="market-card" aria-labelledby="progress-title">
        <header className="market-card-heading"><Activity size={19} aria-hidden="true" /><h2 id="progress-title">Transaction progress</h2></header>
        <div className="activity-progress"><TxTimeline stage={txStage} /></div>
      </section>
      <section className="market-card" aria-labelledby="activity-title">
        <header className="market-card-heading"><List size={19} aria-hidden="true" /><h2 id="activity-title">Latest activity</h2></header>
        {txStage === "idle" && !error && !syncError && <WorkspaceState icon={Clock3} title="No transaction activity yet" description="Your next transaction and its status will appear here." />}
        <div className="transaction-events" aria-live="polite">
          {txStage !== "idle" && (
            <div className="transaction-event">
              <Radio size={18} aria-hidden="true" />
              <div><strong>{stageLabels[txStage]}</strong>
                {hash && <a href={`https://sepolia.etherscan.io/tx/${encodeURIComponent(hash)}`} target="_blank" rel="noreferrer">{hash} <ExternalLink aria-hidden="true" size={13} /></a>}
              </div>
            </div>
          )}
          {error && <div className="transaction-event warning"><CircleAlert size={18} /><div><strong>Transaction error</strong><p>{error}</p></div></div>}
          {syncError && <div className="transaction-event warning"><CircleAlert size={18} /><div><strong>Refresh warning</strong><p>{syncError}</p></div></div>}
        </div>
      </section>
    </div>
  );
}
