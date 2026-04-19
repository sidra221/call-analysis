import os
import logging
from typing import Any, Dict
import httpx
from django.conf import settings

logger = logging.getLogger(__name__)


def _build_headers() -> Dict[str, str]:
    headers: Dict[str, str] = {
        'Accept': 'application/json',
    }
    if settings.AI_SERVICE_API_KEY:
        headers['Authorization'] = f'Bearer {settings.AI_SERVICE_API_KEY}'
    return headers


def analyze_audio_file(audio_path: str) -> Dict[str, Any]:
    url = settings.AI_SERVICE_URL
    timeout = settings.AI_SERVICE_TIMEOUT

    if not os.path.exists(audio_path):
        raise FileNotFoundError(f'Audio file not found at path: {audio_path}')

    logger.info(f"[AI REQUEST] Sending file: {audio_path} → {url}")

    try:
        with open(audio_path, 'rb') as f:
            files = {
                'audio_file': (
                    os.path.basename(audio_path),
                    f,
                    'application/octet-stream'
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

    logger.info(f"[AI RESPONSE] Status: {response.status_code}")

    if response.status_code != 200:
        logger.error(f"[AI ERROR RESPONSE] {response.text}")
        raise RuntimeError(f'AI service error: {response.status_code}')

    try:
        data = response.json()
    except Exception:
        logger.error("[AI INVALID JSON]")
        raise ValueError("Invalid JSON from AI service")

    required_keys = [
        'main_issue',
        'sentiment_score',
        'keywords',
        'priority',
        'needs_followup',
        'transcript',
        'sentiment'
    ]

    for key in required_keys:
        if key not in data:
            logger.error(f"[AI MISSING KEY] {key}")
            raise ValueError(f'Missing key in AI response: {key}')

    return data