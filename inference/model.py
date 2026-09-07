"""
Model wrapper for the ADB (Awtomatikong pagDiskubre sa Bakak) detector.

This is currently a MOCK implementation so the rest of the platform
(gateway, frontend) can be built and tested without waiting on the
trained XLS-R + AASIST checkpoint.

HOW TO SWAP IN THE REAL MODEL LATER:
1. In ADBModel.__init__, load XLS-R (e.g. via
   transformers.Wav2Vec2Model.from_pretrained(...)) and your frozen
   AASIST checkpoint (e.g. torch.load(...)).
2. In ADBModel.predict, run the waveform through XLS-R to extract
   features, pass those through AASIST, and return (label, score)
   where label is "bonafide" or "spoofed" and score is a float in
   [0, 1] representing probability of being spoofed.
3. Nothing outside this file needs to change — main.py only calls
   model.predict(...) and expects (label: str, score: float) back.
"""

import hashlib


class ADBModel:
    def __init__(self):
        # TODO: replace with real model loading (XLS-R + AASIST checkpoint)
        # This runs ONCE at server startup, not per-request.
        self.loaded = True
        print("[model] Mock ADB model loaded. Replace model.py with the real checkpoint when ready.")

    def predict(self, audio_bytes: bytes, sample_rate: int = 16000) -> tuple[str, float]:
        """
        Mock inference. Deterministic per input — the same audio file
        always produces the same result, so the UI/report screens can
        be tested without results flickering randomly on every request.

        Returns:
            label: "bonafide" or "spoofed"
            score: float in [0, 1] -- probability of being SPOOFED
        """
        digest = hashlib.sha256(audio_bytes).hexdigest()
        pseudo_random = int(digest[:8], 16) / 0xFFFFFFFF  # -> float in [0, 1]

        score = round(pseudo_random, 4)
        label = "spoofed" if score >= 0.5 else "bonafide"
        return label, score


# Singleton -- loaded once at FastAPI startup, reused across all requests.
_model_instance: ADBModel | None = None


def get_model() -> ADBModel:
    global _model_instance
    if _model_instance is None:
        _model_instance = ADBModel()
    return _model_instance