import os
from typing import Any, Dict
import httpx
from django.conf import settings


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

    with open(audio_path, 'rb') as f:
        files = {'audio_file': (os.path.basename(audio_path), f, 'application/octet-stream')}
        with httpx.Client(timeout=timeout) as client:
            response = client.post(url, headers=_build_headers(), files=files)

    if response.status_code != 200:
        raise RuntimeError(f'AI service error: {response.status_code} - {response.text}')

    data = response.json()
    # Expected schema from AI service; adjust mapping if needed
    # {
    #   "main_issue": str,
    #   "sentiment_score": float,
    #   "keywords": [str],
    #   "priority": "low|medium|high|critical",
    #   "needs_followup": bool,
    #   "transcript": str,
    #   "sentiment": "positive|neutral|negative"
    # }
    required_keys = [
        'main_issue', 'sentiment_score', 'keywords', 'priority',
        'needs_followup', 'transcript', 'sentiment'
    ]
    for key in required_keys:
        if key not in data:
            raise ValueError(f'Missing key in AI response: {key}')

    return data

