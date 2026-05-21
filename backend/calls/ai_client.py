import os
import json
import logging
from typing import Any, Dict

import httpx
from django.conf import settings

logger = logging.getLogger(__name__)

# Set to True to use mock response instead of real AI service
MOCK_MODE = False

MOCK_RESPONSE = {
    "main_issue": "Customer billing dispute — taxes included in transfer amount",
    "sentiment": "positive",
    "sentiment_score": 0.85,
    "keywords": ["billing", "taxes", "transfer", "account", "refund", "payment", "fees"],
    "priority": "high",
    "needs_followup": True,
    "transcript": "Hello, I'm calling about my recent billing issue. The taxes seem to be included in the transfer amount but I'm not sure how the refund will be processed. Can you clarify the payment details and confirm the fee structure?",
    "confidence_score": 1.0,
    "detected_language": "en"
}


def _build_headers() -> Dict[str, str]:
    headers = {'Accept': 'application/json'}
    if settings.AI_SERVICE_API_KEY:
        headers['Authorization'] = f'Bearer {settings.AI_SERVICE_API_KEY}'
    return headers


def analyze_audio_file(audio_path: str) -> Dict[str, Any]:
    """
    Send audio file to external AI service for analysis.
    If MOCK_MODE is True, returns a predefined mock response instead.
    """

    # Return mock response immediately when MOCK_MODE is enabled
    if MOCK_MODE:
        logger.info(f"[MOCK MODE] Returning mock analysis for: {audio_path}")
        return MOCK_RESPONSE.copy()

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
                response = client.post(url, headers=_build_headers(), files=files)

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

    if 'analysis' not in data:
        raise ValueError("Missing 'analysis' key in AI response")

    analysis = data['analysis']
    transcription = data.get('transcription', {})

    required_keys = [
        'main_issue', 'sentiment_score', 'keywords',
        'priority', 'needs_followup', 'transcript', 'sentiment',
    ]
    for key in required_keys:
        if key not in analysis:
            logger.error(f"[AI MISSING KEY] {key}")
            raise ValueError(f'Missing key in AI response: {key}')

    analysis['transcription'] = transcription
    return analysis