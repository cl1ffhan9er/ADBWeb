# ADBWeb — Day 4 Log

**Goal for the day:** Add client-side validation so files get checked against the SRS's rules (file type, size, duration) in the browser, before ever being sent over the network — per REQ-UPLOAD-5, REQ-UPLOAD-6, REQ-UPLOAD-7.

**Status:** ✅ Complete

---

## What was built

### `lib/validation.ts` (new)

Four small functions plus one orchestrator:

- **`validateFileType(file)`** — checks the file's MIME type against an allowed list (`audio/wav`, `audio/x-wav`, `audio/mpeg`, `audio/mp3`). Synchronous, instant.
- **`validateFileSize(file)`** — checks `file.size` against a 10MB max (REQ-UPLOAD-5). Synchronous, instant.
- **`getAudioDuration(file)`** — loads the file into a hidden browser `Audio` element and waits for the `loadedmetadata` event to read its actual duration. Returns a `Promise` since the browser parses this asynchronously in the background. Uses `URL.createObjectURL` / `URL.revokeObjectURL` to avoid leaking memory from the temporary object URL.
- **`validateDuration(durationSeconds)`** — checks the duration against the 3–60 second range (REQ-UPLOAD-7).
- **`validateAudioFile(file)`** — the single function the UI will actually call. Runs the cheap synchronous checks (type, size) before the more expensive async duration check, and returns immediately on the first failure rather than running every check regardless.

Each failure returns the **exact error message text specified in the SRS** (Fig 3.1.3), so the UI layer can display it directly without reformatting.

---

## How it was tested

No real upload UI exists yet (that's Day 5), so a temporary plain `<input type="file">` was wired into `app/page.tsx` just to exercise the validation functions directly, logging the result to the browser DevTools console. This temporary input will be replaced by the real drag-and-drop upload UI tomorrow.

**Pass case** (valid short audio file):
```js
{valid: true}
```

**Fail case** (audio under 3 seconds):
```js
{valid: false, error: "Duration too short. Minimum duration: 3 seconds."}
```

Both confirm the pipeline works: file in → correct pass/fail result out, with SRS-matching error text on failure.

---

## Not done yet / carried forward

- Only the "duration too short" failure path was manually tested today. The other three failure paths (wrong file type, file too large, duration too long) share the same code paths and functions, so they're expected to behave identically, but haven't been individually confirmed by hand yet.
- The temporary `<input type="file">` in `app/page.tsx` is a throwaway test harness, not the real UI — needs to be replaced with the actual upload screen (Fig 3.1.1–3.1.3: drag-and-drop, uploaded-file state, error display) on Day 5.
- Validation currently only runs client-side. No server-side validation exists yet in `app/api/analyze/route.ts` — for now that route will forward literally anything sent to it. Server-side validation as a safety net (in case a request bypasses the browser UI entirely) isn't in scope yet.