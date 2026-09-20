from fastapi import FastAPI, UploadFile, File
from model import get_model
from audio_utils import standardize_audio, get_duration_seconds, split_into_chunks

app = FastAPI(title="ADBWeb Inference Service")

# Load the model once, when the server starts (not on every request)
@app.on_event("startup")
def load_model():
    get_model()

@app.get("/")
def health_check():
    return {"status": "ADBWeb inference service is running"}

@app.post("/infer")
async def infer(file: UploadFile = File(...)):
    raw_bytes = await file.read()

    try:
        duration = get_duration_seconds(raw_bytes)
        standardized = standardize_audio(raw_bytes)
        chunks = split_into_chunks(standardized, duration)
    except ValueError as e:
        return {"error": str(e)}

    model = get_model()
    chunk_results = []
    for i, chunk in enumerate(chunks):
        label, score = model.predict(chunk)
        chunk_results.append({"chunk_index": i, "label": label, "score": score})

    # Simple aggregate: average score across chunks, majority-vote-ish via threshold
    avg_score = sum(c["score"] for c in chunk_results) / len(chunk_results)
    overall_label = "spoofed" if avg_score >= 0.5 else "bonafide"

    return {
        "filename": file.filename,
        "duration_seconds": round(duration, 2),
        "overall_label": overall_label,
        "overall_score": round(avg_score, 4),
        "chunks": chunk_results,
    }