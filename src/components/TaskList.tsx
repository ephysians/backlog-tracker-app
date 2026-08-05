import type { Task } from '../types/task';
import { TaskItem } from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  onToggle: (id: string, done: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function TaskList({ tasks, loading, error, onToggle, onDelete }: TaskListProps) {
  if (loading) {
    return <p className="state-message">Loading backlog...</p>;
  }

  if (error) {
    return <p className="state-message state-message--error">{error}</p>;
  }

  if (tasks.length === 0) {
    return <p className="state-message">Backlog's empty. Add the first item above.</p>;
  }

  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} />
      ))}
    </ul>
  );
}
