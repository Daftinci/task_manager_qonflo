import type { ClientSession, Types } from "mongoose";
import AuditLog, { type AuditAction } from "../models/AuditLog.js";

const TRACKED_FIELDS = ["title", "content", "priority", "progress"] as const;

type Tracked = Partial<Record<(typeof TRACKED_FIELDS)[number], string>> | null | undefined

export const getDiff = (before: Tracked, after: Tracked) => {
    const changes: Record<string, { from: string | null; to: string | null }> = {}
    for (const field of TRACKED_FIELDS) {
        const from = before?.[field] ?? null
        const to = after?.[field] ?? null
        if (from !== to) changes[field] = { from, to }
    }
    return changes
}

interface LogAuditArgs {
    session: ClientSession
    taskId: Types.ObjectId
    action: AuditAction
    changes: Record<string, unknown>
    actor: string
}

// Runs inside the caller's transaction and does NOT swallow errors:
// if the log can't be written, the task change is rolled back too.
export const logAudit = async ({ session, taskId, action, changes, actor }: LogAuditArgs): Promise<void> => {
    await AuditLog.create([{ taskId, action, changes, performedBy: actor }], { session })
}
