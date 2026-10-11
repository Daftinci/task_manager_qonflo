import type { Priority, Progress } from "../types";

// must match the backend: which statuses a task can move to from its current one
export const ALLOWED_TRANSITIONS: Record<Progress, Progress[]> = {
  to_do: ["pending", "in_progress"],
  pending: ["in_progress"],
  in_progress: ["pending", "done"],
  done: [],
};

export const priorityBadge: Record<Priority, string> = {
  low: "badge-success",
  medium: "badge-warning",
  high: "badge-error",
};

export const progressBadge: Record<Progress, string> = {
  to_do: "badge-ghost",
  pending: "badge-info",
  in_progress: "badge-primary",
  done: "badge-success",
};

// same colors as progressBadge, as text colors (for the tooltip)
export const progressText: Record<Progress, string> = {
  to_do: "text-neutral-content/60",
  pending: "text-info",
  in_progress: "text-primary",
  done: "text-success",
};
