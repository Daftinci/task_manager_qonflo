import { progressBadge, progressText } from "../constants/task";
import type { AuditLog, Progress } from "../types";
import { formatProgress } from "../utils/format";

const StatusText = ({ value }: { value: string | null }) =>
  value === null ? null : (
    <span className={`font-semibold ${progressText[value as Progress]}`}>
      {formatProgress(value)}
    </span>
  );

// tooltip body, from the latest log that touched progress
const lastStatusTip = (logs: AuditLog[] | undefined) => {
  if (!logs) return "loading…";
  const last = [...logs].reverse().find((l) => l.changes?.progress);
  if (!last) return "no status changes yet";
  const { from, to } = last.changes!.progress;
  return from === null ? (
    <>
      created as <StatusText value={to} /> by {last.performedBy}
    </>
  ) : (
    <>
      <span className="font-bold">last update:</span> from <StatusText value={from} /> to{" "}
      <StatusText value={to} /> by {last.performedBy}
    </>
  );
};

type Props = {
  progress: Progress;
  logs: AuditLog[] | undefined;
  onHover: () => void; // lets the parent load the logs on first hover
};

// the progress badge, with a "last update" tooltip
const ProgressTooltip = ({ progress, logs, onHover }: Props) => (
  <div className="tooltip" onMouseEnter={onHover}>
    <div className="tooltip-content">{lastStatusTip(logs)}</div>
    <span className={`badge badge-sm ${progressBadge[progress]}`}>
      {formatProgress(progress)}
    </span>
  </div>
);

export default ProgressTooltip;
