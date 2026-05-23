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
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s"
)

logger = logging.getLogger("ai_service")

# ─────────────────────────────────────────
# FastAPI App
# ─────────────────────────────────────────
app = FastAPI(
    title="Call Analysis AI Service",
    version="2.0.0"
)

# ─────────────────────────────────────────
# Routers
# ─────────────────────────────────────────
app.include_router(report_router)

# ─────────────────────────────────────────
# Health Check
# ─────────────────────────────────────────
@app.get("/")
def root():
    return {
        "message": "AI Service Running",
        "status": "ok"
    }

# ─────────────────────────────────────────
# Analyze Call Endpoint
# ─────────────────────────────────────────
@app.post("/analyze-call")
async def analyze_call(audio_file: UploadFile = File(...)):

    temp_path = f"temp_{audio_file.filename}"

    try:

        logger.info(f"[ANALYZE] Processing file: {temp_path}")

        # حفظ الملف المؤقت
        with open(temp_path, "wb") as f:
            f.write(await audio_file.read())

        # 1) Transcription
        transcription = transcribe_audio(temp_path)

        # 2) NLP Analysis
        analysis = analyze_call_nlp(transcription)

        logger.info("[SUCCESS] Analysis completed")

        return {
            "transcription": transcription,
            "analysis": analysis
        }

    except Exception as e:

        logger.error(f"[ANALYZE ERROR] {str(e)}")

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:

        if os.path.exists(temp_path):
            os.remove(temp_path)