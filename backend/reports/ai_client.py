import logging

import httpx
from django.conf import settings

from config.ai_urls import generate_report_url

logger = logging.getLogger(__name__)


def call_ai_for_report(analyses_data: list) -> dict:
    url = generate_report_url()
    timeout = settings.AI_SERVICE_TIMEOUT

    headers = {'Accept': 'application/json', 'Content-Type': 'application/json'}
    if settings.AI_SERVICE_API_KEY:
        headers['Authorization'] = f'Bearer {settings.AI_SERVICE_API_KEY}'

    try:
        with httpx.Client(timeout=timeout) as client:
            response = client.post(url, headers=headers, json={"analyses": analyses_data})
    except httpx.RequestError as e:
        logger.error(f"[REPORT AI NETWORK ERROR] {str(e)}")
        raise RuntimeError("AI service network error")

    if response.status_code != 200:
        logger.error(f"[REPORT AI ERROR] {response.text}")
        raise RuntimeError(f"AI service error: {response.status_code}")

    try:
        return response.json()
    except Exception as e:
        logger.error(f"[REPORT AI PARSE ERROR] {str(e)}")
        raise ValueError("Could not parse AI response for report")
