import { useState, FormEvent } from 'react';
import type { NewTask, Priority } from '../types/task';

interface TaskFormProps {
  onAdd: (task: NewTask) => Promise<void>;
}

export function TaskForm({ onAdd }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('normal');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    setSubmitting(true);
    try {
      await onAdd({ title: trimmed, priority });
      setTitle('');
      setPriority('normal');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What's stuck in the backlog?"
        aria-label="Task title"
        disabled={submitting}
      />
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value as Priority)}
        aria-label="Priority"
        disabled={submitting}
      >
        <option value="low">Low</option>
        <option value="normal">Normal</option>
        <option value="urgent">Urgent</option>
      </select>
      <button type="submit" disabled={submitting || !title.trim()}>
        {submitting ? 'Adding...' : 'Add'}
      </button>
    </form>
  );
}
