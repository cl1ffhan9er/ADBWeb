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
- **Inference service (FastAPI, Python):** Loads the frozen model once at startup, standardizes incoming audio (16kHz mono WAV via `ffmpeg-python`), chunks anything over 10s, and runs it through XLS-R → AASIST.

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
- Chunked analysis + progress bar for audio over 10 seconds
- Detection report: Real/Fake classification, authenticity score, audio metadata
- No accounts, no persistence, single-session stateless interactions
- English, Tagalog, and Cebuano UI language support (planned)

## Getting Started

```bash
# Frontend + Gateway
npm install
npm run dev

# Inference service (separate terminal)
cd inference
pip install -r requirements.txt
uvicorn main:app --reload
```

## Requirements Traceability

Full functional and non-functional requirements are documented in the project's SRS (`docs/SRS.md` or equivalent). Key constraints:

- **Data Privacy Act of 2012 compliance** — audio processed transiently, never persisted
- **Frozen model** — parameters fixed post-training, no runtime updates
- **Stateless design** — no database, no user accounts

## License

TBD.