import type { BacklogFilter } from '../lib/backlogStats';

interface FilterBarProps {
  filter: BacklogFilter;
  onChange: (filter: BacklogFilter) => void;
}

const OPTIONS: { value: BacklogFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'stale', label: 'Stale' },
];

export function FilterBar({ filter, onChange }: FilterBarProps) {
  return (
    <div className="filter-bar" role="group" aria-label="Filter backlog">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`filter-bar__btn ${filter === opt.value ? 'active' : ''}`}
          onClick={() => onChange(opt.value)}
          aria-pressed={filter === opt.value}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
