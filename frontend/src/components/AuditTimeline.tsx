import type { AuditLog, Progress } from "../types";
import { formatChange } from "../utils/format";

// Step colors (full class names, so Tailwind can see them).
// `step` colors the circle; `line` colors the connector going OUT of the step to the
// next one, via --line-bg (see style.css).
const stepTone = {
  success: { step: "step-success", line: "[--line-bg:var(--color-success)]" },
  error: { step: "step-error", line: "[--line-bg:var(--color-error)]" },
  warning: { step: "step-warning", line: "[--line-bg:var(--color-warning)]" },
  info: { step: "step-info", line: "[--line-bg:var(--color-info)]" },
  primary: { step: "step-primary", line: "[--line-bg:var(--color-primary)]" },
  grey: { step: "step-neutral", line: "[--line-bg:var(--color-neutral)]" },
};

type StepTone = keyof typeof stepTone;

const progressTone: Record<Progress, StepTone> = {
  to_do: "grey",
  pending: "info",
  in_progress: "primary",
  done: "success",
};

const toneOf = (log: AuditLog): StepTone => {
  if (log.action === "create") return "success";
  if (log.action === "delete") return "error";
  if (log.action === "restore") return "warning";
  // update: a status change takes the new status' color,
  // anything else (priority, title, content) stays grey
  const to = log.changes?.progress?.to as Progress | null | undefined;
  return to ? progressTone[to] : "grey";
};

// `logs` is undefined while loading; otherwise oldest first
const AuditTimeline = ({ logs }: { logs: AuditLog[] | undefined }) => {
  if (!logs) return <span className="loading loading-dots loading-sm" />;
  if (logs.length === 0)
    return <p className="text-sm opacity-60">No audit logs.</p>;

  return (
    <ul className="steps steps-horizontal">
      {logs.map((log, i) => (
        <li
          key={log._id}
          className={`step min-w-40 ${stepTone[toneOf(log)].step} ${
            // the connector before this step takes the previous step's color
            i > 0 ? stepTone[toneOf(logs[i - 1])].line : ""
          }`}
        >
          <div className="text-center text-xs leading-tight">
            <div className="font-semibold capitalize">
              {log.action} by {log.performedBy}
            </div>
            <div className="opacity-60">
              {new Date(log.createdAt).toLocaleString()}
            </div>
            {Object.entries(log.changes ?? {}).map(([field, c]) => (
              <div key={field}>
                {field}: {formatChange(field, c.from)} →{" "}
                {formatChange(field, c.to)}
              </div>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
};

export default AuditTimeline;
