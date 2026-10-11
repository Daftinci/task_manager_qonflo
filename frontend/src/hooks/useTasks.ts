import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import * as api from "../api/tasks";
import type { AuditLog, Task, TaskForm } from "../types";

// All task + audit log state and the actions on it. `user` is the acting account.
export const useTasks = (user: string) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<Record<string, AuditLog[]>>({});
  const [showDeleted, setShowDeleted] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const loadingLogs = useRef(new Set<string>()); // ids being fetched, avoids duplicate requests

  useEffect(() => {
    api.listTasks(showDeleted).then(setTasks);
  }, [showDeleted]);

  const loadLogs = async (id: string) => {
    const list = await api.getTaskLogs(id);
    setLogs((prev) => ({ ...prev, [id]: list }));
  };

  // history changed: drop the cache, reload if the row is open
  const refreshLogs = (id: string) => {
    setLogs((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (openId === id) loadLogs(id);
  };

  // used by the progress tooltip: fetch a task's logs on first hover
  const ensureLogs = async (id: string) => {
    if (logs[id] || loadingLogs.current.has(id)) return;
    loadingLogs.current.add(id);
    try {
      await loadLogs(id);
    } catch {
      /* tooltip just keeps saying "loading" */
    } finally {
      loadingLogs.current.delete(id);
    }
  };

  const toggleDetails = async (task: Task) => {
    if (openId === task._id) {
      setOpenId(null);
      return;
    }
    setOpenId(task._id);
    if (logs[task._id]) return; // already loaded
    await loadLogs(task._id);
  };

  const replaceTask = (updated: Task) =>
    setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));

  // create (editingId = null) or update. Returns true on success so the modal can close.
  const saveTask = async (form: TaskForm, editingId: string | null): Promise<boolean> => {
    try {
      if (editingId) {
        replaceTask(await api.updateTask(editingId, form, user));
        refreshLogs(editingId);
        toast.success("Task updated");
      } else {
        const created = await api.createTask(form, user);
        setTasks((prev) => [created, ...prev]); // newest first
        toast.success("Task created");
      }
      return true;
    } catch (e) {
      toast.error(api.errMsg(e, editingId ? "Failed to update task" : "Failed to create task"));
      return false;
    }
  };

  const removeTask = async (task: Task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    try {
      const deleted = await api.deleteTask(task._id, user);
      if (showDeleted) replaceTask(deleted);
      else setTasks((prev) => prev.filter((t) => t._id !== task._id));
      refreshLogs(task._id);
      toast.success("Task deleted");
    } catch (e) {
      toast.error(api.errMsg(e, "Failed to delete task"));
    }
  };

  const restoreTask = async (task: Task) => {
    try {
      replaceTask(await api.restoreTask(task._id, user));
      refreshLogs(task._id);
      toast.success("Task restored");
    } catch (e) {
      toast.error(api.errMsg(e, "Failed to restore task"));
    }
  };

  // active tasks first, deleted ones below (the sort is stable, so each group keeps its order)
  const sortedTasks = [...tasks].sort(
    (a, b) => Number(Boolean(a.deletedAt)) - Number(Boolean(b.deletedAt)),
  );

  return {
    tasks: sortedTasks,
    logs,
    showDeleted,
    setShowDeleted,
    openId,
    ensureLogs,
    toggleDetails,
    saveTask,
    removeTask,
    restoreTask,
  };
};
