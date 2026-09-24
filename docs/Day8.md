# ADBWeb — Day 8 Log

**Goal for the day:** Add the chunk-by-chunk progress bar (Fig 3.1.6) and per-chunk report view (Fig 3.1.9) for audio files longer than 10 seconds.

**Status:** ✅ Complete

---

## Important caveat, documented upfront

The SRS's chunk progress bar implies real-time, per-chunk completion updates from the server. The current backend doesn't support that — `/infer` processes every chunk and returns one single, complete response at the end; it never tells the frontend "chunk 2 of 5 just finished." Real per-chunk streaming would need a different backend design (e.g. Server-Sent Events or WebSockets) — out of scope for today.

**What was built instead:** a *simulated* progress bar. Since the total chunk count is knowable upfront (from the audio's duration), the frontend ticks a counter up on a timer while the request is in flight, and reconciles with the real result once the response lands. Visually matches the SRS figure; not literally driven by real backend progress events. Logged clearly as a known simplification, not a bug — worth revisiting if real per-chunk streaming becomes a requirement later.

---

## What was built

### `lib/chunking.ts` (new)
`getExpectedChunkCount(durationSeconds)` — mirrors the `CHUNK_DURATION_SECONDS = 10` constant already used in the backend's `audio_utils.py`, so the frontend can calculate the same expected chunk count the backend will produce. Kept in sync manually for now, since frontend and backend are separate codebases with no shared constants file.

### `components/ChunkProgress.tsx` (new)
Replaces the plain spinner for multi-chunk files: shows "Analyzing chunk X of Y" plus an animated progress bar filling based on `currentChunk / totalChunks`.

### `components/DetectionReport.tsx` (updated)
Added a "Per-Chunk Results" section, rendered only when `result.chunks.length > 1` — lists each chunk's individual score band and raw score, reusing the same `getScoreBand()` logic from Day 7 so chunk-level and overall-level bands are guaranteed consistent.

### `app/page.tsx` (updated)
- Captures audio duration up front (via Day 4's `getAudioDuration`) as soon as a file is accepted, so the expected chunk count is known before the request is even sent
- Shows `ChunkProgress` instead of `LoadingSpinner` when `totalChunks > 1`
- Runs a `setInterval` to simulate progress ticking upward while waiting for the real response

---

## Bug hit + fix: progress bar skipped straight to "done"

**Symptom:** with a ~5-chunk file, the UI showed chunk 1, then jumped straight to the finished report — no visible chunk 2, 3, 4, 5 progression.

**Root cause:** the mock model is near-instant (just hashes the audio bytes, no real computation), and chunking a short test file via ffmpeg is fast too — so the real backend response was consistently arriving in well under a second. The progress-tick interval (originally every 900ms) simply didn't get enough ticks to fire before the real result already came back. Not a bug in the progress logic itself — the simulation was working correctly, it just never got time to visibly animate because the "work" it was simulating wasn't actually taking any real time yet.

**Fix:**
1. Reduced tick interval from 900ms → 400ms (more responsive-feeling regardless)
2. Added a minimum display duration (`totalChunks * 400ms`) — if the real response comes back faster than that, the code now artificially waits out the remaining difference before showing the result, so the animation always gets to visibly complete all its steps

**Noted for later:** this minimum-delay trick is purely cosmetic pacing to compensate for the *mock* model's unrealistic speed. Once the real XLS-R + AASIST model is wired in, actual per-chunk inference will likely take real, non-trivial time on its own — at that point this artificial delay should be revisited (and possibly removed entirely, since deliberately slowing down an already-real wait time would be counterproductive).

---

## Verified

- Short file (<10s): unchanged from Day 7 — plain spinner, single-band report, no chunk list shown
- Long file (~5 chunks): progress bar now visibly counts through all 5 steps before the report appears, and the report correctly shows a "Per-Chunk Results" section with 5 individual entries

---

## Not done yet / carried forward

- Progress bar remains simulated, not driven by real backend events — flagged as a design compromise, not a defect, but worth revisiting if a panel/adviser specifically expects real-time per-chunk updates
- The artificial minimum-delay logic will need re-evaluation once the real model (with real, non-instant inference time) replaces the mock
- Error-state UI still just plain red text, not a styled error screen (carried from Day 6)
- REQ-ANALYSIS-4 (abort inference on tab close) still not implemented
- No mobile-responsive pass yet on `ChunkProgress` or the per-chunk report section