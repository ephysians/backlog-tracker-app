import { useMemo, useState } from 'react';
import { useTasks } from './hooks/useTasks';
import { TaskForm } from './components/TaskForm';
import { TaskList } from './components/TaskList';
import { BacklogSummary } from './components/BacklogSummary';
import { FilterBar } from './components/FilterBar';
import { computeBacklogStats, triageSort, applyFilter, type BacklogFilter } from './lib/backlogStats';
import './App.css';

export default function App() {
  const { tasks, loading, error, addTask, toggleTask, deleteTask } = useTasks();
  const [filter, setFilter] = useState<BacklogFilter>('all');

  const stats = useMemo(() => computeBacklogStats(tasks), [tasks]);
  const visibleTasks = useMemo(() => triageSort(applyFilter(tasks, filter)), [tasks, filter]);

  return (
    <main className="app">
      <header className="app__header">
        <h1>Backlog Tracker</h1>
        <p className="app__subtitle">
          {loading ? 'Checking the queue...' : 'Sorted by what actually needs attention first, not by when it was added.'}
        </p>
      </header>

      {!loading && !error && <BacklogSummary stats={stats} />}

      <TaskForm onAdd={addTask} />
      <FilterBar filter={filter} onChange={setFilter} />
      <TaskList
        tasks={visibleTasks}
        loading={loading}
        error={error}
        onToggle={toggleTask}
        onDelete={deleteTask}
      />
    </main>
  );
}
