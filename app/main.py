import os
import logging
from fastapi import FastAPI, UploadFile, File, HTTPException

from app.transcriber import transcribe_audio
from app.nlp_analyzer import analyze_call_nlp
from app.report.router import router as report_router

# ─────────────────────────────────────────
# Logging
# ─────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
log = logging.getLogger("ai_service")

# ─────────────────────────────────────────
# App
# ─────────────────────────────────────────
app = FastAPI(
    title="Call Analysis AI Service",
    description="Transcribes audio calls and analyzes them using NLP. Also generates reports using OpenAI.",
    version="2.0.0"
)

# ─────────────────────────────────────────
# Include Routers
# ─────────────────────────────────────────

# Report generation router — POST /generate-report
app.include_router(report_router)


# ─────────────────────────────────────────
# Health Check
# ─────────────────────────────────────────
@app.get("/")
def root():
    """Health check endpoint."""
    return {"message": "AI Service Running", "status": "ok", "version": "2.0.0"}


# ─────────────────────────────────────────
# Call Analysis Endpoint
# ─────────────────────────────────────────
@app.post("/analyze-call")
async def analyze_call(file: UploadFile = File(...)):
    """
    Main analysis endpoint.

    Accepts an audio file, transcribes it using WhisperX,
    analyzes the transcript using the NLP pipeline,
    and returns a Backend-compatible response.

    Response shape (matches Backend ai_client.py expectations):
    {
        "transcription": { ...whisper output... },
        "analysis": {
            "main_issue":        str,
            "sentiment":         "positive" | "neutral" | "negative",
            "sentiment_score":   float,
            "keywords":          list[str],
            "priority":          "low" | "medium" | "high" | "critical",
            "needs_followup":    bool,
            "transcript":        str,
            "confidence_score":  float,
            "detected_language": str
        }
    }
    """
    temp_path = f"temp_{file.filename}"

    try:
        log.info(f"[RECEIVED] File: {file.filename}")

        with open(temp_path, "wb") as f:
            f.write(await file.read())

        # Step 1: Transcribe audio using WhisperX
        log.info("[STEP 1] Transcribing audio...")
        transcription = transcribe_audio(temp_path)

        # Step 2: Analyze transcript using NLP pipeline
        log.info("[STEP 2] Running NLP analysis...")
        analysis = analyze_call_nlp(transcription)

        # Step 3: Remove internal metadata before sending to Backend
        analysis.pop("_meta", None)

        log.info(f"[DONE] Analysis complete for: {file.filename}")

        return {
            "transcription": transcription,
            "analysis": analysis
        }

    except Exception as e:
        log.error(f"[ERROR] Analysis failed for {file.filename}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        # Always clean up the temporary file
        if os.path.exists(temp_path):
            os.remove(temp_path)
            log.info(f"[CLEANUP] Removed temp file: {temp_path}")