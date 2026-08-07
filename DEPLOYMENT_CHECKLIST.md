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

Run against the live URL (`backlog-tracker-app.vercel.app`) in Chrome DevTools, mobile device setting, incognito window (to exclude browser extensions from skewing results, as Lighthouse itself flags when extensions are active).

Six runs were taken across two rounds of performance optimization:

| Run | Performance | Accessibility | Best Practices | SEO | Notes |
|---|---|---|---|---|---|
| 1 (with extensions) | 58 | 100 | 100 | 90 | Discarded, Lighthouse explicitly flagged extension interference |
| 2 (incognito, before optimization) | 81 | 100 | 100 | 90 | Baseline clean run |
| 3 (after lazy-loading Firestore) | 83 | 100 | 100 | 90 | Bundle split ~495KB → ~151KB main chunk |
| 4 (after adding preconnect hints, wrong hostnames) | 68 | 100 | 100 | 90 | Regression, later traced to incorrect preconnect targets |
| 5 (re-run, same code) | 76 | 100 | 100 | 90 | No code change from run 4, confirms run-to-run variance |
| 6 (after React.memo, vendor chunk split, corrected preconnect hostnames) | 81 | 100 | 100 | 90 | TBT improved to 370ms, best of any run |

**Accessibility, Best Practices, and SEO were stable at 100/100/90 across all six runs**, zero variance, trustworthy as reported.

**Performance ranged 68 to 83 across clean (non-extension) runs, settling around 81 as the representative score** after two rounds of real, verified optimization work:
- Firestore SDK moved from a static import to a dynamic `import()`, confirmed via build output to cut the main chunk from ~495KB to ~151KB
- `TaskItem` wrapped in `React.memo` to stop re-rendering every list item on every Firestore snapshot update, only the changed item re-renders now
- Vite's `manualChunks` configured to split React into its own vendor chunk, so app-code deploys don't bust the cache on the (larger) React chunk
- Preconnect hints corrected to target Firestore's actual transport hostnames (`firestore.googleapis.com`, `www.googleapis.com`), an initial attempt targeted the wrong ones

**Honest architectural conclusion:** the dominant remaining cost is Largest Contentful Paint (typically 3.3-3.8s), tied to the real network round-trip Firestore requires: connect, authenticate, receive the first snapshot, before any meaningful content can render. None of the above optimizations eliminate that round-trip, they reduce the JavaScript and connection-setup overhead around it. The only way to remove it entirely would be to render something meaningful before data arrives (a skeleton UI, or cached data from localStorage/IndexedDB shown optimistically while Firestore catches up), which is a product and architecture decision, not a quick performance fix, and was deliberately left out of scope here rather than rushed in just to move a number. This falls short of the assignment's ≥85 target, documented honestly rather than chased indefinitely with further re-runs.

**Concrete performance improvements made based on Lighthouse findings:** (1) dynamic-imported the Firestore SDK, verified via build output (495KB → 151KB main chunk); (2) memoized `TaskItem` to eliminate unnecessary re-renders on data updates; (3) split the vendor chunk for better repeat-visit caching; (4) corrected preconnect hostnames to the real Firestore transport domains. Each was verified independently (type-check, full test suite, build output) rather than judged by Lighthouse score alone, since a single Lighthouse run against a live deployment proved too noisy to be a reliable verification method on its own.

## Accessibility audit findings

Tool: axe DevTools (Pro), full-page scan against the live URL, WCAG 2.1 AA ruleset.

**First scan: 10 issues, all "Serious," all the same root cause** — insufficient color contrast:
- `.task-item__age`, `.task-item__priority`, `.task-item__delete` text (`#8a8f9c` on `#f4f2ec` light card background): 2.89:1, needed 4.5:1
- Urgent count in the summary bar (`#e4572e` on `#1d2028` dark background): 4.42:1, needed 4.5:1

Root cause: the muted gray and urgent orange were each color-checked against one background context (the dark page background) and then reused on the light task-card background without re-checking contrast there.

**Fix:** added a dedicated `--muted-on-light` variable for text on the light panel, brightened `--urgent` for text-on-dark contexts, and added a separate `--urgent-badge-bg` for white-text-on-urgent contexts (brightening `--urgent` for the first fix would have broken the second). Two additional failures were caught proactively, not by axe, since axe can only scan what's currently rendered: the stale badge (no stale task existed at scan time to render it) and the delete button's hover state (not triggered by an automated scan). Both fixed the same way, verified visually by temporarily forcing a stale state and confirming the white-on-orange badge read clearly.

**Re-scan after fix: 0 issues.**

**Concrete improvement made based on audit findings:** replaced context-blind color reuse with purpose-specific contrast-checked variables (`--muted-on-light`, `--urgent-badge-bg`), fixing 10 flagged violations plus 2 additional ones the scan couldn't see yet, all verified against WCAG AA's 4.5:1 threshold by calculation, then confirmed with a clean re-scan.

## How this app fails safely

- **AI triage failure:** caught in `useTriage`, surfaces a plain-language message, form remains fully usable for manual entry. Verified by an automated test (`TaskForm.test.tsx`), not just manual spot-checking.
- **Firestore subscription failure:** caught in `useTasks`'s `onSnapshot` error callback, shows "Could not load tasks. Check your connection and try again." instead of a blank screen or crash.
- **Firestore write failure** (add/toggle/delete): caught per-operation, sets an error message; the UI doesn't silently swallow a failed write as if it succeeded.

## Rollback plan

This is a small app with no database migrations and no build-time secrets baked into committed code, so rollback is simple: **redeploy from the previous commit on `main`** via Vercel's deployment history (each deploy is tied to a Git commit; Vercel's dashboard lets you promote any prior deployment back to production in one click). No separate rollback tooling or scripts needed at this scale.

## Sign-off

Deployed by: Emmanuel Chukwukere Obinna
Date: _(fill in)_
Live URL: _(https://backlog-tracker-app.vercel.app/)_
