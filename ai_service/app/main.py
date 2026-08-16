import os
import logging

from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile
from typing import Annotated


def _strip_env_value(value: str) -> str:
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in ('"', "'"):
        return value[1:-1]
    return value


def _load_env_file(path: str, override: bool = False) -> None:
    if not os.path.isfile(path):
        return
    with open(path, encoding="utf-8") as handle:
        for raw in handle:
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = _strip_env_value(value)
            if key and (override or key not in os.environ):
                os.environ[key] = value


def _load_env_files() -> None:
    """AI runs outside Docker — load root .env then ai_service/.env (local wins)."""
    app_dir = os.path.dirname(__file__)
    root_env = os.path.abspath(os.path.join(app_dir, "..", "..", ".env"))
    local_env = os.path.abspath(os.path.join(app_dir, "..", ".env"))
    _load_env_file(root_env, override=False)
    _load_env_file(local_env, override=True)


_load_env_files()

from app.transcriber import transcribe_audio
from app.nlp_analyzer import analyze_call_nlp
from app.llm_refinement import is_refinement_enabled, refine_with_llm_async
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
# API key auth (matches Django: Authorization: Bearer <AI_SERVICE_API_KEY>)
# ─────────────────────────────────────────
async def verify_api_key(
    authorization: Annotated[str | None, Header()] = None,
) -> None:
    expected_key = os.getenv("AI_SERVICE_API_KEY", "").strip()
    if not expected_key:
        raise HTTPException(
            status_code=401,
            detail="AI service API key is not configured on the server",
        )

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid Authorization header",
        )

    provided_key = authorization.removeprefix("Bearer ").strip()
    if provided_key != expected_key:
        raise HTTPException(
            status_code=401,
            detail="Invalid API key",
        )

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
app.include_router(report_router, dependencies=[Depends(verify_api_key)])

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
@app.post("/analyze-call", dependencies=[Depends(verify_api_key)])
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

        if is_refinement_enabled():
            logger.info("[ANALYZE] Running LLM refinement…")
            analysis = await refine_with_llm_async(analysis)
            if analysis.get("llm_refined"):
                logger.info("[ANALYZE] LLM refinement applied")
            else:
                logger.info("[ANALYZE] LLM refinement skipped or unavailable")

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