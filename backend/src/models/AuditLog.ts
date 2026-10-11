import mongoose from "mongoose";

export type AuditAction = "create" | "update" | "delete" | "restore"

export interface IAuditLog {
    taskId: mongoose.Types.ObjectId
    action: AuditAction
    changes: Record<string, unknown>
    performedBy: string
}

const auditLogSchema = new mongoose.Schema<IAuditLog>(
    {
        taskId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Task",
            required: true,
            index: true,
        },
        action: {
            type: String,
            enum: ["create", "update", "delete", "restore"],
            required: true
        },
        changes: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },
        performedBy: {
           type: String,
           required: true
        }
    },{
        timestamps:{createdAt: true, updatedAt: false},
        minimize: false // keep empty `changes` ({}) instead of dropping the field
    }
)

// Audit logs are append-only. Block every update/delete path at the model level.
const IMMUTABLE = "Audit logs are immutable"
const reject = (next: (err?: Error) => void) => next(new Error(IMMUTABLE))

auditLogSchema.pre(
    ["updateOne", "updateMany", "replaceOne", "findOneAndUpdate", "findOneAndReplace",
     "findOneAndDelete", "deleteOne", "deleteMany"] as any,
    function (next: (err?: Error) => void) { reject(next) }
)
auditLogSchema.pre("save", function (next) {
    if (!this.isNew) return reject(next) // only the first save (insert) is allowed
    next()
})
auditLogSchema.pre("deleteOne", { document: true, query: false }, function (next) { reject(next) })

export default mongoose.model<IAuditLog>("AuditLog", auditLogSchema)
