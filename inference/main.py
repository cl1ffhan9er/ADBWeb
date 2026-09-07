from fastapi import FastAPI, UploadFile, File
from model import get_model

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
    audio_bytes = await file.read()

    model = get_model()
    label, score = model.predict(audio_bytes)

    return {
        "label": label,
        "score": score,
        "filename": file.filename,
    }