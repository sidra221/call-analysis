from typing import List, Dict, Any
from pydantic import BaseModel, Field

MAX_TRANSCRIPT_LENGTH = 400
MAX_KEYWORDS = 12
ALLOWED_SENTIMENT = {"positive", "neutral", "negative"}
ALLOWED_PRIORITY = {"low", "medium", "high", "critical"}


# ─────────────────────────────────────────
# Pydantic Models — enables Swagger docs
# ─────────────────────────────────────────

class AnalysisItem(BaseModel):
    """Single call analysis item sent from Backend."""
    main_issue: str = ""
    sentiment: str = "neutral"
    priority: str = "low"
    keywords: List[str] = Field(default_factory=list)
    transcript: str = ""


class ReportRequest(BaseModel):
    """Request body for /generate-report endpoint."""
    analyses: List[AnalysisItem]


# ─────────────────────────────────────────
# Normalization Helpers
# ─────────────────────────────────────────

def _clean_text(text: str) -> str:
    """Normalize whitespace and remove noise."""
    if not isinstance(text, str):
        return ""
    return " ".join(text.strip().split())


def _safe_list(value) -> list:
    """Ensure the value is a list."""
    if isinstance(value, list):
        return value
    return []


def _truncate(text: str, limit: int) -> str:
    """Safely truncate long text."""
    if not text:
        return ""
    return text[:limit]


def _dedupe_keywords(keywords: List[str]) -> List[str]:
    """Remove duplicate keywords while preserving order."""
    seen = set()
    cleaned = []
    for k in keywords:
        if isinstance(k, str):
            k = k.strip().lower()
            if k and k not in seen:
                seen.add(k)
                cleaned.append(k)
    return cleaned


def normalize_analyses(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Normalize and validate call analyses before sending to AI model.
    Ensures clean, consistent, deduplicated input.
    """
    normalized = []

    for item in data:
        main_issue = _clean_text(item.get("main_issue", ""))
        sentiment = _clean_text(item.get("sentiment", "neutral")).lower()
        priority = _clean_text(item.get("priority", "low")).lower()
        transcript = _truncate(_clean_text(item.get("transcript", "")), MAX_TRANSCRIPT_LENGTH)
        raw_kw = item.get("keywords", [])
        if isinstance(raw_kw, dict):
            kw_list = []
            for bucket in ("negative", "positive", "neutral"):
                kw_list.extend(_safe_list(raw_kw.get(bucket)))
            keywords = _dedupe_keywords(kw_list[:MAX_KEYWORDS * 3])[:MAX_KEYWORDS]
        else:
            keywords = _dedupe_keywords(_safe_list(raw_kw)[:MAX_KEYWORDS])

        # Validation fallbacks
        if not main_issue:
            main_issue = "unspecified issue"
        if sentiment not in ALLOWED_SENTIMENT:
            sentiment = "neutral"
        if priority not in ALLOWED_PRIORITY:
            priority = "low"

        normalized.append({
            "main_issue": main_issue,
            "sentiment": sentiment,
            "priority": priority,
            "keywords": keywords,
            "transcript": transcript
        })

    return normalized