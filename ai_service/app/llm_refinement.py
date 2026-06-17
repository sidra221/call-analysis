"""
Optional LLM refinement layer for analyze_call_nlp() output.

Enriches main_issue, summary, meta_intent, priority (upgrade only),
needs_followup, and followup_reason. Does not modify sentiment or keywords.
"""

from __future__ import annotations

import json
import logging
import os
import re
from typing import Dict, List, Optional

log = logging.getLogger("llm_refinement")

_client = None
_openai_available = False

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None  # type: ignore
    log.warning("openai package not installed — LLM refinement disabled.")


def _get_client():
    global _client, _openai_available
    if OpenAI is None:
        return None
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    _openai_available = bool(api_key)
    if not api_key:
        _client = None
        return None
    if _client is None:
        _client = OpenAI(api_key=api_key)
        log.info("OpenAI client ready for LLM refinement.")
    return _client

LLM_MODEL = os.environ.get("LLM_MODEL", "gpt-4o-mini")
LLM_MAX_TOKENS = int(os.environ.get("LLM_MAX_TOKENS", "400"))
LLM_TEMPERATURE = float(os.environ.get("LLM_TEMPERATURE", "0.1"))
LLM_REFINEMENT_MODE = os.environ.get("LLM_REFINEMENT_MODE", "all").lower()

_META_INTENT_OPTIONS = [
    "inquiry",
    "complaint",
    "troubleshooting",
    "purchase",
    "feedback",
    "escalation",
    "warning",
    "confusion",
    "transactional",
]

_ISSUE_TYPE_LABELS: Dict[str, str] = {
    "scam":              "Potential Scam / Remote Access Attempt",
    "fraud":             "Suspected Fraudulent Activity",
    "legal":             "Legal Threat",
    "financial":         "Financial / Payment Issue",
    "account":           "Account Access Issue",
    "technical":         "Technical Issue",
    "delivery":          "Delivery / Shipment Issue",
    "escalation":        "Escalation Request",
    "product_inquiry":   "Product Information Inquiry",
    "sales_inquiry":     "Sales / Purchase Inquiry",
    "positive_feedback": "Positive Feedback",
    "anger":             "Customer Dissatisfaction",
    "general":           "General Inquiry",
}

_SYSTEM_PROMPT = """You are an expert call center analyst.
Your job is to analyze customer service call transcripts and extract structured insights.

You always respond with valid JSON only — no explanations, no markdown, no extra text.
Every field in the JSON must be present and correctly typed.

Be concise, professional, and CRM-ready. Write as a senior support analyst would."""

_USER_PROMPT_TEMPLATE = """Analyze this customer service call and return a JSON object.

--- CALL DATA ---
Customer speech: {customer_text}

Already detected by our system:
- Sentiment: {sentiment} (score: {sentiment_score})
- Issue types: {issue_types}
- Issue type labels (use left side of main_issue): {issue_type_labels}
- Priority: {priority}
- Needs follow-up (rules): {needs_followup}
- Domains triggered: {domains}

--- YOUR TASK ---
Return ONLY this JSON (no extra text):

{{
  "main_issue": "<Format: [Issue Type Label] — [Short ticket title, 2-5 words]. Example: Technical Issue — System Outage>",
  "meta_intent": "<One of: {meta_intent_options}>",
  "meta_intents": ["<primary>", "<secondary if applicable>"],
  "summary": "<1-2 sentence dashboard summary mentioning tone, issue, and recommended action.>",
  "priority_confirmed": "<Confirm or upgrade: low | medium | high | critical. Never downgrade.>",
  "needs_followup": <true or false>,
  "followup_reason": "<Short reason if needs_followup is true, else empty string.>"
}}

Rules:

- main_issue format must be: [Issue Type Label] — [Short ticket title]
- The left side (before —) must be an issue type label from the detected types when applicable
- Prefer one of the detected issue types when applicable
- The right side (after —) must be a short ticket title (2-5 words only)
- Do NOT write a full sentence after the dash
- Do NOT include explanations or recommendations in main_issue
- Use professional ticket-style labels on the right side
- Examples of right-side titles:
  - System Outage
  - Login Failure
  - Billing Error
  - Delivery Delay
  - Website Outage
  - Duplicate Charge

Examples:

Customer:
"The server is down and we lost access to our data."

main_issue:
"Technical Issue — System Outage"

Customer:
"I cannot login to my account."

main_issue:
"Account Access Issue — Login Failure"

Customer:
"I was charged twice."

main_issue:
"Financial / Payment Issue — Duplicate Charge"

Customer:
"My package never arrived."

main_issue:
"Delivery / Shipment Issue — Delivery Delay"

Customer:
"The website is unavailable."

main_issue:
"Technical Issue — Website Outage"

Customer:
"The customer cannot access their account."

main_issue:
"Account Access Issue — Access Denied"

- meta_intent must be exactly one of the listed options
- priority_confirmed must never be lower than the input priority
- If sentiment is negative: meta_intent should be "complaint", "escalation", or "troubleshooting" (not "inquiry")
- If sentiment is negative: needs_followup must be true and followup_reason must explain why (specific, not generic)
- If sentiment is negative: summary must mention frustrated/dissatisfied tone and the recommended agent action
- If the customer sounds positive with no problems: meta_intent = "feedback", needs_followup = false
"""

