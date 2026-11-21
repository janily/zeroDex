import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function WorkspaceState({
  icon: Icon,
  title,
  description,
  action,
  loading = false,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="workspace-state">
      <div className="workspace-state-copy" role="status">
        <span className="workspace-state-symbol" aria-hidden="true">
          <Icon size={24} strokeWidth={1.6} className={loading ? "state-loader" : undefined} />
        </span>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
