# Backlog Tracker

A small React + TypeScript app for tracking a frontend backlog: add tasks with a priority, mark them done, remove them. Data persists in Firestore in real time.

## Stack

- React 18 + TypeScript
- Vite
- Firebase (Firestore)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com), enable Firestore (test mode is fine for local dev), and copy your web app's config values.
3. Copy `.env.example` to `.env` and fill in the values from step 2:
   ```bash
   cp .env.example .env
   ```
4. Run the dev server:
   ```bash
   npm run dev
   ```

## Project structure

```
src/
  components/   TaskForm, TaskList, TaskItem
  hooks/        useTasks (Firestore CRUD + real-time subscription)
  lib/          firebase.ts (SDK init)
  types/        Task, NewTask, Priority
```

See `DEVELOPMENT.md` for the prompts used during development, how AI assisted, and the specific manual corrections made after reviewing AI-generated code.
