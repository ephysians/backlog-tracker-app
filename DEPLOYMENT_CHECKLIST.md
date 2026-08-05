# Deployment Checklist

## Pre-deploy

- [x] `npm run build` completes with no errors
- [x] `npx tsc --noEmit` passes with no type errors
- [x] `npm test` passes (16/16)
- [ ] Firestore security rules reviewed (currently test mode, open read/write; acceptable for this capstone's scope, flagged as a known limitation, not silently ignored)
- [ ] `GEMINI_API_KEY` added to Vercel project environment variables (never committed to the repo, never in `.env.example` beyond a blank placeholder)
- [ ] Firebase config values added to Vercel project environment variables (`VITE_FIREBASE_*`)

## Deploy

- [ ] Connect the GitHub repo to Vercel (import project, framework preset: Vite)
- [ ] Confirm the `/api` directory is detected as serverless functions (Vercel does this automatically for a Vite + `/api` structure, verify in the deploy log)
- [ ] First deploy succeeds, live URL is reachable

## Post-deploy verification

- [ ] Add a task manually on the live URL, confirm it persists after refresh
- [ ] Click "AI triage" on the live URL, confirm a real suggestion comes back (this confirms `GEMINI_API_KEY` is correctly set in Vercel, not just locally)
- [ ] Temporarily test the failure path: if possible, confirm the app still works and shows the fallback error message if the AI call fails (e.g. by checking behavior matches the tested fallback in `TaskForm.test.tsx`)
- [ ] Run Lighthouse against the live URL (Chrome DevTools > Lighthouse), record scores below
- [ ] Run an accessibility audit (axe DevTools or WAVE) against the live URL, record findings below

## Lighthouse scores

_(fill in after running against the live URL)_

| Category | Score |
|---|---|
| Performance | |
| Accessibility | |
| Best Practices | |
| SEO | |

## Accessibility audit findings

_(fill in after running axe or WAVE)_

**One concrete improvement made based on audit findings:**

## How this app fails safely

- **AI triage failure:** caught in `useTriage`, surfaces a plain-language message, form remains fully usable for manual entry. Verified by an automated test (`TaskForm.test.tsx`), not just manual spot-checking.
- **Firestore subscription failure:** caught in `useTasks`'s `onSnapshot` error callback, shows "Could not load tasks. Check your connection and try again." instead of a blank screen or crash.
- **Firestore write failure** (add/toggle/delete): caught per-operation, sets an error message; the UI doesn't silently swallow a failed write as if it succeeded.

## Rollback plan

This is a small app with no database migrations and no build-time secrets baked into committed code, so rollback is simple: **redeploy from the previous commit on `main`** via Vercel's deployment history (each deploy is tied to a Git commit; Vercel's dashboard lets you promote any prior deployment back to production in one click). No separate rollback tooling or scripts needed at this scale.

## Sign-off

Deployed by: Emmanuel Chukwukere Obinna
Date: _(fill in)_
Live URL: _(fill in)_
