import { useState } from "react";
import TaskFormModal from "../components/TaskFormModal";
import TaskTable from "../components/TaskTable";
import { useTasks } from "../hooks/useTasks";
import type { Task } from "../types";

const HomePage = ({ user }: { user: string }) => {
  const {
    tasks,
    logs,
    showDeleted,
    setShowDeleted,
    openId,
    ensureLogs,
    toggleDetails,
    saveTask,
    removeTask,
    restoreTask,
  } = useTasks(user);

  // modal state: closed, or open for create (task = null) / edit.
  // `session` changes on every open so the form remounts with fresh values.
  const [modal, setModal] = useState<{ open: boolean; task: Task | null; session: number }>({
    open: false,
    task: null,
    session: 0,
  });
  const openModal = (task: Task | null) =>
    setModal((m) => ({ open: true, task, session: m.session + 1 }));

  return (
    <div className="min-h-screen overflow-x-auto bg-base-200 p-6">
      <button
        className="btn btn-xs btn-primary mb-4"
        onClick={() => openModal(null)}
      >
        + create
      </button>
      <label className="label ml-4 cursor-pointer gap-2 align-middle text-sm">
        <input
          type="checkbox"
          className="toggle toggle-xs"
          checked={showDeleted}
          onChange={(e) => setShowDeleted(e.target.checked)}
        />
        show deleted
      </label>

      <TaskTable
        tasks={tasks}
        logs={logs}
        openId={openId}
        onToggle={toggleDetails}
        onHoverProgress={(task) => ensureLogs(task._id)}
        onEdit={openModal}
        onDelete={removeTask}
        onRestore={restoreTask}
      />

      <TaskFormModal
        key={modal.session}
        open={modal.open}
        task={modal.task}
        onClose={() => setModal((m) => ({ ...m, open: false }))}
        onSubmit={saveTask}
      />
    </div>
  );
};

export default HomePage;
