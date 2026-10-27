import io
import os
import tempfile
from fractions import Fraction

import ffmpeg
import numpy as np
import soundfile as sf

TARGET_SR = 16000
SEGMENT_SAMPLES = 64600

FRAME_LEN = 400
FRAME_HOP = 160
TRIM_TOP_DB = 40.0
TRIM_MARGIN_S = 0.05
PEAK_TARGET = 1.0


def decode_audio(audio_bytes: bytes) -> tuple[np.ndarray, int]:
    fd, tmp_path = tempfile.mkstemp(suffix=".upload")
    try:
        with os.fdopen(fd, "wb") as fh:
            fh.write(audio_bytes)

        try:
            probe = ffmpeg.probe(tmp_path)
            audio_streams = [s for s in probe["streams"] if s.get("codec_type") == "audio"]
            if not audio_streams:
                raise ValueError("The file contains no audio stream.")
            sr = int(audio_streams[0]["sample_rate"])
            channels = int(audio_streams[0]["channels"])

            out, _ = (
                ffmpeg.input(tmp_path)
                .output("pipe:1", format="f32le", acodec="pcm_f32le")
                .run(capture_stdout=True, capture_stderr=True)
            )
        except ffmpeg.Error as e:
            print(f"[audio] ffmpeg failed: {e.stderr.decode(errors='ignore')[-500:]}")
            raise ValueError("Could not read the audio file. It may be corrupted or in an unsupported format.")
    finally:
        os.remove(tmp_path)

    x = np.frombuffer(out, dtype=np.float32)
    if channels > 1:
        x = x[: len(x) - len(x) % channels].reshape(-1, channels).mean(axis=1)

    if x.size == 0:
        raise ValueError("The file contains no audio samples.")

    return x.astype(np.float32), sr


def resample(x, sr_in, sr_out=TARGET_SR):
    if sr_in == sr_out:
        return x

    from scipy.signal import resample_poly

    ratio = Fraction(sr_out, sr_in).limit_denominator(1000)

    return resample_poly(x, ratio.numerator, ratio.denominator)


def frame_rms(x):
    if len(x) < FRAME_LEN:
        return np.array([np.sqrt(np.mean(x**2) + 1e-20)])

    n = 1 + (len(x) - FRAME_LEN) // FRAME_HOP
    idx = np.arange(FRAME_LEN)[None, :] + FRAME_HOP * np.arange(n)[:, None]

    return np.sqrt(np.mean(x[idx] ** 2, axis=1) + 1e-20)


def trim_silence(x, top_db=40.0, margin_s=0.05):
    if len(x) < FRAME_LEN:
        return x

    frames = frame_rms(x)
    peak = float(frames.max())

    if peak <= 0:
        return x

    keep = np.flatnonzero(frames >= peak * (10.0 ** (-top_db / 20.0)))

    if keep.size == 0:
        return x

    margin = int(margin_s * TARGET_SR)
    start = max(0, keep[0] * FRAME_HOP - margin)
    end = min(len(x), keep[-1] * FRAME_HOP + FRAME_LEN + margin)

    return x[start:end]


def normalise_level(x, peak_target):
    peak_in = float(np.abs(x).max()) if x.size else 0.0

    if peak_in <= 0:
        return x.astype(np.float32), 0.0

    gain_db = 20.0 * np.log10(peak_target / peak_in)
    y = (x * (peak_target / peak_in)).astype(np.float32)

    return y, float(gain_db)


def _pcm16_roundtrip(x: np.ndarray) -> np.ndarray:
    buf = io.BytesIO()
    sf.write(buf, x, TARGET_SR, subtype="PCM_16", format="WAV")
    buf.seek(0)
    y, _ = sf.read(buf, always_2d=False)

    return np.asarray(y, dtype=np.float32)


def preprocess(x: np.ndarray, sr: int) -> np.ndarray:
    x = resample(np.asarray(x, dtype=np.float64), sr).astype(np.float32)
    x = trim_silence(x, TRIM_TOP_DB, TRIM_MARGIN_S)

    if len(x) < FRAME_LEN or not np.any(x):
        raise ValueError("The audio is silent or too short after trimming silence.")

    x, _ = normalise_level(x, PEAK_TARGET)

    return _pcm16_roundtrip(x)


def repeat_pad(x: np.ndarray, length: int = SEGMENT_SAMPLES) -> np.ndarray:
    if len(x) >= length:
        return x[:length]

    repeats = int(np.ceil(length / len(x)))

    return np.tile(x, repeats)[:length]


def split_into_segments(x: np.ndarray) -> list[dict]:
    if len(x) <= SEGMENT_SAMPLES:
        starts = [0]
    else:
        starts = list(range(0, len(x) - SEGMENT_SAMPLES + 1, SEGMENT_SAMPLES))
        if starts[-1] + SEGMENT_SAMPLES < len(x):
            starts.append(len(x) - SEGMENT_SAMPLES)

    return [
        {
            "start_s": round(start / TARGET_SR, 2),
            "end_s": round(min(start + SEGMENT_SAMPLES, len(x)) / TARGET_SR, 2),
            "audio": repeat_pad(x[start : start + SEGMENT_SAMPLES]),
        }
        for start in starts
    ]
