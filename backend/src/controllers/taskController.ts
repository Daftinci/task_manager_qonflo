import type { Request, Response } from "express";
import mongoose from "mongoose";
import AuditLog from "../models/AuditLog.js";
import Task, { type Progress } from "../models/Task.js";
import { getDiff, logAudit } from "../utils/audit.js";
import { HttpError, sendError } from "../utils/httpError.js";
import { ALLOWED_TRANSITIONS, isValidTransition } from "../utils/status.js";

// Runs `work` in a transaction so the task change and its audit log are
// committed together or not at all.
const inTransaction = async <T>(work: (session: mongoose.ClientSession) => Promise<T>): Promise<T> => {
    const session = await mongoose.startSession()
    try {
        let result!: T
        await session.withTransaction(async () => { result = await work(session) })
        return result
    } finally {
        await session.endSession()
    }
}

export const getAllTask = async (req: Request, res: Response) => {
    try {
        // soft-deleted tasks are hidden unless ?includeDeleted=true
        const filter = req.query.includeDeleted === "true" ? {} : { deletedAt: null }
        const tasks = await Task.find(filter).sort({createdAt:-1, _id:-1})
        res.status(200).json(tasks)
    } catch (error) {
        sendError(res, error, "getAllTask controller")
    }
};

export const getTaskbyId = async (req: Request, res: Response) => {
    try {
        const tasksbyId = await Task.findById(req.params.id)

        if (!tasksbyId) return res.status(404).json({message:"Task not found"})

        res.status(200).json(tasksbyId)
    } catch (error) {
        sendError(res, error, "getTaskbyId controller")
    }
}

export const createTask = async (req: Request, res: Response) => {
    try {
        const {title,content,priority} = req.body

        // a new task always starts at the first status, whatever the client sends
        const newTask = await inTransaction(async (session) => {
            const task = new Task({title,content,priority,progress:"to_do"})
            await task.save({ session })
            await logAudit({
                session,
                taskId: task._id,
                action: "create",
                changes: getDiff(null, task),
                actor: res.locals.actor
            })
            return task
        })

        res.status(201).json(newTask)
    } catch (error) {
        sendError(res, error, "createTask controller")
    }
}

export const updateTask = async (req: Request, res: Response) => {
    try {
        const {title,content,priority,progress} = req.body

        const result = await inTransaction(async (session) => {
            const task = await Task.findById(req.params.id).session(session)
            if (!task) throw new HttpError(404, "Task not found")
            if (task.deletedAt) throw new HttpError(409, "Task is deleted, restore it first")

            if (progress !== undefined && !isValidTransition(task.progress, progress)) {
                const allowed = ALLOWED_TRANSITIONS[task.progress as Progress]
                throw new HttpError(
                    400,
                    `Invalid status change from "${task.progress}" to "${progress}". ` +
                    (allowed.length
                        ? `Allowed next: ${allowed.map((p) => `"${p}"`).join(", ")}`
                        : `"${task.progress}" is the final status`)
                )
            }

            const before = task.toObject()
            // only touch fields the client actually sent (undefined would wipe them)
            const patch = Object.fromEntries(
                Object.entries({title,content,priority,progress}).filter(([, v]) => v !== undefined)
            )
            task.set(patch)
            const changes = getDiff(before, task)

            // nothing changed (e.g. same status again): no write and no audit log
            if (Object.keys(changes).length === 0) return task

            await task.save({ session }) // runs schema validation (enums, required)
            await logAudit({ session, taskId: task._id, action: "update", changes, actor: res.locals.actor })
            return task
        })

        res.status(200).json({message:"Task updated successfully", task: result})
    } catch (error) {
        sendError(res, error, "updateTask controller")
    }
}

export const deleteTask = async (req: Request, res: Response) => {
    try {
        const task = await inTransaction(async (session) => {
            const task = await Task.findById(req.params.id).session(session)
            if (!task) throw new HttpError(404, "Task not found")
            if (task.deletedAt) throw new HttpError(409, "Task is already deleted")

            task.deletedAt = new Date()
            await task.save({ session })
            await logAudit({ session, taskId: task._id, action: "delete", changes: {}, actor: res.locals.actor })
            return task
        })

        res.status(200).json({message:`Task "${task.title}" is deleted`, task})
    } catch (error) {
        sendError(res, error, "deleteTask controller")
    }
}

export const restoreTask = async (req: Request, res: Response) => {
    try {
        const task = await inTransaction(async (session) => {
            const task = await Task.findById(req.params.id).session(session)
            if (!task) throw new HttpError(404, "Task not found")
            if (!task.deletedAt) throw new HttpError(409, "Task is not deleted")

            task.deletedAt = null
            await task.save({ session })
            await logAudit({ session, taskId: task._id, action: "restore", changes: {}, actor: res.locals.actor })
            return task
        })

        res.status(200).json({message:`Task "${task.title}" is restored`, task})
    } catch (error) {
        sendError(res, error, "restoreTask controller")
    }
}

export const getTaskLogs = async (req: Request, res: Response) => {
    try {
        // newest first; _id breaks ties between logs created in the same millisecond
        const logs = await AuditLog.find({ taskId: req.params.id}).sort({createdAt: -1, _id: -1})
        res.status(200).json(logs)
    } catch (error) {
        sendError(res, error, "getTaskLogs controller")
    }
}
