import os
import logging
from typing import Any, Dict

import httpx
from django.conf import settings

logger = logging.getLogger(__name__)

MOCK_MODE = False

MOCK_RESPONSE = {
    "main_issue": "Customer billing dispute",
    "sentiment": "positive",
    "sentiment_score": 0.85,
    "keywords": ["billing", "refund"],
    "priority": "high",
    "needs_followup": True,
    "transcript": "Test transcript",
    "confidence_score": 1.0,
    "detected_language": "en",
    "duration": 0
}


def _build_headers() -> Dict[str, str]:
    headers = {
        "Accept": "application/json"
    }

    if settings.AI_SERVICE_API_KEY:
        headers["Authorization"] = (
            f"Bearer {settings.AI_SERVICE_API_KEY}"
        )

    return headers


def analyze_audio_file(audio_path: str) -> Dict[str, Any]:

    if MOCK_MODE:
        logger.info(f"[MOCK MODE] {audio_path}")
        return MOCK_RESPONSE.copy()

    url = settings.AI_SERVICE_URL
    timeout = settings.AI_SERVICE_TIMEOUT

    if not os.path.exists(audio_path):
        raise FileNotFoundError(
            f"Audio file not found: {audio_path}"
        )

    logger.info(
        f"[AI REQUEST] Sending file: {audio_path} → {url}"
    )

    try:
        with open(audio_path, "rb") as f:

            files = {
                "audio_file": (
                    os.path.basename(audio_path),
                    f,
                    "audio/wav"
                )
            }

            with httpx.Client(timeout=timeout) as client:
                response = client.post(
                    url,
                    headers=_build_headers(),
                    files=files
                )

    except httpx.RequestError as e:
        logger.error(f"[AI NETWORK ERROR] {str(e)}")
        raise RuntimeError("AI service network error")

    logger.info(
        f"[AI RESPONSE] Status: {response.status_code}"
    )

    if response.status_code != 200:
        logger.error(
            f"[AI ERROR RESPONSE] {response.text}"
        )
        raise RuntimeError(
            f"AI service error: {response.status_code}"
        )

    try:
        data = response.json()
    except Exception:
        logger.error("[AI INVALID JSON]")
        raise ValueError("Invalid JSON from AI service")

    if "analysis" not in data:
        raise ValueError(
            "Missing 'analysis' key in AI response"
        )

    analysis = data["analysis"]

    transcription = data.get("transcription", {})

    analysis["transcription"] = transcription

    return analysis