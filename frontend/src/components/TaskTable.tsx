import type { AuditLog, Task } from "../types";
import TaskRow from "./TaskRow";

type Props = {
  tasks: Task[];
  logs: Record<string, AuditLog[]>;
  openId: string | null;
  onToggle: (task: Task) => void;
  onHoverProgress: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onRestore: (task: Task) => void;
};

const TaskTable = ({
  tasks,
  logs,
  openId,
  onToggle,
  onHoverProgress,
  onEdit,
  onDelete,
  onRestore,
}: Props) => (
  <div className="overflow-x-auto rounded-box border border-base-content/15 bg-base-100">
    <table className="table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Description</th>
          <th>Priority</th>
          <th>Progress</th>
        </tr>
      </thead>
      <tbody>
        {tasks.map((task) => (
          <TaskRow
            key={task._id}
            task={task}
            logs={logs[task._id]}
            isOpen={openId === task._id}
            onToggle={() => onToggle(task)}
            onHoverProgress={() => onHoverProgress(task)}
            onEdit={() => onEdit(task)}
            onDelete={() => onDelete(task)}
            onRestore={() => onRestore(task)}
          />
        ))}
      </tbody>
    </table>
  </div>
);

export default TaskTable;
