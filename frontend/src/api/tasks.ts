import axios from "axios";
import type { AuditLog, Task, TaskForm } from "../types";

// the backend needs the acting user on every write
const asUser = (user: string) => ({ headers: { "x-user": user } });

export const listTasks = (includeDeleted: boolean) =>
  axios
    .get<Task[]>("/api/task", { params: { includeDeleted } })
    .then((res) => res.data);

// the backend returns newest first; the timeline wants oldest first
export const getTaskLogs = (id: string) =>
  axios
    .get<AuditLog[]>(`/api/task/${id}/audit-logs`)
    .then((res) => [...res.data].reverse());

export const createTask = (form: TaskForm, user: string) =>
  axios.post<Task>("/api/task", form, asUser(user)).then((res) => res.data);

export const updateTask = (id: string, form: TaskForm, user: string) =>
  axios
    .put<{ task: Task }>(`/api/task/${id}`, form, asUser(user))
    .then((res) => res.data.task);

export const deleteTask = (id: string, user: string) =>
  axios.delete<{ task: Task }>(`/api/task/${id}`, asUser(user)).then((res) => res.data.task);

export const restoreTask = (id: string, user: string) =>
  axios
    .put<{ task: Task }>(`/api/task/${id}/restore`, {}, asUser(user))
    .then((res) => res.data.task);

// show the backend's message (e.g. invalid status change) when there is one
export const errMsg = (e: unknown, fallback: string) =>
  axios.isAxiosError(e) ? (e.response?.data?.message ?? fallback) : fallback;
