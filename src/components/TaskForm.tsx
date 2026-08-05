import { useState, FormEvent } from 'react';
import type { NewTask, Priority } from '../types/task';
import { useTriage } from '../hooks/useTriage';

interface TaskFormProps {
  onAdd: (task: NewTask) => Promise<void>;
}

export function TaskForm({ onAdd }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('normal');
  const [submitting, setSubmitting] = useState(false);
  const [suggestion, setSuggestion] = useState<{ reasoning: string } | null>(null);
  const { suggest, loading: triaging, error: triageError } = useTriage();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    setSubmitting(true);
    try {
      await onAdd({ title: trimmed, priority });
      setTitle('');
      setPriority('normal');
      setSuggestion(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTriage = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;

    const result = await suggest(trimmed);
    // If the AI call fails, result is null and the form stays exactly as
    // the user left it, nothing is overwritten, so a failed suggestion
    // never blocks manual entry.
    if (result) {
      setTitle(result.title);
      setPriority(result.priority);
      setSuggestion({ reasoning: result.reasoning });
    }
  };

  return (
    <form className="task-form-wrap" onSubmit={handleSubmit}>
      <div className="task-form">
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setSuggestion(null);
          }}
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
        <button
          type="button"
          className="task-form__ai-btn"
          onClick={handleTriage}
          disabled={triaging || !title.trim() || submitting}
          aria-label="Get AI triage suggestion for title and priority"
        >
          {triaging ? 'Thinking...' : 'AI triage'}
        </button>
        <button type="submit" disabled={submitting || !title.trim()}>
          {submitting ? 'Adding...' : 'Add'}
        </button>
      </div>
      {suggestion && (
        <p className="task-form__suggestion" role="status">
          AI suggested: {suggestion.reasoning}
        </p>
      )}
      {triageError && (
        <p className="task-form__suggestion task-form__suggestion--error" role="status">
          {triageError}
        </p>
      )}
    </form>
  );
}
