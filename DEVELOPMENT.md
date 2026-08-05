# Development notes: React app with AI

App: Backlog Tracker (React + TypeScript + Firestore). Built to demonstrate hooks, types, and error handling per the session brief, and tied to my actual portfolio claim about clearing frontend backlogs.

## Prompts used, in order

1. **Scaffold and types**
   > Set up a Vite + React + TypeScript project called backlog-tracker. Define a Task type: id, title, priority (low/normal/urgent), done, createdAt. Add a NewTask type for creation (title + priority only).

2. **Firebase init**
   > Initialize Firebase in src/lib/firebase.ts using Firestore, reading config from Vite env variables (VITE_FIREBASE_*), not hardcoded values.

3. **Data hook**
   > Write a custom hook useTasks that subscribes to a Firestore "tasks" collection in real time, ordered by createdAt descending, and exposes tasks, loading, error, addTask, toggleTask, deleteTask. Handle errors from both the subscription and the write operations separately.

4. **Components**
   > Build TaskForm (title + priority select, disabled while submitting), TaskList (loading/error/empty states), and TaskItem (checkbox toggle, delete button), fully typed, no `any`.

5. **Styling**
   > Style it with a distinct visual identity, not a generic card grid. Mobile-first, visible focus states, respects prefers-reduced-motion.

6. **Verification**
   > Type-check the whole project and run a production build; fix anything that fails.

## How AI assisted throughout

AI (Claude) wrote the full first pass of every file: types, the Firestore hook, all three components, and the CSS. That's the fast part; the important part was steps 3 and 6, where the hook's error-handling shape and the actual compile/build verification happened. Rather than asking for a generic "todo app," each prompt named the specific technique to apply (separating subscription errors from write errors, typing NewTask as a subset of Task via `Pick`, etc.) so the output matched real React patterns instead of a tutorial-level example.

## Manual corrections made after review

**Type error caught at compile time, not by eye.** Running `npx tsc --noEmit` after the first pass failed with six errors: `Property 'env' does not exist on type 'ImportMeta'`. The AI-generated `firebase.ts` correctly used `import.meta.env.VITE_FIREBASE_*`, but the project was missing `src/vite-env.d.ts` with the `/// <reference types="vite/client" />` directive that makes Vite's env typing available to TypeScript at all. This is an easy miss because the code *looks* correct and even works at runtime in some setups; it only surfaces as a hard type-check failure. Fixed by adding the missing declaration file, then re-ran `tsc --noEmit` clean and confirmed with a full `vite build`.

**Reviewed, not just accepted: the onSnapshot error handling.** The initial hook draft put error handling only around the write operations (`addTask`, `toggleTask`, `deleteTask`). On review, I asked specifically whether the real-time subscription itself could fail independently (e.g., permission-denied, offline) — it can, and `onSnapshot` takes its own error callback as a second argument rather than something you can `.catch()` like a normal promise. That's a genuine React/Firestore pattern that's easy to miss if you only pattern-match `onSnapshot` to a regular async call, and it's now handled explicitly in the hook with its own `setError` path.

**Cleanup verified, not assumed.** Confirmed the `useEffect` returns `unsubscribe()` so the Firestore listener doesn't leak on unmount or hook re-run in StrictMode's double-invoke behavior, a common miss with real-time subscriptions in hooks.

## Making it a backlog tool, not a renamed todo app

The first version was, honestly, a todo app with a different name and priority field, the core loop (add, check off, delete) is the same as any task list. To make it genuinely different, I added the thing that actually defines a backlog versus a flat list: **triage**, not just tracking.

**Prompt used:**
> Add real backlog-specific behavior: compute each open task's age in days, flag anything open longer than 7 days as "stale," sort the list by priority-then-age instead of just creation time (a triage order, not an insertion order), and add a filter for All / Urgent / Stale. Add a small summary bar showing open count, urgent count, stale count, and the oldest open item's age.

**What this changes structurally:** `src/lib/backlogStats.ts` holds `isStale`, `ageInDays`, `computeBacklogStats`, and `triageSort`, pure functions, independent of Firestore or React, so they're the kind of thing that would get unit tested in a real project. `App.tsx` now sorts by `triageSort(applyFilter(tasks, filter))` instead of trusting Firestore's `orderBy('createdAt')` alone; the query still orders by creation for a stable base list, but what the user actually sees is re-sorted by what needs attention first.

One thing I checked deliberately rather than assumed: `isStale` excludes done tasks (`!task.done && ...`) so a finished item that happens to be old doesn't get flagged stale, a completed task isn't rotting, it's done. Easy mistake to make if staleness is computed from age alone without also checking status, so I verified it explicitly before treating the logic as correct.

This is the actual answer to "how is this different from a task tracker": a todo list treats every item the same until you check it off. A backlog assumes some items are rotting and need surfacing before they're forgotten, that's what the age tracking, staleness flag, and triage sort exist to do.
