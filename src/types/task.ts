export type Priority = 'low' | 'normal' | 'urgent';

export interface Task {
  id: string;
  title: string;
  priority: Priority;
  done: boolean;
  createdAt: number;
}

export type NewTask = Pick<Task, 'title' | 'priority'>;
