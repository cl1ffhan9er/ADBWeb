# ADBWeb

A web-deployed audio deepfake detector for Cebuano speech. Users upload a `.wav` or `.mp3` clip and get back a classification — **Real** or **Fake** — along with an authenticity score, powered by a frozen XLS-R + AASIST model.

Built as part of the study *Audio Deepfake Detection for Cebuano Speech Under Real-World Channel Conditions*.

## Status

🚧 In active development. Model training/tuning is handled in a separate pipeline — this repo covers the web platform only (upload → standardize → infer → display result).

## Architecture

Two-service system in one repo:

```
adbweb/
├── (Next.js app)      # Frontend + Application Gateway
│   ├── app/           # Pages: upload, loading, report screens
│   ├── app/api/       # Route handlers — receives uploads, forwards to FastAPI
│   ├── components/
│   └── lib/           # Validation, helpers
└── inference/         # FastAPI service (separate process)
    └── ...            # Model loading, ffmpeg standardization, XLS-R + AASIST inference
```

- **Frontend + Gateway (Next.js, App Router):** Handles the UI and the upload/validation/forwarding logic in one Node process. Originally spec'd as a separate Express server in the SRS; consolidated into Next.js API routes for simplicity — functionally equivalent, no impact on functional requirements.
- **Inference service (FastAPI, Python):** Loads the trained model (the paper's Opus + AMR-NB "Both" configuration) once at startup, applies the same preprocessing as training (mono, 16 kHz, silence trimming at −40 dB, peak normalisation), splits the audio into ~4 s segments (64,600 samples, the model's input length), and scores each with XLS-R → AASIST. The file-level verdict is the mean segment score compared against the threshold calibrated on the validation set. See `inference/audio_utils.py`, `inference/scoring.py`.

Communication between the two is internal HTTP (localhost only, not exposed externally). Nothing is persisted — no database, no disk writes — audio and results are discarded from memory after each request.

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend / Gateway | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| Inference | FastAPI, PyTorch, HuggingFace Transformers, ffmpeg-python |
| Model | XLS-R (feature extraction) → AASIST (classification) |
| Hosting | DCISM web server (Linux) |

## Core Features

- Drag-and-drop or browse-to-upload audio (`.wav`, `.mp3`; 3–60s; max 10MB)
- Client-side validation with clear error messaging
- Automatic audio standardization (16kHz, mono, WAV)
- Segment-level analysis (~4 s segments) + progress bar
- Detection report: Real/Fake classification, authenticity score, audio metadata
- No accounts, no persistence, single-session stateless interactions
- English, Tagalog, and Cebuano UI language support (planned)

## Getting Started

Prerequisites: Node.js 20+, Python 3.11–3.13 (PyTorch 2.8, which DeepFense requires, has no Python 3.14 build), and `ffmpeg` on the PATH.

Create `.env.local` in the project root (git-ignored) so the gateway can reach the inference service:

```
FASTAPI_URL=http://127.0.0.1:8000
```

```bash
# Frontend + Gateway
npm install
npm run dev

# Inference service (separate terminal)
cd inference
pip install -r requirements.txt
uvicorn main:app
```

Wait for `Application startup complete` before uploading; loading the model takes a while.

### Model weights

The trained weights (~1.2 GB) are not in this repo. Put these in `inference/.env` (git-ignored):

```
HF_MODEL_REPO=<user>/ceb-deepfake-detect   # private Hugging Face model repo
HF_TOKEN=hf_...                            # READ-ONLY token for that repo
# MODEL_DIR=C:\path\to\adb-both        # optional: use a local copy instead
```

The first start downloads the weights (and the pretrained XLS-R base) and caches them. The repo holds `model.pth`, `config.yaml` and `model_meta.json`, produced by `training/helpers/export_inference_weights.py` in the training repo.

### Checking it matches the paper

`inference/verify_scores.py` runs test-set clips through this service's code and compares the scores with the ones DeepFense saved during evaluation (instructions at the top of the file). Run it after any change to the model or preprocessing.

## Requirements Traceability

Full functional and non-functional requirements are documented in the project's SRS (`docs/SRS.md` or equivalent). Key constraints:

- **Data Privacy Act of 2012 compliance** — audio processed transiently, never persisted
- **Frozen model** — parameters fixed post-training, no runtime updates
- **Stateless design** — no database, no user accounts

## License

TBD.