import { Clock3 } from "lucide-react";
import type { TransactionStage } from "../types/domain";
import { TxTimeline } from "../components/common";

export function ActivityPage({ txStage, hash, error, syncError }: { txStage: TransactionStage; hash?: string; error?: string; syncError?: string }) {
  const events = txStage === "idle" ? [] : [["Transaction status", `${txStage}${hash ? ` · ${hash}` : ""}`]];
  if (error) events.push(["Transaction error", error]);
  if (syncError) events.push(["Refresh warning", syncError]);

  return (
    <section className="main-column full">
      <div className="section-header">
        <div>
          <h2>Activity</h2>
          <p>Global transaction feedback and recent read/write actions.</p>
        </div>
      </div>
      <TxTimeline stage={txStage} />
      <div className="activity-list">
        {events.length === 0 && <div className="empty-state"><Clock3 size={24} /><strong>No transaction activity yet</strong><span>Submitted transactions will appear here.</span></div>}
        {events.map(([title, detail]) => (
          <div className="activity-row" key={title}>
            <Clock3 size={16} />
            <div>
              <strong>{title}</strong>
              <span>{detail}</span>
            </div>
            <code>now</code>
          </div>
        ))}
      </div>
    </section>
  );
}
