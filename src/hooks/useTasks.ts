import { useEffect, useState, useCallback } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Task, NewTask } from '../types/task';

const TASKS_COLLECTION = 'tasks';

interface UseTasksResult {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  addTask: (task: NewTask) => Promise<void>;
  toggleTask: (id: string, done: boolean) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

export function useTasks(): UseTasksResult {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, TASKS_COLLECTION), orderBy('createdAt', 'desc'));

    // onSnapshot's error callback is the second argument, not a .catch() chain,
    // since this is a long-lived subscription, not a one-off promise.
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const next: Task[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            title: data.title,
            priority: data.priority,
            done: data.done,
            createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
          };
        });
        setTasks(next);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Failed to subscribe to tasks:', err);
        setError('Could not load tasks. Check your connection and try again.');
        setLoading(false);
      }
    );

    // Cleanup: unsubscribe when the component unmounts, or this leaks a
    // live Firestore listener every time the hook re-mounts.
    return () => unsubscribe();
  }, []);

  const addTask = useCallback(async (task: NewTask) => {
    try {
      await addDoc(collection(db, TASKS_COLLECTION), {
        ...task,
        done: false,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Failed to add task:', err);
      setError('Could not add task. Try again.');
      throw err;
    }
  }, []);

  const toggleTask = useCallback(async (id: string, done: boolean) => {
    try {
      await updateDoc(doc(db, TASKS_COLLECTION, id), { done });
    } catch (err) {
      console.error('Failed to update task:', err);
      setError('Could not update task. Try again.');
      throw err;
    }
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, TASKS_COLLECTION, id));
    } catch (err) {
      console.error('Failed to delete task:', err);
      setError('Could not delete task. Try again.');
      throw err;
    }
  }, []);

  return { tasks, loading, error, addTask, toggleTask, deleteTask };
}
