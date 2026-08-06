import { useEffect, useState, useCallback, useRef } from "react";
import type { Task, NewTask } from "../types/task";

const TASKS_COLLECTION = "tasks";

interface UseTasksResult {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  addTask: (task: NewTask) => Promise<void>;
  toggleTask: (id: string, done: boolean) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

// Firestore (firebase/firestore) is a large chunk of the JS bundle and isn't
// needed to paint the initial page, only to load data after. Loading it via
// dynamic import() instead of a static top-level import splits it into its
// own chunk that fetches after first paint, improving Lighthouse Performance
// (specifically LCP/TBT) without changing any behavior, the app still needs
// Firestore to actually function, it just doesn't block the first render on it.
export function useTasks(): UseTasksResult {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const firestoreRef = useRef<typeof import("firebase/firestore") | null>(null);
  const dbRef = useRef<import("firebase/firestore").Firestore | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const [firestore, { db }] = await Promise.all([
        import("firebase/firestore"),
        import("../lib/firebase"),
      ]);
      if (cancelled) return;

      firestoreRef.current = firestore;
      dbRef.current = db;

      const { collection, onSnapshot, query, orderBy } = firestore;
      const q = query(
        collection(db, TASKS_COLLECTION),
        orderBy("createdAt", "desc"),
      );

      // onSnapshot's error callback is the second argument, not a .catch()
      // chain, since this is a long-lived subscription, not a one-off promise.
      unsubscribe = onSnapshot(
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
          console.error("Failed to subscribe to tasks:", err);
          setError(
            "Could not load tasks. Check your connection and try again.",
          );
          setLoading(false);
        },
      );
    })();

    // Cleanup: unsubscribe when the component unmounts, or this leaks a
    // live Firestore listener every time the hook re-mounts.
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const addTask = useCallback(async (task: NewTask) => {
    try {
      const firestore = firestoreRef.current;
      const db = dbRef.current;
      if (!firestore || !db) throw new Error("Firestore not ready yet");
      await firestore.addDoc(firestore.collection(db, TASKS_COLLECTION), {
        ...task,
        done: false,
        createdAt: firestore.serverTimestamp(),
      });
    } catch (err) {
      console.error("Failed to add task:", err);
      setError("Could not add task. Try again.");
      throw err;
    }
  }, []);

  const toggleTask = useCallback(async (id: string, done: boolean) => {
    try {
      const firestore = firestoreRef.current;
      const db = dbRef.current;
      if (!firestore || !db) throw new Error("Firestore not ready yet");
      await firestore.updateDoc(firestore.doc(db, TASKS_COLLECTION, id), {
        done,
      });
    } catch (err) {
      console.error("Failed to update task:", err);
      setError("Could not update task. Try again.");
      throw err;
    }
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    try {
      const firestore = firestoreRef.current;
      const db = dbRef.current;
      if (!firestore || !db) throw new Error("Firestore not ready yet");
      await firestore.deleteDoc(firestore.doc(db, TASKS_COLLECTION, id));
    } catch (err) {
      console.error("Failed to delete task:", err);
      setError("Could not delete task. Try again.");
      throw err;
    }
  }, []);

  return { tasks, loading, error, addTask, toggleTask, deleteTask };
}
