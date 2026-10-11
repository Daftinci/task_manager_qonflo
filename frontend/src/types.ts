export type Priority = "low" | "medium" | "high";
export type Progress = "to_do" | "pending" | "in_progress" | "done";

export type Task = {
  _id: string;
  title: string;
  content: string;
  priority: Priority;
  progress: Progress;
  deletedAt?: string | null;
};

// fields the create/edit form works with
export type TaskForm = Pick<Task, "title" | "content" | "priority" | "progress">;

export type AuditLog = {
  _id: string;
  action: "create" | "update" | "delete" | "restore";
  changes?: Record<string, { from: string | null; to: string | null }>;
  performedBy: string;
  createdAt: string;
};