_PRIORITY_ORDER = {"low": 0, "medium": 1, "high": 2, "critical": 3}

_INTENT_DESCRIPTIONS = {
    "inquiry": "Customer is asking for information",
    "complaint": "Customer is expressing dissatisfaction",
    "troubleshooting": "Customer is seeking help with a technical problem",
    "purchase": "Customer intends to place an order",
    "feedback": "Customer is sharing positive experience",
    "escalation": "Customer is requesting higher-level support",
    "warning": "Customer is issuing a legal or formal threat",
    "confusion": "Customer is uncertain about what they need",
    "transactional": "Customer is completing a routine action",
}


def is_refinement_enabled() -> bool:
    flag = os.environ.get("ENABLE_LLM_REFINEMENT", "").lower()
    return flag in ("1", "true", "yes")


def should_refine_with_llm(result: dict) -> bool:
    """When mode is conditional, refine only high-value or uncertain calls."""
    if LLM_REFINEMENT_MODE != "conditional":
        return True

    priority = (result.get("priority") or "low").lower()
    if priority in ("high", "critical"):
        return True
    if result.get("needs_followup"):
        return True
    confidence = result.get("confidence_score")
    if confidence is not None and float(confidence) < 0.6:
        return True
    return False


def _issue_type_labels(v8_result: dict) -> str:
    types = v8_result.get("issue_types") or ["general"]
    labels = [
        _ISSUE_TYPE_LABELS.get(t, t.replace("_", " ").title())
        for t in types
    ]
    return ", ".join(labels)


def _domains_summary(v8_result: dict) -> str:
    keywords = v8_result.get("keywords") or {}
    categories = keywords.get("categories") if isinstance(keywords, dict) else {}
    if not isinstance(categories, dict) or not categories:
        return "none detected"
    parts = []
    for cat, phrases in categories.items():
        if not isinstance(phrases, list):
            continue
        sample = [p for p in phrases[:2] if isinstance(p, str)]
        if sample:
            parts.append(f"{cat}: [{', '.join(sample)}]")
    return ", ".join(parts) or "none detected"


def _call_llm(customer_text: str, v8_result: dict) -> Optional[dict]:
    client = _get_client()
    if client is None:
        return None

    prompt = _USER_PROMPT_TEMPLATE.format(
        customer_text=customer_text[:800],
        sentiment=v8_result.get("sentiment", "neutral"),
        sentiment_score=v8_result.get("sentiment_score", 0),
        issue_types=", ".join(v8_result.get("issue_types") or ["general"]),
        issue_type_labels=_issue_type_labels(v8_result),
        priority=v8_result.get("priority", "low"),
        needs_followup=v8_result.get("needs_followup", False),
        domains=_domains_summary(v8_result),
        meta_intent_options=", ".join(_META_INTENT_OPTIONS),
    )

    raw = ""
    try:
        response = client.chat.completions.create(
            model=LLM_MODEL,
            temperature=LLM_TEMPERATURE,
            max_tokens=LLM_MAX_TOKENS,
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
        )
        raw = (response.choices[0].message.content or "").strip()
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        parsed = json.loads(raw)
        log.info("LLM refinement OK — meta_intent=%s", parsed.get("meta_intent"))
        return parsed
    except json.JSONDecodeError as exc:
        log.warning("LLM returned invalid JSON: %s — raw: %s", exc, raw[:200])
        return None
    except Exception as exc:
        log.warning("OpenAI call failed: %s", exc)
        return None


def _safe_priority(llm_priority: str, current_priority: str) -> str:
    llm_p = llm_priority.lower().strip() if llm_priority else current_priority
    if llm_p not in _PRIORITY_ORDER:
        return current_priority
    if _PRIORITY_ORDER[llm_p] < _PRIORITY_ORDER.get(current_priority, 0):
        return current_priority
    return llm_p


