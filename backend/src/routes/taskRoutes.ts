import express from 'express'
import {createTask, deleteTask, getAllTask, updateTask, getTaskbyId, getTaskLogs, restoreTask} from "../controllers/taskController.js"
import { requireActor } from "../middleware/actor.js"

const router = express.Router()

router.get("/", getAllTask)
router.get("/:id", getTaskbyId)
router.get("/:id/audit-logs", getTaskLogs)

// writes need a known actor (x-user header)
router.post("/", requireActor, createTask)
router.put("/:id", requireActor, updateTask)
router.put("/:id/restore", requireActor, restoreTask)
router.delete("/:id", requireActor, deleteTask)

export default router
