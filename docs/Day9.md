# ADBWeb — Day 9 Log

**Goal for the day:** Error handling pass (REQ-INFER-5, REQ-ANALYSIS-4) and a mobile-responsive pass across all screens built so far.

**Status:** ✅ Complete

---

## Part 1: Error handling

### Scope note on REQ-ANALYSIS-4 (documented upfront, not a full solve)

The SRS requires inference to terminate if the user closes/refreshes the tab. What was actually implemented today is the **browser side** of this: an `AbortController` cancels the pending fetch request when the page unloads, so the browser stops waiting on a response it'll never use. What was *not* implemented: forcing FastAPI itself to stop mid-computation once a request has already reached it — that would require the backend to actively check for client disconnection during processing (e.g. per-chunk), which is a deeper change than today's scope covers. Logged clearly as a partial implementation, not a full one.

### What was built

**`components/ErrorBanner.tsx` (new)** — styled error state (red border/background, message, "Try again" button), visually consistent with `UploadZone`'s existing error state from Day 5.

**`app/api/analyze/route.ts` (updated)** — three failure modes now handled distinctly instead of one generic path:
- FastAPI completely unreachable (not running, wrong port) → caught via `try/catch` around the `fetch()` call itself → 503 with a clear message
- FastAPI reachable but returns a non-OK HTTP status → 502 with a clear message
- FastAPI returns a 200 but the body isn't valid JSON → guarded separately, 502
- FastAPI's own internal errors (e.g. from `audio_utils.py`'s `ValueError` handling) still pass through as-is, since those already return sensible messages

This satisfies REQ-INFER-5 ("display an error message if the inference service is unavailable or returns an unexpected response") with three genuinely distinct, understandable failure states instead of one catch-all.

**`app/page.tsx` (updated)**:
- Added an `AbortController`, stored in a ref, created fresh on each `handleAnalyze()` call
- Added a `beforeunload` listener (via `useEffect`) that calls `.abort()` on the current controller if the user navigates away or closes the tab mid-request
- The fetch call's `AbortError` is caught and treated as a silent no-op (no error UI shown) — since the page is unloading anyway, there's no one left to show an error to
- Swapped the plain error text for the new `ErrorBanner` component

### Verified

Stopped the FastAPI server mid-testing, ran a valid file through Analyze → got a proper error banner ("analysis service is currently unavailable") instead of a crash or silent failure. Restarted FastAPI, confirmed the happy path still works exactly as before.

---

## Part 2: Mobile responsive pass

Reviewed the full flow (upload → analyze → chunk progress → report → error → help dialog) using browser DevTools' device toolbar at a small screen size (iPhone SE-class viewport, intentionally narrow to catch the most issues).

Small adjustments made:
- `app/page.tsx` — reduced top margin on small screens (`mt-8` mobile → `mt-20` desktop) so the layout doesn't push content too far down on short viewports
- `components/ChunkProgress.tsx` — replaced a fixed `w-72` with `w-full max-w-xs mx-4`, preventing horizontal overflow on very narrow screens
- `components/DetectionReport.tsx` — per-chunk result rows switch from a horizontal row to a stacked layout below the `sm` breakpoint, so chunk label / score band / raw score don't feel cramped on a small screen

### Verified

Full flow re-tested at mobile width after the adjustments — upload, analyze, chunk progress, report (including per-chunk section), error banner, and both dialogs all confirmed looking correct with no reported overflow or cramped elements.

---

## Not done yet / carried forward

- REQ-ANALYSIS-4 remains only half-solved: browser-side cancellation works, backend-side cancellation (stopping FastAPI mid-computation) does not exist yet. Worth a note if this becomes a defense question later.
- Mobile pass was visual/manual only, not tested on an actual physical device — DevTools emulation only.
- The artificial minimum-delay logic from Day 8 (tuned for the mock model's near-instant speed) is still unaddressed and will need revisiting once the real model is wired in.