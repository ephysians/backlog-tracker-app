# Backlog Tracker
**https://backlog-tracker-app.vercel.app/**

A small React + TypeScript app for triaging a frontend work backlog: not just a todo list, it tracks how long items have sat untouched, flags what's gone stale, and sorts by what actually needs attention rather than by insertion order. Includes an AI-assisted triage feature that turns a messy, dashed-off task description into a clear title and a reasoned priority.

## Project brief

**Problem:** backlog items rot silently in flat todo lists. Nothing surfaces what's been ignored, and priority gets set once at creation and never revisited.

**Who it's for:** a solo developer or small team lead (technical co-founder, freelancer, or intern managing their own queue) who wants to see what's actually urgent versus what's just old, without a heavyweight project management tool.

**Why this idea:** it's the same problem framing as my own portfolio work this internship, clearing a frontend backlog, so building the tool itself doubles as proof of the claim.

## Live app

`[fill in your Vercel URL after deployment]`

## Repository

`[fill in your GitHub URL]`

## Setup & run

```bash
npm install
npm run dev
```

This runs the frontend at `http://localhost:5173`. The Firestore connection needs a `.env.local` file (copy `.env.example` and fill in your own Firebase project's config, see `DEVELOPMENT.md` for where to get those values).

**AI triage locally:** the `/api/triage` endpoint is a Vercel serverless function, so it won't run under plain `vite dev`. To test it locally, install the Vercel CLI and run `vercel dev` instead of `npm run dev`, with `GEMINI_API_KEY` set in your local environment (get a free key with no card required at [aistudio.google.com](https://aistudio.google.com)). Without that, the AI triage button will show its fallback error state, the rest of the app works normally either way, that's the resilience design working as intended, not a bug.

## Architecture

```
src/
  components/     TaskForm (incl. AI triage), TaskList, TaskItem, BacklogSummary, FilterBar
  hooks/          useTasks (Firestore CRUD + real-time subscription), useTriage (AI endpoint client)
  lib/            firebase.ts (SDK init), backlogStats.ts (pure triage logic: aging, staleness, sort, filter)
  types/          Task, NewTask, Priority
api/
  triage.js       Vercel serverless function calling Gemini; the only place the AI API key is read
```

**Data flow:** `useTasks` subscribes to Firestore in real time via `onSnapshot`, so any change (from this tab, another tab, or another device) reflects immediately. Writes (`addTask`, `toggleTask`, `deleteTask`) are separate async functions with their own error handling, distinct from the subscription's own error path, since a write failing and a subscription failing are different problems with different recoveries.

**Triage logic** (`lib/backlogStats.ts`) is pure functions with no dependency on React or Firestore, deliberately, so it's unit-testable in isolation and portable if the storage layer ever changes.

## AI integration

**What it does:** the "AI triage" button sends the raw, as-typed task title to an LLM via a serverless function, and gets back a cleaned-up title, a suggested priority (low/normal/urgent), and one sentence of reasoning for that priority.

**Provider:** Google Gemini (`gemini-2.5-flash`), called from `api/triage.js`. The assignment brief explicitly allows "Claude API... or another LLM you prefer"; I initially built this against the Claude API, then switched to Gemini because Anthropic's API has no standing free tier (a one-time signup credit that wasn't available on my account) and Gemini's free tier via Google AI Studio has no card requirement and doesn't expire. The JSON contract the function returns is provider-agnostic (`{ title, priority, reasoning }`), so switching providers meant changing only `api/triage.js`, nothing in the client, the hook, or the tests needed to change.

**Why this and not a chatbot:** the actual problem is that backlog entries get written in a rush ("nav thing broken on phones asap") and don't carry enough structure to triage consistently later. This feature fixes that specific gap, structure and priority reasoning, rather than being a general-purpose assistant bolted onto an unrelated app.

**Prompt:** the model is instructed to return only a JSON object with `title`, `priority`, and `reasoning`, no prose, no markdown fences, using Gemini's `responseMimeType: "application/json"` mode so the response can be parsed directly without a second cleanup pass.

**Failure handling:** if the API call fails (missing key, network error, malformed response, unparseable JSON), `useTriage` catches it, surfaces a plain-language error ("AI suggestion unavailable right now, you can still add the task manually"), and leaves the form exactly as the user left it. The AI is an assist, never a dependency, adding a task always works with or without it.

## Testing

Run:
```bash
npm test
```

16 tests across two files:
- `lib/backlogStats.test.ts`, unit tests for staleness, aging, sorting, and filtering logic, including the edge case that done tasks are never flagged stale regardless of age
- `components/TaskForm.test.tsx`, covers manual submission, the AI triage success path, and, deliberately, the AI triage failure path: confirms the form stays usable and the typed title isn't wiped when the API call fails

## Known limitations & future improvements

- No authentication: all tasks are in one shared Firestore collection with no per-user separation. Fine for a personal tool, not for multi-user use as-is.
- The Firestore security rules are in test mode (open read/write). Before any real use, this needs proper rules scoped to an authenticated user.
- AI triage priority suggestions aren't calibrated against real usage yet, they're a reasonable first pass, not tuned on this specific person's actual backlog language.
- No pagination: an unbounded task list will eventually be slow to render as items accumulate.

## Deployment & operation

See `DEPLOYMENT_CHECKLIST.md` for the filled-out deployment checklist, including error states and rollback plan.

## Reflection

See `REFLECTION.md`.
