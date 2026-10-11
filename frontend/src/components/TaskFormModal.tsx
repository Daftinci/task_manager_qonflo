import { useEffect, useRef, useState } from "react";
import { ALLOWED_TRANSITIONS } from "../constants/task";
import type { Task, TaskForm } from "../types";
import { formatProgress } from "../utils/format";

const emptyForm: TaskForm = {
  title: "",
  content: "",
  priority: "low",
  progress: "to_do",
};

type Props = {
  open: boolean;
  task: Task | null; // null = create mode, otherwise edit this task
  onClose: () => void;
  onSubmit: (form: TaskForm, editingId: string | null) => Promise<boolean>;
};

// The parent remounts this (new `key`) every time the modal opens,
// so the form always starts from the task being edited (or empty for create).
const TaskFormModal = ({ open, task, onClose, onSubmit }: Props) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState<TaskForm>(
    task
      ? {
          title: task.title,
          content: task.content,
          priority: task.priority,
          progress: task.progress,
        }
      : emptyForm,
  );

  // open/close the native <dialog>
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  // current status + the statuses it is allowed to move to
  const allowedProgress = task ? [task.progress, ...ALLOWED_TRANSITIONS[task.progress]] : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await onSubmit(form, task?._id ?? null)) onClose();
  };

  return (
    // onClose also fires for Esc and the backdrop, keeping the parent state in sync
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box">
        <h3 className="mb-4 text-lg font-bold">{task ? "Edit task" : "Create task"}</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            className="input w-full"
            placeholder="Title"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <textarea
            className="textarea w-full"
            placeholder="Content"
            required
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
          <select
            className="select w-full"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value as Task["priority"] })}
          >
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </select>
          {task && (
            <select
              className="select w-full"
              value={form.progress}
              onChange={(e) => setForm({ ...form, progress: e.target.value as Task["progress"] })}
            >
              {/* only the current status and allowed transitions */}
              {allowedProgress.map((p) => (
                <option key={p} value={p}>
                  {formatProgress(p)}
                </option>
              ))}
            </select>
          )}
          <div className="modal-action">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {task ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
};

export default TaskFormModal;
