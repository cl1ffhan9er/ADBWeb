# ADBWeb — Day 7 Log

**Goal for the day:** Replace the raw JSON dump from Day 6 with the real Detection Report screen — classification label, authenticity score, audio metadata, and the "What is Authenticity Score" explainer dialog (Fig 3.1.7, 3.1.8, 3.1.10).

**Status:** ✅ Complete

---

## Decision made: authenticity score bands

The SRS (Fig 3.1.10) references a scale "ranging from Highly Likely Fake to Highly Likely Real" but never defines the actual score thresholds — this had been an open item since early planning. Resolved today: **5-band scale**, directly matching the SRS's own wording.

| Score range | Label |
|---|---|
| 0.0 – 0.2 | Highly Likely Real |
| 0.2 – 0.4 | Likely Real |
| 0.4 – 0.6 | Uncertain |
| 0.6 – 0.8 | Likely Fake |
| 0.8 – 1.0 | Highly Likely Fake |

## What was built

### `lib/scoreBands.ts` (new)

`getScoreBand(score)` — a single function mapping a 0–1 score to its band label + a Tailwind color class. Kept separate from any component so both the report screen and the explainer dialog reference the exact same boundaries — no risk of the two disagreeing on where a cutoff sits if one gets edited later.

### `components/ScoreExplainerDialog.tsx` (new)

Static popup (Fig 3.1.10) showing the full band table, triggered by a "What is Authenticity Score?" link on the report screen.

### `components/DetectionReport.tsx` (new)

The actual report screen (Fig 3.1.7 / 3.1.8):
- Colored band label at the top (color + text pulled from `getScoreBand`)
- Link opening the `ScoreExplainerDialog`
- Metadata list: authenticity score (4 decimal places), file name, duration
- "Back to Home" button that resets both `file` and `result` state in the parent, returning to the upload screen

### `app/page.tsx` (updated)

Swapped the Day 6 raw `<pre>` JSON block for `<DetectionReport>`, conditionally rendered only on a successful (non-error) result. Error results now show a plain red message instead of raw JSON.

---

## Verified

Ran a valid file through the full flow: upload → Analyze → spinner → report screen appears with a colored band matching the mock score, correct metadata (score, filename, duration), working "What is Authenticity Score?" dialog, and "Back to Home" correctly resetting the page to the empty upload state.

---

## Not done yet / carried forward

- `result` state is currently loosely typed (e.g. `any`) rather than a proper TypeScript interface matching the FastAPI response shape — flagged for tightening later, not urgent
- Per-chunk report view (Fig 3.1.9) not built yet — `DetectionReport` currently only shows the *overall* label/score, not individual chunk results, even though the backend already returns a `chunks` array
- Chunk progress bar (Fig 3.1.6) still not built — carried forward from Day 6
- No mobile-responsive pass yet on any of today's components