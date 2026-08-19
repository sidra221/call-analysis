import os
import json
import subprocess
import tempfile

import pandas as pd
import whisperx
from pyannote.audio import Pipeline

device = "cpu"
SAMPLE_RATE = 16000

print("Device:", device)


def _prepare_wav(src_path: str) -> str:
    """Convert any input to 16 kHz mono WAV and pad a little silence.

    MP3/M4A files are often a few milliseconds short of a round chunk
    (e.g. 439895 vs 441000 samples). pyannote then raises and the
    whole analysis fails after ASR already succeeded.
    """
    fd, dst = tempfile.mkstemp(suffix=".wav", prefix="vocalys_")
    os.close(fd)
    cmd = [
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-i", src_path,
        "-ac", "1",
        "-ar", str(SAMPLE_RATE),
        "-c:a", "pcm_s16le",
        "-af", "apad=pad_dur=0.3",
        dst,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0 or not os.path.exists(dst) or os.path.getsize(dst) == 0:
        if os.path.exists(dst):
            os.remove(dst)
        raise RuntimeError(result.stderr.strip() or "ffmpeg failed to convert audio")
    return dst


def _annotation_from_diarization(diarization):
    if hasattr(diarization, "speaker_diarization"):
        return diarization.speaker_diarization
    return diarization


def transcribe_audio(audio_file):
    if not os.path.exists(audio_file):
        raise FileNotFoundError(f"Audio file not found: {audio_file}")

    print(f"Processing file: {audio_file}")
    print("Normalizing audio to 16 kHz WAV...")
    prepared = _prepare_wav(audio_file)
    print(f"Prepared WAV: {prepared}")

    try:
        print("Loading WhisperX model (CPU)...")
        model = whisperx.load_model(
            "small",
            device,
            compute_type="float32"
        )

        print("Transcribing...")
        asr_result = model.transcribe(prepared)
        print("ASR Done.")

        duration = 0
        if asr_result.get("segments"):
            duration = asr_result["segments"][-1]["end"]

        print("Loading alignment model...")
        model_a, metadata = whisperx.load_align_model(
            language_code=asr_result["language"],
            device=device
        )

        print("Aligning words...")
        aligned_result = whisperx.align(
            asr_result["segments"],
            model_a,
            metadata,
            prepared,
            device
        )

        print("\nRunning diarization (CPU)...")
        aligned_with_speakers = aligned_result
        try:
            token = os.getenv("HUGGINGFACE_TOKEN")
            pipeline = Pipeline.from_pretrained(
                "pyannote/speaker-diarization-3.1",
                token=token
            )
            diarization = pipeline(prepared)
            annotation = _annotation_from_diarization(diarization)

            segments_list = []
            for segment, _track, speaker in annotation.itertracks(yield_label=True):
                segments_list.append({
                    "start": segment.start,
                    "end": segment.end,
                    "speaker": speaker
                })

            if segments_list:
                print("Assigning speakers to words...")
                aligned_with_speakers = whisperx.assign_word_speakers(
                    pd.DataFrame(segments_list),
                    aligned_result
                )
        except Exception as exc:
            print(f"Diarization failed ({exc}); continuing without speaker labels")

        output = {
            "language": asr_result["language"],
            "segments": aligned_with_speakers.get("segments", aligned_result.get("segments", [])),
            "duration": duration
        }

        os.makedirs("outputs", exist_ok=True)
        base_name = os.path.splitext(os.path.basename(audio_file))[0]
        output_path = f"outputs/{base_name}.json"
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(output, f, ensure_ascii=False, indent=2)

        print(f"Saved → {output_path}")
        return output
    finally:
        if os.path.exists(prepared):
            os.remove(prepared)
