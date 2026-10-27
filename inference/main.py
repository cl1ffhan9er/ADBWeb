from pathlib import Path

import numpy as np
from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile

load_dotenv(Path(__file__).resolve().parent / ".env")
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from audio_utils import TARGET_SR, decode_audio, preprocess, split_into_segments  # noqa: E402
from model import get_model  # noqa: E402
from scoring import ScoreScale  # noqa: E402

app = FastAPI(title="ADBWeb Inference Service")
_scale: ScoreScale | None = None


@app.on_event("startup")
def load_model():
    global _scale
    model = get_model()
    _scale = ScoreScale(model.threshold, model.meta.get("display_anchors"))


@app.get("/")
def health_check():
    return {"status": "ADBWeb inference service is running"}


@app.post("/infer")
def infer(file: UploadFile = File(...)):
    raw_bytes = file.file.read()

    try:
        audio, sr = decode_audio(raw_bytes)
        duration = len(audio) / sr
        clean = preprocess(audio, sr)
        segments = split_into_segments(clean)
    except ValueError as e:
        return {"error": str(e)}

    model = get_model()
    raw_scores = model.score(np.stack([s["audio"] for s in segments]))

    chunks = []
    for i, (seg, raw) in enumerate(zip(segments, raw_scores)):
        display = _scale.to_display(float(raw))
        chunks.append(
            {
                "chunk_index": i,
                "start_s": seg["start_s"],
                "end_s": seg["end_s"],
                "raw_score": round(float(raw), 6),
                "score": round(display, 4),
                "label": "bonafide" if _scale.is_bonafide(float(raw)) else "spoof",
                "band": _scale.band(display),
            }
        )

    overall_raw = float(np.mean(raw_scores))
    overall_display = _scale.to_display(overall_raw)

    return {
        "filename": file.filename,
        "duration_seconds": round(duration, 2),
        "analyzed_seconds": round(len(clean) / TARGET_SR, 2),
        "overall_label": "bonafide" if _scale.is_bonafide(overall_raw) else "spoof",
        "overall_score": round(overall_display, 4),
        "overall_raw_score": round(overall_raw, 6),
        "overall_band": _scale.band(overall_display),
        "threshold": model.threshold,
        "chunks": chunks,
    }
