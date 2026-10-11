import { priorityBadge } from "../constants/task";
import type { AuditLog, Task } from "../types";
import AuditTimeline from "./AuditTimeline";
import ProgressTooltip from "./ProgressTooltip";

type Props = {
  task: Task;
  logs: AuditLog[] | undefined;
  isOpen: boolean; // audit row expanded
  onToggle: () => void;
  onHoverProgress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRestore: () => void;
};

const TaskRow = ({
  task,
  logs,
  isOpen,
  onToggle,
  onHoverProgress,
  onEdit,
  onDelete,
  onRestore,
}: Props) => (
  <>
    <tr className={task.deletedAt ? "opacity-50" : ""}>
      <td className={task.deletedAt ? "line-through" : ""}>{task.title}</td>
      <td>{task.content}</td>
      <td>
        <span className={`badge badge-sm ${priorityBadge[task.priority]}`}>
          {task.priority}
        </span>
      </td>
      <td>
        <ProgressTooltip progress={task.progress} logs={logs} onHover={onHoverProgress} />
      </td>
      <td>
        <div className="flex gap-2">
          <div className="tooltip" data-tip={isOpen ? "hide logs" : "show logs"}>
            <label className="btn btn-circle btn-xs btn-neutral swap swap-rotate">
              <input type="checkbox" checked={isOpen} onChange={onToggle} />
              {/* hamburger icon */}
              <svg
                className="swap-off fill-current"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 512 512"
              >
                <path d="M64,384H448V341.33H64Zm0-106.67H448V234.67H64ZM64,128v42.67H448V128Z" />
              </svg>
              {/* close icon */}
              <svg
                className="swap-on fill-current"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 512 512"
              >
                <polygon points="400 145.49 366.51 112 256 222.51 145.49 112 112 145.49 222.51 256 112 366.51 145.49 400 256 289.49 366.51 400 400 366.51 289.49 256 400 145.49" />
              </svg>
            </label>
          </div>
          {task.deletedAt ? (
            <button className="btn btn-xs btn-success btn-outline" onClick={onRestore}>
              ↺ restore
            </button>
          ) : (
            <>
              <button className="btn btn-xs btn-dash btn-neutral" onClick={onEdit}>
                🖊 edit
              </button>
              <button className="btn btn-xs btn-error btn-outline" onClick={onDelete}>
                🗑 delete
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
    {isOpen && (
      <tr>
        <td colSpan={5} className="bg-base-200">
          {/* w-0 + min-w-full: scroll inside the cell instead of widening the table */}
          <div className="w-0 min-w-full overflow-x-auto pb-2">
            <AuditTimeline logs={logs} />
          </div>
        </td>
      </tr>
    )}
  </>
);

export default TaskRow;
