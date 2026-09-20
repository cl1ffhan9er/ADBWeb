import ffmpeg
import io
import math
import tempfile
import os

TARGET_SAMPLE_RATE = 16000
CHUNK_DURATION_SECONDS = 10


def standardize_audio(audio_bytes: bytes) -> bytes:
    """
    Converts raw uploaded audio (any format/sample rate/channel count)
    into 16kHz, mono, WAV — the format the model expects.

    Takes raw bytes in, returns standardized WAV bytes out.
    Everything happens in memory — nothing is written to disk.
    """
    try:
        out, _ = (
            ffmpeg
            .input("pipe:0")
            .output(
                "pipe:1",
                format="wav",
                ac=1,                  # mono
                ar=TARGET_SAMPLE_RATE,  # 16kHz
            )
            .run(input=audio_bytes, capture_stdout=True, capture_stderr=True)
        )
        return out
    except ffmpeg.Error as e:
        # ffmpeg failed -- likely a corrupted or unsupported file
        raise ValueError(f"Audio standardization failed: {e.stderr.decode()}")


def get_duration_seconds(audio_bytes: bytes) -> float:
    """
    Uses ffprobe (bundled with ffmpeg) to check how long the audio is,
    without fully decoding it. Needed for chunking and for validating
    against REQ-UPLOAD-7 (3-60 second range).
    """
    with tempfile.NamedTemporaryFile(suffix=".tmp", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        probe = ffmpeg.probe(tmp_path)
        return float(probe["format"]["duration"])
    finally:
        os.remove(tmp_path)


def split_into_chunks(standardized_wav_bytes: bytes, duration: float) -> list[bytes]:
    """
    Splits standardized WAV audio into fixed 10-second chunks.
    The final chunk is padded with silence if it's shorter than 10s,
    since the model expects a fixed input duration.

    If the audio is already <= 10s, returns a single-item list
    (the whole thing, padded to 10s).
    """
    num_chunks = math.ceil(duration / CHUNK_DURATION_SECONDS)
    chunks = []

    for i in range(num_chunks):
        start_time = i * CHUNK_DURATION_SECONDS
        try:
            out, _ = (
                ffmpeg
                .input("pipe:0")
                .output(
                    "pipe:1",
                    format="wav",
                    ac=1,
                    ar=TARGET_SAMPLE_RATE,
                    ss=start_time,                                  # seek to chunk start
                    t=CHUNK_DURATION_SECONDS,                       # take 10 seconds
                    af=f"apad=whole_dur={CHUNK_DURATION_SECONDS}",  # pad with silence if short
                )
                .run(input=standardized_wav_bytes, capture_stdout=True, capture_stderr=True)
            )
            chunks.append(out)
        except ffmpeg.Error as e:
            raise ValueError(f"Chunking failed at chunk {i}: {e.stderr.decode()}")

    return chunks