import type { Task } from '../types/task';
import { ageInDays, isStale } from '../lib/backlogStats';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string, done: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  const stale = isStale(task);

  return (
    <li className={`task-item priority-${task.priority} ${task.done ? 'done' : ''} ${stale ? 'stale' : ''}`}>
      <label className="task-item__check">
        <input
          type="checkbox"
          checked={task.done}
          onChange={(e) => onToggle(task.id, e.target.checked)}
          aria-label={`Mark "${task.title}" as ${task.done ? 'not done' : 'done'}`}
        />
        <span className="task-item__title">{task.title}</span>
        {stale && <span className="task-item__stale-badge">stale</span>}
      </label>
      <span className="task-item__age">{ageInDays(task.createdAt)}d</span>
      <span className="task-item__priority">{task.priority}</span>
      <button
        type="button"
        className="task-item__delete"
        onClick={() => onDelete(task.id)}
        aria-label={`Delete "${task.title}"`}
      >
        Remove
      </button>
    </li>
  );
}
