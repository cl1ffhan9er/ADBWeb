# ADBWeb — Day 5 Log

**Goal for the day:** Build the real upload screen UI — drag-and-drop, uploaded-file state, and error states — matching Figures 3.1.1 through 3.1.3 in the SRS, replacing the throwaway `<input>` test harness from Day 4.

**Status:** ✅ Complete

---

## What was built

### `components/UploadZone.tsx` (new)

A single component that renders three different views depending on its internal state — no separate components needed for each, since only one is ever visible at a time:

- **Empty / drop-zone state (Fig 3.1.1)** — dashed border box. Accepts both drag-and-drop and click-to-browse through the same underlying hidden `<input type="file">`; clicking anywhere in the box programmatically triggers that input.
- **Uploaded state (Fig 3.1.2)** — once a file passes validation, swaps to a box showing the filename and a human-readable file size (converted from raw bytes to KB/MB), plus a "Clear" button.
- **Error state (Fig 3.1.3)** — if validation fails, shows the exact SRS-specified error message in a red box with a "Try again" link back to the empty state.

All three states funnel through one `handleFile()` function, which calls Day 4's `validateAudioFile()` and branches based on the result — so drag-drop and click-to-browse can't get out of sync with each other or with validation.

### `app/page.tsx` (updated)

Wired `UploadZone` in, tracking the currently selected file in state. The "Analyze Audio" button is disabled whenever no valid file is selected, matching the SRS's Fig 3.1.1 spec ("initially disabled Analyze Audio button") — it doesn't yet do anything when clicked (that's Day 6).

---

## Verified

Manually tested all four core interactions in the browser:

1. **Drag-and-drop a valid file** → switches to filename/size view, Analyze button becomes enabled
2. **Click-to-browse a valid file** → same result via the file picker dialog
3. **Click "Clear"** → resets back to the empty drop-zone, Analyze button disables again
4. **Upload an invalid file** (wrong type / too big / bad duration) → shows the correct red error message with a working "Try again" link

All four passed.

---

## Not done yet / carried forward

- The "Analyze Audio" button currently does nothing on click — no connection to `/api/analyze` yet (Day 6)
- Help dialog (Fig 3.1.4) not built yet
- Loading spinner state (Fig 3.1.5) not built yet
- No mobile-responsive pass done yet on this component (later in the plan)