def _safe_str(value, max_len: int = 300, fallback: str = "") -> str:
    if not isinstance(value, str) or not value.strip():
        return fallback
    return value.strip()[:max_len]


def _safe_bool(value, fallback: bool = False) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in ("true", "yes", "1")
    return fallback


def _safe_meta_intents(value, fallback: Optional[List[str]] = None) -> List[str]:
    fallback = fallback or ["inquiry"]
    if not isinstance(value, list):
        return fallback
    valid = [v for v in value if isinstance(v, str) and v in _META_INTENT_OPTIONS]
    return valid if valid else fallback


def _apply_llm_data(result: dict, llm_data: dict, model_suffix: str) -> dict:
    out = dict(result)

    llm_main = _safe_str(llm_data.get("main_issue"), max_len=120)
    if llm_main:
        out["main_issue"] = llm_main

    primary_intent = _safe_str(llm_data.get("meta_intent"), max_len=50)
    if primary_intent and primary_intent in _META_INTENT_OPTIONS:
        out["meta_intent"] = primary_intent
        out["meta_intents"] = _safe_meta_intents(
            llm_data.get("meta_intents"), fallback=[primary_intent]
        )
        out["intent_description"] = _INTENT_DESCRIPTIONS.get(primary_intent, "")

    llm_summary = _safe_str(llm_data.get("summary"), max_len=400)
    if llm_summary:
        out["summary"] = llm_summary

    current_priority = out.get("priority", "low")
    out["priority"] = _safe_priority(
        llm_data.get("priority_confirmed", current_priority),
        current_priority,
    )

    current_fu = bool(out.get("needs_followup", False))
    llm_fu = _safe_bool(llm_data.get("needs_followup"), fallback=False)
    out["needs_followup"] = current_fu or llm_fu

    if out["needs_followup"]:
        reason = _safe_str(llm_data.get("followup_reason"), max_len=150)
        out["followup_reason"] = reason or "Follow-up required based on analysis."
    else:
        out["followup_reason"] = ""

    base_model = result.get("model_used", "hybrid_optimized_v8.0")
    out["model_used"] = f"{base_model} + {model_suffix}"
    out["llm_refined"] = True
    return out


def refine_with_llm(v8_result: dict) -> dict:
    """
    Enrich NLP output with OpenAI. Returns v8_result unchanged on failure
    or when refinement is disabled / skipped.
    """
    if not is_refinement_enabled():
        return v8_result

    customer_text = v8_result.get("customer_text") or v8_result.get("transcript", "")
    if not customer_text.strip():
        log.warning("No customer text for LLM refinement.")
        return v8_result

    if not should_refine_with_llm(v8_result):
        log.debug("LLM refinement skipped (conditional mode).")
        return v8_result

    llm_data = _call_llm(customer_text, v8_result)
    if llm_data is None:
        return v8_result

    return _apply_llm_data(v8_result, llm_data, "llm_refinement")


async def refine_with_llm_async(v8_result: dict) -> dict:
    """Async variant for FastAPI endpoints."""
    if not is_refinement_enabled():
        return v8_result

    customer_text = v8_result.get("customer_text") or v8_result.get("transcript", "")
    if not customer_text.strip():
        return v8_result

    if not should_refine_with_llm(v8_result):
        return v8_result

    try:
        from openai import AsyncOpenAI

        api_key = os.environ.get("OPENAI_API_KEY", "")
        if not api_key:
            return v8_result

        async_client = AsyncOpenAI(api_key=api_key)
        prompt = _USER_PROMPT_TEMPLATE.format(
            customer_text=customer_text[:800],
            sentiment=v8_result.get("sentiment", "neutral"),
            sentiment_score=v8_result.get("sentiment_score", 0),
            issue_types=", ".join(v8_result.get("issue_types") or ["general"]),
            issue_type_labels=_issue_type_labels(v8_result),
            priority=v8_result.get("priority", "low"),
            needs_followup=v8_result.get("needs_followup", False),
            domains=_domains_summary(v8_result),
            meta_intent_options=", ".join(_META_INTENT_OPTIONS),
        )

        response = await async_client.chat.completions.create(
            model=LLM_MODEL,
            temperature=LLM_TEMPERATURE,
            max_tokens=LLM_MAX_TOKENS,
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
        )
        raw = (response.choices[0].message.content or "").strip()
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        llm_data = json.loads(raw)
        return _apply_llm_data(v8_result, llm_data, "llm_refinement_async")
    except Exception as exc:
        log.warning("Async LLM refinement failed: %s", exc)
        return v8_result
