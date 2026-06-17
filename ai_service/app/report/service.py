import json
import logging
import time
from typing import List, Dict, Any

import os
from dotenv import load_dotenv
from openai import OpenAI

from .prompt import build_report_prompt
from .schemas import normalize_analyses

# ─────────────────────────────────────────
# Load environment variables
# ─────────────────────────────────────────
load_dotenv()

# ─────────────────────────────────────────
# Logging
# ─────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

logger = logging.getLogger("report_service")

# ─────────────────────────────────────────
# OpenAI Client
# ─────────────────────────────────────────
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ─────────────────────────────────────────
# Constants
# ─────────────────────────────────────────
MODEL_NAME = "gpt-4.1-mini"

MAX_ANALYSES = 100
MAX_RETRIES = 3
RETRY_DELAY = 1.5
REQUEST_TIMEOUT = 25

FALLBACK_RESPONSE = {
    "repeated_issues": [],
    "positives": "",
    "recommendations": "",
}

# ─────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────
def clean_json_response(content: str) -> str:
    content = content.strip()
    if content.startswith("```json"):
        content = content.replace("```json", "", 1)
    if content.startswith("```"):
        content = content.replace("```", "", 1)
    if content.endswith("```"):
        content = content[:-3]
    return content.strip()


def validate_report_structure(data: dict) -> bool:
    if not isinstance(data, dict):
        return False
    if "repeated_issues" not in data:
        return False
    if not isinstance(data["repeated_issues"], list):
        return False

    required_fields = {
        "issue",
        "count",
        "priority",
        "description",
        "suggested_solution",
        "related_keywords"
    }

    for issue in data["repeated_issues"]:
        if not isinstance(issue, dict):
            return False
        missing = required_fields - set(issue.keys())
        if missing:
            logger.warning(f"Missing fields: {missing}")
            return False

    for text_field in ("positives", "recommendations"):
        if text_field in data and not isinstance(data[text_field], str):
            logger.warning(f"Invalid type for {text_field}")
            return False

    return True


# ─────────────────────────────────────────
# Main Generator
# ─────────────────────────────────────────
def generate_report_from_analyses(analyses: List[Dict[str, Any]]) -> Dict[str, Any]:
    try:
        logger.info("Starting report generation...")

        normalized = normalize_analyses(analyses)
        logger.info(f"Normalized analyses count: {len(normalized)}")

        if not normalized:
            return FALLBACK_RESPONSE

        normalized = normalized[:MAX_ANALYSES]
        prompt = build_report_prompt(normalized)

        response = None

        for attempt in range(1, MAX_RETRIES + 1):
            try:
                response = client.chat.completions.create(
                    model=MODEL_NAME,
                    temperature=0.2,
                    timeout=REQUEST_TIMEOUT,
                    response_format={"type": "json_object"},
                    messages=[
                        {"role": "system", "content": "Return ONLY valid JSON."},
                        {"role": "user", "content": prompt}
                    ]
                )
                break

            except Exception as e:
                logger.exception(f"Attempt {attempt} failed: {e}")
                if attempt == MAX_RETRIES:
                    return FALLBACK_RESPONSE
                time.sleep(RETRY_DELAY)

        if response is None:
            return FALLBACK_RESPONSE

        content = response.choices[0].message.content
        cleaned = clean_json_response(content)
        parsed = json.loads(cleaned)

        if not validate_report_structure(parsed):
            return FALLBACK_RESPONSE

        return parsed

    except Exception as e:
        logger.exception(f"Unexpected error: {e}")
        return FALLBACK_RESPONSE


# ─────────────────────────────────────────
# Public Service Class
# ─────────────────────────────────────────
class ReportService:
    def generate(self, analyses: List[Dict[str, Any]]) -> Dict[str, Any]:
        return generate_report_from_analyses(analyses)
