# ADBWeb — Day 2 Log

**Goal for the day:** Replace the Day 1 shortcut (raw audio bytes sent straight to the mock model) with real audio processing — standardize uploads to 16kHz mono WAV, and chunk anything over 10 seconds, per REQ-INFER-1 and the SRS's fixed 10s model input.

**Status:** ✅ Complete

---

## What was built

### `audio_utils.py` (new)

Three functions, each doing one job:

- **`standardize_audio(audio_bytes)`** — pipes raw uploaded audio (any format, sample rate, channel count) through `ffmpeg` and returns 16kHz mono WAV bytes. Runs entirely in memory via stdin/stdout pipes — no disk writes.
- **`get_duration_seconds(audio_bytes)`** — checks how long the clip is, needed to decide whether/how to chunk, and eventually to validate against REQ-UPLOAD-7 (3–60s range).
- **`split_into_chunks(standardized_wav_bytes, duration)`** — cuts audio into fixed 10-second segments. If the final segment is shorter than 10s (e.g. a 25s file → two full chunks + one 5s chunk), it's padded with silence so every chunk fed to the model is the same length.

### `main.py` (updated)

`/infer` now runs the real pipeline instead of the Day 1 shortcut:
upload → check duration → standardize → split into chunks → run each chunk through the (still mock) model → aggregate into an overall label/score.

Response shape also changed to carry per-chunk detail, which the frontend's chunk-by-chunk report screen (Fig 3.1.9) will need later:
```json
{
  "filename": "...",
  "duration_seconds": 3.68,
  "overall_label": "bonafide",
  "overall_score": 0.313,
  "chunks": [
    {"chunk_index": 0, "label": "bonafide", "score": 0.313}
  ]
}
```

---

## Bug hit + why the fix was necessary

**Symptom:** Internal Server Error on every request, with this in the server logs:
```
FileNotFoundError: [WinError 206] The filename or extension is too long
```

**Root cause:** The first version of `get_duration_seconds()` tried to pipe audio bytes directly into `ffmpeg.probe()` using `ffmpeg.probe("pipe:0", input=audio_bytes)` — copying the pattern used in `standardize_audio()`, where piping bytes via `.run(input=...)` works fine.

The problem: `.probe()` and `.run()` don't behave the same way under the hood. `.run()` genuinely streams bytes through stdin. `.probe()` does not support that — instead, `ffmpeg-python` tried to pass `audio_bytes` along as if it were a **command-line argument**. In practice, that meant the entire raw contents of the audio file got shoved into the Windows command line as text. Windows has a hard length limit on command-line invocations, far shorter than any real audio file's byte count — hence "filename or extension is too long," which is really Windows saying "this command line is absurdly, impossibly long."

**Fix:** Write the incoming bytes to a temporary file, call `ffmpeg.probe()` on that file's actual path (which it does support), then immediately delete the temp file in a `finally` block so it's removed whether or not probing succeeds.

```python
import tempfile
import os

def get_duration_seconds(audio_bytes: bytes) -> float:
    with tempfile.NamedTemporaryFile(suffix=".tmp", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        probe = ffmpeg.probe(tmp_path)
        return float(probe["format"]["duration"])
    finally:
        os.remove(tmp_path)
```

**Why this fix also fits the SRS, not just the bug:** using a `finally` block guarantees the temp file is deleted even if `ffmpeg.probe()` throws an error partway through — which matters for the Data Privacy Act / data minimization requirement (Section 2.5, 5.3): nothing from a user's uploaded audio should linger on disk, including in failure cases, not just the happy path.

---

## Other issues hit along the way (environment, not code)

- **`uvicorn main:app` failed with "Could not import module main"** — caused by running the command from the wrong directory. Fixed by confirming `pwd` showed `inference/` before running the server.
- **`curl: (26) Failed to open/read local data from file`** (twice) — caused by Windows' "hide extensions for known file types" setting silently saving `test.wav` as `test.wav.wav`. Confirmed the real filename with `ls`, then pointed curl at the correct double-extension name. Worth fixing at the OS level eventually (or just being aware of it) before REQ-UPLOAD-6 file-type validation is built, since a mismatched extension could cause confusing validation bugs later.

---

## Verified

Restarted the server with `uvicorn main:app --reload`, re-ran the request against a real 3.68 second WAV file:

```json
{"filename":"test.wav","duration_seconds":3.68,"overall_label":"bonafide","overall_score":0.313,"chunks":[{"chunk_index":0,"label":"bonafide","score":0.313}]}
```

Duration detected correctly, single chunk returned as expected (under the 10s threshold).

---

## Not done yet / carried forward

- **Multi-chunk case untested** — haven't yet run a file longer than 10 seconds through the pipeline to confirm the `chunks` array actually returns multiple entries. Worth doing before building the frontend's chunk progress bar (Fig 3.1.6) against this response shape.
- Duration/format validation (REQ-UPLOAD-5, 6, 7) still not enforced — `/infer` will currently attempt to process anything, valid or not.