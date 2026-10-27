"""Loads the trained XLS-R + AASIST detector (MODEL_DIR, or HF_MODEL_REPO + HF_TOKEN; see README)."""

import json
import os
from pathlib import Path

import numpy as np
import torch

MODEL_FILES = ["model.pth", "config.yaml", "model_meta.json"]
BATCH_SIZE = int(os.getenv("ADB_BATCH_SIZE", "4"))


def resolve_model_dir() -> Path:
    local = os.getenv("MODEL_DIR")
    if local:
        path = Path(local)
        missing = [f for f in MODEL_FILES if not (path / f).exists()]
        if missing:
            raise FileNotFoundError(f"MODEL_DIR={path} is missing {missing}")
        return path

    repo = os.getenv("HF_MODEL_REPO")
    if not repo:
        raise RuntimeError("Set MODEL_DIR or HF_MODEL_REPO (see inference/model.py).")

    from huggingface_hub import snapshot_download

    return Path(
        snapshot_download(
            repo_id=repo,
            token=os.getenv("HF_TOKEN"),
            allow_patterns=MODEL_FILES,
        )
    )


class ADBModel:
    def __init__(self):
        from omegaconf import OmegaConf

        import deepfense.models  # noqa: F401  registers DeepFense components
        from deepfense.utils.registry import build_detector

        model_dir = resolve_model_dir()
        self.meta = json.loads((model_dir / "model_meta.json").read_text(encoding="utf-8"))
        self.threshold = float(self.meta["threshold"])
        self.input_samples = int(self.meta.get("input_samples", 64600))

        cfg = OmegaConf.load(model_dir / "config.yaml")
        model_cfg = OmegaConf.to_container(cfg.model, resolve=True)
        model = build_detector(cfg.model.type, model_cfg)

        # trusted file; also accepts a full DeepFense checkpoint
        state = torch.load(model_dir / "model.pth", map_location="cpu", weights_only=False)
        if isinstance(state, dict) and isinstance(state.get("model_state"), dict):
            state = state["model_state"]
        model.load_state_dict(state)

        device = os.getenv("ADB_DEVICE") or ("cuda" if torch.cuda.is_available() else "cpu")
        self.device = torch.device(device)
        self.model = model.to(self.device).eval()

        print(
            f"[model] Loaded {self.meta.get('source_run', 'model')} from {model_dir} "
            f"on {self.device}; threshold {self.threshold:+.6f}"
        )

    @torch.inference_mode()
    def score(self, segments: np.ndarray) -> np.ndarray:
        if segments.ndim != 2 or segments.shape[1] != self.input_samples:
            raise ValueError(f"Expected (n, {self.input_samples}) segments, got {segments.shape}")

        out = []
        for i in range(0, len(segments), BATCH_SIZE):
            x = torch.as_tensor(segments[i : i + BATCH_SIZE], dtype=torch.float32, device=self.device)
            cos = self.model(x)["scores"].float().reshape(-1).cpu().numpy()
            out.append(2.0 * cos - 1.0)

        return np.concatenate(out)


_model_instance: ADBModel | None = None


def get_model() -> ADBModel:
    global _model_instance
    if _model_instance is None:
        _model_instance = ADBModel()
    return _model_instance
