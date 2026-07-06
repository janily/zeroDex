import { Clock3 } from "lucide-react";
import type { TransactionStage } from "../types/domain";
import { TxTimeline } from "../components/common";

export function ActivityPage({ txStage }: { txStage: TransactionStage }) {
  const events = [
    ["Quote refreshed", "quoteExactInput static call returned 319.42 MNTB"],
    ["Allowance checked", "MNTA allowance covers SwapRouter amountIn"],
    ["Pool sync", "getAllPools returned 5 pools"],
    ["Position sync", "ZAN returned 3 PositionManager NFTs"],
  ];

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
