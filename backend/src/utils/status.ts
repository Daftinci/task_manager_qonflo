import type { Progress } from "../models/Task.js";

// Allowed status changes per current status. Keep in sync with the frontend.
export const ALLOWED_TRANSITIONS: Record<Progress, readonly Progress[]> = {
    to_do: ["pending", "in_progress"],
    pending: ["in_progress"],
    in_progress: ["pending", "done"],
    done: [],
}

// Same value is a no-op (idempotent); otherwise it must be an allowed transition.
export const isValidTransition = (from: Progress, to: Progress): boolean =>
    from === to || ALLOWED_TRANSITIONS[from].includes(to)
