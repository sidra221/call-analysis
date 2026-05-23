import os
import json
import torch
import pandas as pd
import whisperx

from pyannote.audio import Pipeline

# -----------------------------
# الجهاز = CPU دائماً
# -----------------------------
device = "cpu"

print("Device:", device)


def transcribe_audio(audio_file):

    # -----------------------------
    # التحقق من الملف
    # -----------------------------
    if not os.path.exists(audio_file):
        raise FileNotFoundError(f"Audio file not found: {audio_file}")

    print(f"Processing file: {audio_file}")

    # -----------------------------
    # WhisperX ASR
    # -----------------------------
    print("Loading WhisperX model (CPU)...")

    model = whisperx.load_model(
        "small",
        device,
        compute_type="float32"
    )

    print("Transcribing...")

    asr_result = model.transcribe(audio_file)

    print("ASR Done.")

    # -----------------------------
    # مدة المكالمة
    # -----------------------------
    duration = 0

    if asr_result.get("segments"):
        duration = asr_result["segments"][-1]["end"]

    # -----------------------------
    # Alignment
    # -----------------------------
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
        audio_file,
        device
    )

    # -----------------------------
    # Diarization
    # -----------------------------
    print("\nRunning diarization (CPU)...")

    token = os.getenv("HUGGINGFACE_TOKEN")

    pipeline = Pipeline.from_pretrained(
        "pyannote/speaker-diarization-3.1",
        token=token
    )

    diarization = pipeline(audio_file)

    # -----------------------------
    # مهم جداً:
    # الإصدار الجديد يرجع speaker_diarization
    # -----------------------------
    annotation = diarization.speaker_diarization

    # -----------------------------
    # تحويل diarization إلى DataFrame
    # -----------------------------
    segments_list = []

    for segment, track, speaker in annotation.itertracks(yield_label=True):

        segments_list.append({
            "start": segment.start,
            "end": segment.end,
            "speaker": speaker
        })

    diar_df = pd.DataFrame(segments_list)

    # -----------------------------
    # دمج المتحدثين مع الكلمات
    # -----------------------------
    print("Assigning speakers to words...")

    aligned_with_speakers = whisperx.assign_word_speakers(
        diar_df,
        aligned_result
    )

    # -----------------------------
    # النتيجة النهائية
    # -----------------------------
    output = {
        "language": asr_result["language"],
        "segments": aligned_with_speakers["segments"],
        "duration": duration
    }

    # -----------------------------
    # حفظ JSON
    # -----------------------------
    os.makedirs("outputs", exist_ok=True)

    base_name = os.path.splitext(
        os.path.basename(audio_file)
    )[0]

    output_path = f"outputs/{base_name}.json"

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"Saved → {output_path}")

    return output