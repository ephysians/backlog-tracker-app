import type { Task, Priority } from '../types/task';

// A task is "stale" if it's been open this long without being touched.
// This is the core idea that separates a backlog from a flat todo list:
// a backlog rots if items sit untriaged, a todo list doesn't have that concept.
export const STALE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function ageInDays(createdAt: number): number {
  return Math.floor((Date.now() - createdAt) / (24 * 60 * 60 * 1000));
}

export function isStale(task: Task): boolean {
  return !task.done && Date.now() - task.createdAt > STALE_THRESHOLD_MS;
}

export interface BacklogStats {
  open: number;
  urgent: number;
  stale: number;
  oldestOpenAgeDays: number | null;
}

export function computeBacklogStats(tasks: Task[]): BacklogStats {
  const open = tasks.filter((t) => !t.done);
  const urgent = open.filter((t) => t.priority === 'urgent').length;
  const stale = open.filter(isStale).length;
  const oldestOpenAgeDays = open.length > 0 ? Math.max(...open.map((t) => ageInDays(t.createdAt))) : null;

  return { open: open.length, urgent, stale, oldestOpenAgeDays };
}

// Triage order: open items before done items, then urgent > normal > low,
// then oldest first within the same priority (the thing most likely to rot next).
// A plain todo list sorts by creation time alone; a backlog has to sort by
// what actually needs attention first.
const PRIORITY_RANK: Record<Priority, number> = { urgent: 0, normal: 1, low: 2 };

export function triageSort(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    const priorityDiff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return a.createdAt - b.createdAt;
  });
}

export type BacklogFilter = 'all' | 'urgent' | 'stale';

export function applyFilter(tasks: Task[], filter: BacklogFilter): Task[] {
  if (filter === 'urgent') return tasks.filter((t) => !t.done && t.priority === 'urgent');
  if (filter === 'stale') return tasks.filter((t) => isStale(t));
  return tasks;
}
