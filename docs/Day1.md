# ADBWeb — Day 1 Log

**Goal for the day:** Stand up a minimal FastAPI inference service with a mock model, and confirm the full request/response loop works end-to-end (`curl` a WAV file → get back `{label, score}`).

**Status:** ✅ Complete

---

## What was set up

### Environment
- Created `inference/` as a separate Python project inside the `adbweb` repo, alongside the existing Next.js frontend
- Set up a Python virtual environment (`venv/`) to keep dependencies isolated
- Installed and verified **`ffmpeg`** (the actual system program, not just the Python wrapper) via `winget install ffmpeg` — required a full terminal restart to pick up the updated PATH
- Installed Python packages: `fastapi`, `uvicorn`, `python-multipart`, `ffmpeg-python`
- Locked dependencies with `pip freeze > requirements.txt`
- Added `.gitignore` (`venv/`, `__pycache__/`) so the virtual environment never gets committed

### Code

**`model.py`** — mock model wrapper, standing in for the real XLS-R + AASIST model until training is finished.
- `ADBModel.predict(audio_bytes)` returns a deterministic `(label, score)` pair, derived by hashing the audio file's bytes (`hashlib.sha256`) — same file always produces the same result, so testing isn't thrown off by random flakiness
- `get_model()` — singleton loader, ensures the model only "loads" once rather than on every request (mirrors how the real model will be loaded once at startup, since model loading will be expensive)
- Documented directly in the file: swapping in the real model later only requires editing `model.py` — `main.py` and everything downstream stays unchanged

**`main.py`** — the FastAPI app itself.
- `GET /` — basic health check endpoint
- `POST /infer` — accepts a file upload, reads the raw bytes, passes them to `model.predict()`, returns JSON with `label`, `score`, and `filename`
- Model is loaded once via a startup event, not per-request

### Verification

Ran the server locally:
```bash
uvicorn main:app --reload
```

Tested the live endpoint with a real file:
```bash
curl -X POST "http://127.0.0.1:8000/infer" -F "file=@C:/path/to/test.wav"
```

Got back a real response:
```json
{"label":"bonafide","score":0.1898,"filename":"test.wav.wav"}
```

Confirms the full loop works: file upload → server receives it → mock model processes it → JSON response returned.

---

## Known issues / notes

- `/infer` currently accepts **raw, unprocessed audio bytes** — no ffmpeg standardization, no duration/format validation, no chunking yet. The mock model doesn't care what it receives, but the real model will require properly standardized input.

---

## Not done yet (Day 2)

1. Build out `audio_utils.py`: use `ffmpeg-python` to standardize any uploaded audio to 16kHz mono WAV
2. Add chunking logic for audio longer than 10 seconds (per the fixed model input duration)
3. Wire standardization into `main.py` so `/infer` processes audio *before* handing it to the model