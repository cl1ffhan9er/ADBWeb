r"""
Checks ADBWeb's inference against the scores DeepFense saved for the clean test set.
A = model only (expect < 1e-4), B = full upload pipeline (expect the same verdicts).
Run in the training venv with MODEL_DIR or HF_MODEL_REPO set:

    python verify_scores.py --manifest ...\manifests\splits_vc\test.parquet --predictions ...\results\predictions\clean_predictions.txt --root ...\ceb-deepfake-detect --n 20
"""

import argparse
import random
from pathlib import Path

import numpy as np
import pandas as pd
import soundfile as sf
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from audio_utils import SEGMENT_SAMPLES, decode_audio, preprocess, repeat_pad, split_into_segments  # noqa: E402
from model import get_model  # noqa: E402


def load_predictions(path):
    df = pd.read_csv(path, dtype={"ID_audio": str})
    df["raw"] = df["score_class1"] - df["score_class0"]
    return df.set_index("ID_audio")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--manifest", required=True, type=Path)
    ap.add_argument("--predictions", required=True, type=Path)
    ap.add_argument("--root", type=Path, default=Path("."), help="base for relative paths in the manifest")
    ap.add_argument("--n", type=int, default=20, help="clips per class")
    ap.add_argument("--seed", type=int, default=0)
    args = ap.parse_args()

    preds = load_predictions(args.predictions)
    manifest = pd.read_parquet(args.manifest)
    manifest = manifest[manifest["ID"].isin(preds.index)].copy()
    manifest["y"] = preds.loc[manifest["ID"], "label"].to_numpy()

    rng = random.Random(args.seed)
    model = get_model()
    rows = []

    for label in (1, 0):
        pool = manifest[manifest["y"] == label].sample(frac=1.0, random_state=args.seed)
        picked = 0
        for _, row in pool.iterrows():
            path = Path(row["path"])
            path = path if path.is_absolute() else args.root / path
            if not path.exists() or sf.info(str(path)).frames > SEGMENT_SAMPLES:
                continue

            x, _ = sf.read(str(path), always_2d=False)
            model_raw = float(model.score(repeat_pad(np.asarray(x, dtype=np.float32))[None, :])[0])

            audio, sr = decode_audio(path.read_bytes())
            segs = split_into_segments(preprocess(audio, sr))
            pipe_raw = float(np.mean(model.score(np.stack([s["audio"] for s in segs]))))

            rows.append((row["ID"], label, float(preds.loc[row["ID"], "raw"]), model_raw, pipe_raw))
            picked += 1
            if picked >= args.n:
                break

    if not rows:
        raise SystemExit("No clips found: check --root and that the manifest paths exist.")

    rng.shuffle(rows)
    t = model.threshold
    print(f"{'ID':<28}{'label':>6}{'saved':>12}{'A: model':>12}{'B: web':>12}")
    for id_, label, saved, a, b in rows:
        print(f"{id_:<28}{label:>6}{saved:>12.6f}{a:>12.6f}{b:>12.6f}")

    saved = np.array([r[2] for r in rows])
    a = np.array([r[3] for r in rows])
    b = np.array([r[4] for r in rows])
    print()
    print(f"clips checked                  : {len(rows)}")
    print(f"A  max |model - saved|         : {np.abs(a - saved).max():.2e}   (expect < 1e-4)")
    print(f"A  same verdict as saved       : {np.mean((a >= t) == (saved >= t)):.0%}")
    print(f"B  max |web pipeline - saved|  : {np.abs(b - saved).max():.2e}")
    print(f"B  same verdict as saved       : {np.mean((b >= t) == (saved >= t)):.0%}")


if __name__ == "__main__":
    main()
