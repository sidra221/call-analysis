# ================================================================
#   Call Analytics NLP Pipeline v8 — Contextual Intelligence Edition
#
#   Core fixes over v7:
#   1. Contextual disambiguation  — "charge" ≠ fee, "order" ≠ shipment
#   2. New domain: product_inquiry — battery, specs, microSD, BTU …
#   3. New domain: positive_feedback — satisfaction as a first-class domain
#   4. New domain: sales_inquiry    — B2B orders, quotes, bulk pricing
#   5. Zero-shot classifier as final arbitrator when rules conflict
#   6. Intent-driven priority       — frustration signals upgrade priority
#   7. Sentiment-domain consistency check — positive + delivery = feedback
# ================================================================

from __future__ import annotations
import os
os.environ["CUDA_VISIBLE_DEVICES"] = ""

import re
import logging
from typing import List, Tuple, Optional, Dict, Set

import numpy as np
import spacy
from nltk.sentiment import SentimentIntensityAnalyzer
from transformers import pipeline as hf_pipeline
from sentence_transformers import SentenceTransformer, util

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
log = logging.getLogger("call_nlp_v8")

# ───────────────────────────────────────────────────────────────
# Constants
# ───────────────────────────────────────────────────────────────
PRIORITY_LEVELS = ["low", "medium", "high", "critical"]
MAX_KEYWORDS    = 12
DISPLAY_KEYWORDS_MIN = 3
DISPLAY_KEYWORDS_MAX = 4
CHUNK_WORDS     = 180
OVERLAP_WORDS   = 40
SEM_THRESHOLD   = 0.72

# ── Issue descriptors ────────────────────────────────────────────
_ISSUE_DESCRIPTORS: Dict[str, str] = {
    "scam":             "Potential Scam / Remote Access Attempt",
    "fraud":            "Suspected Fraudulent Activity",
    "legal":            "Legal Threat",
    "financial":        "Financial / Payment Issue",
    "account":          "Account Access Issue",
    "technical":        "Technical Issue",
    "delivery":         "Delivery / Shipment Issue",
    "escalation":       "Escalation Request",
    "product_inquiry":  "Product Information Inquiry",
    "sales_inquiry":    "Sales / Purchase Inquiry",
    "positive_feedback":"Positive Feedback",
    "anger":            "Customer Dissatisfaction",
    "general":          "General Inquiry",
}

# ── Zero-shot labels (for conflict resolution) ──────────────────
_ZS_LABELS = list(_ISSUE_DESCRIPTORS.values())

# ── CONTEXTUAL DISAMBIGUATION ────────────────────────────────────
# Words that are ambiguous — we only count them if NO disambiguating
# context appears that nullifies them.
#
# Format: { ambiguous_word: { "nullifiers": [...], "category": "..." } }
# If any nullifier appears near the word (±60 chars window), ignore it.
_AMBIGUOUS_WORDS: Dict[str, Dict] = {
    "charge": {
        "category":   "financial",
        "nullifiers": [
            "battery", "charging", "full charge", "charge time",
            "percentage", "power", "plug", "cable", "charger",
            "how long", "hours to charge", "charging port",
        ],
    },
    "order": {
        "category":   "delivery",
        "nullifiers": [
            "place an order", "place a", "would like to order",
            "i want to order", "i'd like to", "purchase",
            "bulk order", "business order", "quote",
            "how do i order", "can i order",
            "thank you", "satisfied", "great product",
            "i purchased", "i bought", "i ordered and received",
        ],
    },
    "delivery": {
        "category":   "delivery",
        "nullifiers": [
            "estimated delivery time", "delivery date",
            "when will it be delivered", "provide delivery",
            "delivery options", "delivery cost",
        ],
    },
    "package": {
        "category":   "delivery",
        "nullifiers": [
            "package deal", "package includes", "software package",
            "what's in the package", "bundled package",
        ],
    },
    "transfer": {
        "category":   "financial",
        "nullifiers": [
            "file transfer", "data transfer", "call transfer",
            "transfer to agent", "transfer me to",
        ],
    },
    "pending": {
        "category":   "technical",
        "nullifiers": [
            "pending order", "order is pending", "still pending delivery",
        ],
    },
    "bank": {
        "category":   "financial",
        "nullifiers": [
            "bank holiday", "river bank", "memory bank",
        ],
    },
}

# ── Semantic anchors ─────────────────────────────────────────────
SEMANTIC_ANCHORS: Dict[str, List[str]] = {
    "financial": [
        "I cannot get my money out",
        "cash out my account",
        "the transaction is stuck",
        "my balance is frozen",
        "money is not moving",
        "release my funds",
    ],
    "product_inquiry": [
        "what is the battery life",
        "does it support microSD",
        "what are the specifications",
        "what is the BTU rating",
        "does it come with a remote control",
        "how much storage does it have",
        "is it compatible with",
        "what is the screen size",
        "what colors does it come in",
        "what is the warranty",
        "I could not find that information on the website",
        "I have a question about the product",
    ],
    "sales_inquiry": [
        "I would like to place a business order",
        "can you provide a quote",
        "bulk order discount",
        "what is the price for",
        "I need multiple units",
        "corporate pricing",
        "purchase order",
    ],
    "positive_feedback": [
        "I am very satisfied",
        "I am calling to say thank you",
        "I just wanted to let you know how happy I am",
        "great experience with your product",
        "excellent service",
        "I would recommend",
    ],
    "account": [
        "I cannot log in",
        "locked out of my account",
        "my profile is disabled",
    ],
    "technical": [
        "the app keeps crashing",
        "I keep getting an error message",
        "the system is not responding",
        "nothing seems to work",
    ],
    "delivery": [
        "my parcel has not arrived",
        "no update on my shipment",
        "where is my order",
        "the tracking hasn't updated",
    ],
    "legal": [
        "I will take this to court",
        "I will get my attorney involved",
        "I am filing a complaint",
    ],
    "scam": [
        "they asked me to install an app",
        "someone asked for my screen",
        "they sent me a QR code to scan",
    ],
}

# ── Domain Registry ──────────────────────────────────────────────
# Fields: (phrase, category, priority, weight, needs_context_check)
# needs_context_check=True → run through _AMBIGUOUS_WORDS before accepting
DOMAIN_REGISTRY: List[Tuple[str, str, str, int, bool]] = [
    # Scam
    ("anydesk",             "scam",       "critical", 10, False),
    ("remote access",       "scam",       "critical", 10, False),
    ("share your screen",   "scam",       "critical", 10, False),
    ("control your device", "scam",       "critical", 10, False),
    ("verification app",    "scam",       "critical",  9, False),
    ("install this app",    "scam",       "critical",  9, False),
    ("qr code",             "scam",       "critical",  8, False),
    # Fraud
    ("fraud",               "fraud",      "critical", 10, False),
    ("unauthorized",        "fraud",      "critical",  9, False),
    ("stolen",              "fraud",      "critical",  9, False),
    ("hacked",              "fraud",      "critical",  9, False),
    ("identity theft",      "fraud",      "critical", 10, False),
    # Legal
    ("legal action",        "legal",      "critical",  9, False),
    ("lawyer",              "legal",      "critical",  8, False),
    ("attorney",            "legal",      "critical",  8, False),
    ("police",              "legal",      "critical",  8, False),
    ("sue",                 "legal",      "critical",  7, False),
    ("lawsuit",             "legal",      "critical",  9, False),
    # Financial — unambiguous phrases first (longer → higher specificity)
    ("pending withdrawal",  "financial",  "high",      9, False),
    ("cash out",            "financial",  "medium",    8, False),
    ("cash-out",            "financial",  "medium",    8, False),
    ("get my money",        "financial",  "medium",    8, False),
    ("my money is",         "financial",  "medium",    7, False),
    ("capital gains",       "financial",  "medium",    6, False),
    ("refund",              "financial",  "medium",    7, False),
    ("withdrawal",          "financial",  "medium",    7, False),
    ("withdraw",            "financial",  "medium",    7, False),
    ("payment",             "financial",  "medium",    6, False),
    ("transfer",            "financial",  "medium",    5, True),   # ambiguous
    ("invoice",             "financial",  "medium",    5, False),
    ("billing",             "financial",  "medium",    5, False),
    ("funds",               "financial",  "medium",    6, False),
    ("crypto",              "financial",  "medium",    6, False),
    ("tax",                 "financial",  "medium",    5, False),
    ("fee",                 "financial",  "medium",    5, False),
    ("charge",              "financial",  "medium",    5, True),   # ← AMBIGUOUS
    ("bank",                "financial",  "medium",    4, True),   # ambiguous
    # Account
    ("blocked my account",  "account",    "high",      9, False),
    ("account blocked",     "account",    "high",      8, False),
    ("account suspended",   "account",    "high",      8, False),
    ("locked out",          "account",    "high",      7, False),
    ("cannot login",        "account",    "high",      8, False),
    ("can't login",         "account",    "high",      8, False),
    # Technical
    ("not working",         "technical",  "medium",    7, False),
    ("error message",       "technical",  "medium",    8, False),
    ("error",               "technical",  "medium",    5, False),
    ("bug",                 "technical",  "medium",    6, False),
    ("failed",              "technical",  "medium",    6, False),
    ("crash",               "technical",  "medium",    6, False),
    ("broken",              "technical",  "medium",    5, False),
    ("offline",             "technical",  "medium",    5, False),
    ("pending",             "technical",  "medium",    5, True),   # ambiguous
    ("nothing seems to work","technical", "medium",    8, False),
    ("keep getting",        "technical",  "medium",    7, False),
    ("server is down",      "technical",  "high",      9, False),
    ("system is down",      "technical",  "high",      9, False),
    ("data loss",           "technical",  "high",      9, False),
    ("lost access",         "technical",  "high",      8, False),
    ("critical issue",      "technical",  "medium",    8, False),
    ("business operations", "technical",  "medium",    7, False),
    ("technical support",   "technical",  "medium",    7, False),
    ("back online",         "technical",  "medium",    7, False),
    ("major problem",       "technical",  "medium",    8, False),
    ("outage",              "technical",  "high",      8, False),
    ("service interruption","technical",  "high",      9, False),
    ("account recovery",    "account",    "medium",    8, False),
    ("billing inquiry",     "financial",  "medium",    7, False),
    # Delivery — ONLY unambiguous forms (tracking-specific)
    ("hasn't updated",      "delivery",   "medium",    7, False),
    ("tracking number",     "delivery",   "low",       6, False),
    ("shipment",            "delivery",   "low",       5, False),
    ("shipping status",     "delivery",   "low",       6, False),
    ("where is my",         "delivery",   "low",       5, False),
    ("my package hasn",     "delivery",   "medium",    7, False),
    ("delivery",            "delivery",   "low",       4, True),   # ← AMBIGUOUS
    ("package",             "delivery",   "low",       3, True),   # ambiguous
    ("order",               "delivery",   "low",       2, True),   # ← AMBIGUOUS
    # Product inquiry — NEW DOMAIN
    ("battery life",        "product_inquiry", "low",  9, False),
    ("battery",             "product_inquiry", "low",  7, False),
    ("microsd",             "product_inquiry", "low",  9, False),
    ("specifications",      "product_inquiry", "low",  8, False),
    ("specs",               "product_inquiry", "low",  7, False),
    ("btu",                 "product_inquiry", "low",  9, False),
    ("remote control",      "product_inquiry", "low",  7, False),
    ("screen size",         "product_inquiry", "low",  8, False),
    ("storage capacity",    "product_inquiry", "low",  8, False),
    ("compatible with",     "product_inquiry", "low",  7, False),
    ("warranty",            "product_inquiry", "low",  6, False),
    ("how long does it",    "product_inquiry", "low",  7, False),
    ("does it support",     "product_inquiry", "low",  8, False),
    ("does it come with",   "product_inquiry", "low",  7, False),
    ("what is the",         "product_inquiry", "low",  4, False),
    ("typical usage",       "product_inquiry", "low",  8, False),
    ("expandable storage",  "product_inquiry", "low",  9, False),
    ("full charge",         "product_inquiry", "low",  8, False),  # battery context
    ("a full charge",       "product_inquiry", "low",  8, False),
    ("on a charge",         "product_inquiry", "low",  7, False),
    # Sales inquiry — NEW DOMAIN
    ("place an order",      "sales_inquiry",  "medium", 9, False),
    ("place a",             "sales_inquiry",  "medium", 5, False),
    ("business order",      "sales_inquiry",  "medium", 9, False),
    ("bulk order",          "sales_inquiry",  "medium", 9, False),
    ("purchase order",      "sales_inquiry",  "medium", 8, False),
    ("provide a quote",     "sales_inquiry",  "medium", 9, False),
    ("detailed quote",      "sales_inquiry",  "medium", 9, False),
    ("bulk pricing",        "sales_inquiry",  "medium", 8, False),
    ("corporate pricing",   "sales_inquiry",  "medium", 8, False),
    ("i'd like to order",   "sales_inquiry",  "medium", 9, False),
    ("i would like to order","sales_inquiry", "medium", 9, False),
    # Positive feedback — NEW DOMAIN
    ("very satisfied",      "positive_feedback", "low", 9, False),
    ("i'm satisfied",       "positive_feedback", "low", 9, False),
    ("i am satisfied",      "positive_feedback", "low", 9, False),
    ("excellent product",   "positive_feedback", "low", 8, False),
    ("great product",       "positive_feedback", "low", 7, False),
    ("love the product",    "positive_feedback", "low", 8, False),
    ("transformed my",      "positive_feedback", "low", 7, False),
    ("smooth transaction",  "positive_feedback", "low", 8, False),
    ("thank you for",       "positive_feedback", "low", 6, False),
    ("i wanted to let you know","positive_feedback","low",8, False),
    ("calling to let you know", "positive_feedback","low",9, False),
    # Escalation
    ("manager",             "escalation", "high",      7, False),
    ("supervisor",          "escalation", "high",      7, False),
    ("escalate",            "escalation", "high",      7, False),
    ("not resolved",        "escalation", "high",      7, False),
    ("still waiting",       "escalation", "high",      6, False),
    ("immediate assistance","escalation", "high",      8, False),
    ("every time i call",   "escalation", "high",      8, False),
    ("fourth time",         "escalation", "high",      7, False),
    ("nothing gets fixed",  "escalation", "high",      8, False),
    # Anger signals
    ("angry",               "anger",      "high",      6, False),
    ("furious",             "anger",      "high",      7, False),
    ("unacceptable",        "anger",      "high",      6, False),
    ("ridiculous",          "anger",      "high",      5, False),
    ("outrageous",          "anger",      "high",      6, False),
    ("tired of dealing",    "anger",      "high",      8, False),
    ("really tired",        "anger",      "high",      7, False),
]

_KW_STOPWORDS: Set[str] = {
    "thing", "things", "something", "anything", "everything",
    "stuff", "way", "okay", "yeah", "hello", "hi", "hey",
    "like", "know", "going", "really", "just", "very", "also",
    "need", "want", "got", "get", "make", "let", "say", "said",
    "good", "great", "well", "right", "sure", "actually",
    "basically", "literally", "kind", "little", "bit",
    "check", "moment", "please", "understand", "sir",
    "apologize", "inconvenience", "one", "two", "three",
    "first", "second", "last", "next", "ago", "today",
    "yesterday", "monday", "tuesday", "wednesday", "thursday",
    "friday", "saturday", "sunday", "week", "month", "year",
    "time", "times", "day", "days", "hour", "hours", "minute",
    "call", "calling", "name", "number",
}

_KW_GENERIC_BLACKLIST: Set[str] = {
    "issue", "problem", "online", "order", "access", "connect", "operation",
    "lose", "lost", "help", "back", "get", "work", "working", "system",
}

_KW_PHRASE_ANCHORS: Set[str] = {
    "server", "system", "data", "access", "payment", "account", "refund",
    "withdrawal", "delivery", "tracking", "support", "network", "error",
    "business", "fraud", "blocked", "down", "crash", "invoice", "billing",
}

_NEG_KW_CATEGORIES: Set[str] = {"scam", "fraud", "legal", "anger", "escalation"}
_POS_KW_CATEGORIES: Set[str] = {"satisfaction", "positive_feedback"}
_PROBLEM_CATEGORIES: Set[str] = {"technical", "account", "financial", "delivery", "fraud", "scam"}
_INTENT_CATEGORIES: Set[str] = {"escalation", "sales_inquiry"}

_SPACY_EXCLUDED_ENTITY_LABELS: Set[str] = {
    "PERSON", "CARDINAL", "DATE", "TIME", "ORDINAL", "MONEY",
}

_REFERENCE_PHRASES_EXACT: Set[str] = {
    "order number", "ticket number", "customer number", "reference number",
    "phone number", "account number", "tracking number", "confirmation number",
    "serial number", "case number", "invoice number", "my order number",
    "the order number", "your order number",
}

_REFERENCE_SUFFIX_RE = re.compile(
    r"\b(number|id|code|reference|identifier)s?\s*$",
    re.IGNORECASE,
)

_INTENT_PHRASE_HINTS: Tuple[str, ...] = (
    "technical support", "immediate assistance", "back online",
    "account recovery", "billing inquiry", "escalate", "supervisor", "manager",
)

_PROBLEM_PHRASE_HINTS: Tuple[str, ...] = (
    "system is down", "critical issue", "lost access", "major problem",
    "data loss", "outage", "service interruption", "not working", "error",
    "failed", "down", "blocked", "offline",
)

# Shown only if fewer than DISPLAY_KEYWORDS_MIN candidates remain
_LOW_VALUE_DISPLAY_PHRASES: Set[str] = {
    "business operations", "our business operations", "back online",
    "get this back online", "major problem", "a major problem",
}

_ROLE_DISPLAY_BONUS: Dict[str, float] = {
    "problem":  100.0,
    "intent":    60.0,
    "negative":  40.0,
    "positive":  40.0,
}

_ROLE_DISPLAY_QUOTAS: Dict[str, int] = {
    "problem":  2,
    "intent":   2,
    "negative": 1,
    "positive": 2,
}

_TIME_PATTERN = re.compile(
    r"\b(\d+\s*(days?|weeks?|hours?|months?)|"
    r"(last|this|next)\s+\w+|"
    r"(monday|tuesday|wednesday|thursday|friday|saturday|sunday)|"
    r"\d+\s*(am|pm)|"
    r"(today|yesterday|tomorrow))\b",
    re.IGNORECASE,
)

# ───────────────────────────────────────────────────────────────
# Model Loading
# ───────────────────────────────────────────────────────────────
log.info("⏳ Loading spaCy …")
try:
    _nlp = spacy.load("en_core_web_sm")
except Exception:
    log.error("Run: python -m spacy download en_core_web_sm")
    _nlp = None

log.info("⏳ Loading VADER …")
_vader = SentimentIntensityAnalyzer()

log.info("⏳ Loading RoBERTa …")
try:
    _roberta = hf_pipeline(
        "sentiment-analysis",
        model="cardiffnlp/twitter-roberta-base-sentiment-latest",
        truncation=True, max_length=512, device="cpu",
    )
    log.info("RoBERTa probe: %s", _roberta("test")[0]["label"])
except Exception as exc:
    log.warning("RoBERTa failed (%s) — VADER-only mode.", exc)
    _roberta = None

log.info("⏳ Loading zero-shot classifier …")
try:
    _zero_shot = hf_pipeline(
        "zero-shot-classification",
        model="facebook/bart-large-mnli",
        device="cpu",
    )
    log.info("Zero-shot loaded.")
except Exception as exc:
    log.warning("Zero-shot failed (%s) — rule-only mode.", exc)
    _zero_shot = None

log.info("⏳ Loading sentence embedder …")
try:
    _embedder = SentenceTransformer(
        "sentence-transformers/all-MiniLM-L6-v2", device="cpu"
    )
    _anchor_embeddings: Dict[str, np.ndarray] = {
        cat: _embedder.encode(phrases, convert_to_numpy=True)
        for cat, phrases in SEMANTIC_ANCHORS.items()
    }
    log.info("Semantic anchors encoded.")
except Exception as exc:
    log.warning("Embedder failed (%s) — semantic expansion disabled.", exc)
    _embedder = None
    _anchor_embeddings = {}

log.info("✅ All models ready.")


# ───────────────────────────────────────────────────────────────
# Utilities
# ───────────────────────────────────────────────────────────────
def _clean(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()

def _chunk(text: str) -> List[str]:
    words = text.split()
    if len(words) <= CHUNK_WORDS:
        return [text]
    chunks, i = [], 0
    while i < len(words):
        chunks.append(" ".join(words[i: i + CHUNK_WORDS]))
        i += CHUNK_WORDS - OVERLAP_WORDS
    return chunks

def _map_roberta_label(raw: str) -> str:
    r = raw.lower()
    if "pos" in r or r == "label_2":  return "positive"
    if "neg" in r or r == "label_0":  return "negative"
    return "neutral"

def _safe_get_language(data: dict) -> str:
    lang = data.get("language", "unknown")
    return lang.split("-")[0].lower() if isinstance(lang, str) else "unknown"

def _is_time_phrase(text: str) -> bool:
    return bool(_TIME_PATTERN.fullmatch(text.strip()))

def _phrase_pattern(phrase: str) -> re.Pattern:
    escaped = re.escape(phrase.lower().strip())
    body = escaped.replace(r"\ ", r"\s+") if " " in phrase.strip() else escaped
    return re.compile(r"(?<!\w)" + body + r"(?!\w)", re.IGNORECASE)

def _phrase_in_text(phrase: str, text_lower: str) -> bool:
    if not phrase or not text_lower:
        return False
    return bool(_phrase_pattern(phrase).search(text_lower))

def _phrase_span(phrase: str, text_lower: str) -> Tuple[int, int]:
    match = _phrase_pattern(phrase).search(text_lower)
    if not match:
        return -1, -1
    return match.start(), match.end()

def _is_generic_kw(text: str) -> bool:
    t = text.lower().strip()
    return t in _KW_GENERIC_BLACKLIST

def _clean_keyphrase(text: str) -> str:
    cleaned = re.sub(
        r"^(a|an|the|my|our|your|their|this|that)\s+",
        "",
        text.strip(),
        flags=re.IGNORECASE,
    )
    return cleaned.strip()

def _category_polarity(category: str) -> str:
    if category in _NEG_KW_CATEGORIES:
        return "negative"
    if category in _POS_KW_CATEGORIES:
        return "positive"
    return "neutral"

def _domain_weight(weight: int, category: str, sentiment: str) -> int:
    if sentiment == "negative" and category in _NEG_KW_CATEGORIES | {"technical", "account"}:
        return weight + 3
    if sentiment == "positive" and category in _POS_KW_CATEGORIES:
        return weight + 3
    return weight

def _extract_merged_phrases(text: str) -> List[str]:
    """Build bigrams/trigrams anchored on domain-relevant terms."""
    found: List[str] = []
    seen: Set[str] = set()
    sentences = re.split(r"(?<=[.!?])\s+", text)
    for sentence in sentences:
        clean = re.sub(r"[^\w\s']", " ", sentence.lower())
        words = [w for w in clean.split() if w]
        for size in (3, 2):
            for i in range(len(words) - size + 1):
                chunk = words[i:i + size]
                if not any(w in _KW_PHRASE_ANCHORS for w in chunk):
                    continue
                phrase = _clean_keyphrase(" ".join(chunk))
                key = phrase.lower()
                if key in seen or not _valid_keyphrase(phrase) or _is_reference_phrase(phrase):
                    continue
                seen.add(key)
                found.append(phrase)
    return found

def _valid_kw(text: str) -> bool:
    t = text.lower().strip()
    if len(t) < 3:                         return False
    if t in _KW_STOPWORDS:                 return False
    if _is_generic_kw(text):               return False
    if _is_time_phrase(t):                 return False
    if all(c in ".,!?;:-" for c in t):    return False
    if re.fullmatch(r"\d+", t):            return False
    return True

def _valid_keyphrase(text: str) -> bool:
    if not _valid_kw(text):
        return False
    t = text.lower().strip()
    if re.match(r"^(with|and|or|to|for|in|on|at|the|is)\s", t):
        return False
    words = t.split()
    edge_stop = {"is", "and", "or", "the", "a", "an", "to", "for", "in", "on", "at"}
    if words[0] in edge_stop or words[-1] in edge_stop:
        return False
    digit_words = [w for w in words if re.fullmatch(r"\d+", w)]
    if len(digit_words) > 1:
        return False
    if digit_words and not any(x in t for x in ("order", "server", "account", "phone")):
        return False
    if "'" in t:
        return False
    return True

def _contains_digits(text: str) -> bool:
    return any(ch.isdigit() for ch in text)


def _is_reference_phrase(text: str) -> bool:
    """Identifying / reference phrases — not analytically useful as keywords."""
    t = _clean_keyphrase(text).lower().strip()
    if not t:
        return True
    if t in _REFERENCE_PHRASES_EXACT:
        return True
    if _REFERENCE_SUFFIX_RE.search(t):
        return True
    if _contains_digits(text):
        return True
    return False


def _is_excluded_entity(ent) -> bool:
    if ent.label_ in _SPACY_EXCLUDED_ENTITY_LABELS:
        return True
    if _contains_digits(ent.text):
        return True
    return False


def _keyword_role(text: str, category: str, polarity: str, primary_issue: str) -> str:
    if _is_reference_phrase(text):
        return ""
    tl = text.lower()
    if category in _POS_KW_CATEGORIES or polarity == "positive":
        return "positive"
    if category in _INTENT_CATEGORIES or any(h in tl for h in _INTENT_PHRASE_HINTS):
        return "intent"
    if any(h in tl for h in _PROBLEM_PHRASE_HINTS):
        return "problem"
    if polarity == "negative" or category in _NEG_KW_CATEGORIES:
        return "negative"
    if category in _PROBLEM_CATEGORIES or category == primary_issue:
        return "problem"
    return ""


def _is_analytical_candidate(text: str, from_domain: bool = False) -> bool:
    """Reject reference/identity noise; allow domain registry matches."""
    if from_domain and not _is_reference_phrase(text):
        return True
    if _is_reference_phrase(text):
        return False
    if from_domain:
        return True
    # spaCy-derived candidates must be multi-word analytical phrases
    if len(text.split()) < 2:
        return False
    return True


def _drop_subsumed(phrases: List[str]) -> List[str]:
    """Remove shorter keywords absorbed by a longer phrase in the same bucket."""
    kept: List[str] = []
    lower = [p.lower() for p in phrases]
    for i, phrase in enumerate(phrases):
        pl = lower[i]
        if any(
            j != i and len(lower[j]) > len(pl) and _phrase_in_text(pl, lower[j])
            for j in range(len(phrases))
        ):
            continue
        kept.append(phrase)
    return kept


def _phrase_frequency(phrase: str, text_lower: str) -> int:
    return max(1, len(_phrase_pattern(phrase).findall(text_lower)))


def _lookup_phrase_category(text: str, categories: Dict[str, List[str]]) -> str:
    tl = text.lower()
    for cat, phrases in categories.items():
        for p in phrases:
            if p.lower() == tl:
                return cat
    return ""


def _resolve_phrase_polarity(
    text: str,
    domain_pol: str,
    call_sentiment: str,
) -> str:
    if domain_pol in ("negative", "positive"):
        return domain_pol
    pol, compound = _vader_sentiment(text)
    if pol != "neutral":
        return pol
    if call_sentiment == "negative" and compound <= -0.08:
        return "negative"
    if call_sentiment == "positive" and compound >= 0.08:
        return "positive"
    return "neutral"


def _candidate_score(
    base_weight: float,
    text: str,
    polarity: str,
    category: str,
    freq: int,
    call_sentiment: str,
    primary_issue: str,
) -> float:
    _, compound = _vader_sentiment(text)
    score = base_weight + freq * 2.5 + abs(compound) * 4.0
    if polarity == call_sentiment:
        score += 5.0
    if category and category == primary_issue:
        score += 6.0
    if call_sentiment == "negative" and category in _NEG_KW_CATEGORIES | {"technical", "account", "financial"}:
        score += 3.0
    if call_sentiment == "positive" and category in _POS_KW_CATEGORIES:
        score += 3.0
    return score


def _display_polarity(polarity: str, call_sentiment: str, category: str, primary_issue: str) -> str:
    if call_sentiment == "negative" and category and category == primary_issue:
        return "negative"
    if call_sentiment == "positive" and category in _POS_KW_CATEGORIES:
        return "positive"
    return polarity


def _build_display_keywords(
    ranked: List[Tuple[float, str, str, str]],
    call_sentiment: str,
    primary_issue: str,
    max_display: int = DISPLAY_KEYWORDS_MAX,
) -> List[Dict[str, str]]:
    """
    Top 3–4 keywords for UI: score-ranked within role priority
    (problem → intent → negative/positive). Low-value phrases omitted
    unless needed to reach DISPLAY_KEYWORDS_MIN.
    """
    role_pick_order = ("problem", "intent", "negative", "positive")
    candidates: List[Tuple[float, float, str, str, str, str]] = []

    for raw_score, text, pol, cat in ranked:
        if _is_reference_phrase(text):
            continue
        role = _keyword_role(text, cat, pol, primary_issue)
        if not role:
            continue
        if call_sentiment == "negative" and role == "positive":
            continue
        if call_sentiment == "positive" and role in ("problem", "negative"):
            continue
        tl = text.lower()
        low_value = tl in _LOW_VALUE_DISPLAY_PHRASES
        effective = raw_score + _ROLE_DISPLAY_BONUS.get(role, 0.0)
        if low_value:
            effective -= 80.0
        candidates.append((effective, raw_score, text, pol, cat, role))

    if not candidates:
        return []

    by_role: Dict[str, List[Tuple]] = {r: [] for r in role_pick_order}
    for item in sorted(candidates, key=lambda x: x[0], reverse=True):
        by_role.setdefault(item[5], []).append(item)

    display: List[Dict[str, str]] = []
    seen: Set[str] = set()
    role_counts: Dict[str, int] = {r: 0 for r in role_pick_order}

    def _add(item: Tuple[float, float, str, str, str, str]) -> None:
        _eff, raw_score, text, pol, cat, role = item
        key = text.lower()
        if key in seen or len(display) >= max_display:
            return
        seen.add(key)
        cat_label = cat or primary_issue or ""
        display.append({
            "text": text,
            "polarity": _display_polarity(pol, call_sentiment, cat_label, primary_issue),
            "category": cat_label,
            "keyword_role": role,
            "score": round(raw_score, 1),
        })
        role_counts[role] = role_counts.get(role, 0) + 1

    # Pass 1 — role quotas (problem first, then intent, …)
    for role in role_pick_order:
        quota = _ROLE_DISPLAY_QUOTAS.get(role, 1)
        for item in by_role.get(role, []):
            if role_counts.get(role, 0) >= quota:
                break
            if item[2].lower() in _LOW_VALUE_DISPLAY_PHRASES:
                continue
            _add(item)

    # Pass 2 — fill to MIN with best remaining scores (skip low-value)
    if len(display) < DISPLAY_KEYWORDS_MIN:
        for item in sorted(candidates, key=lambda x: x[0], reverse=True):
            if len(display) >= DISPLAY_KEYWORDS_MIN:
                break
            if item[2].lower() in _LOW_VALUE_DISPLAY_PHRASES:
                continue
            _add(item)

    # Pass 3 — fill to MAX if strong candidates remain
    for item in sorted(candidates, key=lambda x: x[0], reverse=True):
        if len(display) >= max_display:
            break
        if item[2].lower() in _LOW_VALUE_DISPLAY_PHRASES:
            continue
        _add(item)

    texts = [d["text"] for d in display]
    kept = _drop_subsumed(texts)
    display = [d for d in display if d["text"] in kept]

    # Re-sort final list by effective score (problem/intent first)
    score_map = {c[2].lower(): c[0] for c in candidates}
    display.sort(key=lambda d: score_map.get(d["text"].lower(), 0), reverse=True)
    return display[:max_display]


def _finalize_keyword_buckets(
    pool: List[Tuple[float, str, str]],
    phrase_categories: Dict[str, str],
    transcript: str,
    categories: Dict[str, List[str]],
    domain_keys: Set[str],
    call_sentiment: str,
    issue_types: List[str],
    max_kw: int,
) -> Dict:
    t_lower = transcript.lower()
    primary_issue = issue_types[0] if issue_types else "general"
    ranked: List[Tuple[float, str, str, str]] = []

    for base_weight, text, domain_pol in pool:
        if _is_reference_phrase(text):
            continue
        cat = phrase_categories.get(text.lower()) or _lookup_phrase_category(text, categories)
        pol = _resolve_phrase_polarity(text, domain_pol, call_sentiment)
        freq = _phrase_frequency(text, t_lower)
        score = _candidate_score(base_weight, text, pol, cat, freq, call_sentiment, primary_issue)
        ranked.append((score, text, pol, cat))

    ranked.sort(key=lambda x: x[0], reverse=True)

    for phrase, category, _, weight, needs_ctx in sorted(
        DOMAIN_REGISTRY, key=lambda x: x[3], reverse=True
    ):
        if phrase.lower() not in domain_keys:
            continue
        if _is_reference_phrase(phrase):
            continue
        if needs_ctx and _is_nullified(phrase, t_lower):
            continue
        pol = _category_polarity(category)
        entry = (float(weight + 25), phrase, pol, category)
        ranked = [entry] + [r for r in ranked if r[1].lower() != phrase.lower()]

    neg, pos, neu = [], [], []
    for _, text, pol, _cat in ranked:
        if _is_reference_phrase(text):
            continue
        if pol == "negative" and len(neg) < max_kw:
            neg.append(text)
        elif pol == "positive" and len(pos) < max_kw:
            pos.append(text)
        elif pol == "neutral" and len(neu) < max_kw:
            neu.append(text)

    neg = _drop_subsumed(neg)
    pos = _drop_subsumed(pos)
    neu = _drop_subsumed(neu)

    display = _build_display_keywords(ranked, call_sentiment, primary_issue)
    top_neg, top_issue = _find_top_phrases(transcript)

    return {
        "negative":            neg,
        "positive":            pos,
        "neutral":             neu,
        "categories":          {k: v for k, v in categories.items() if v},
        "primary_polarity":    call_sentiment,
        "primary_issue_type":  primary_issue,
        "display":             display,
        "top_negative_phrase": top_neg,
        "top_issue_phrase":    top_issue,
    }


# ───────────────────────────────────────────────────────────────
# 1) Transcript Extraction
# ───────────────────────────────────────────────────────────────
def extract_transcript(data: dict) -> str:
    try:
        segs = data.get("segments", [])
        return _clean(" ".join(
            s.get("text", "").strip() for s in segs if s.get("text", "").strip()
        ))
    except Exception:
        return ""

_COMPLAINT_SIGNALS = [
    "withdraw", "withdrawal", "refund", "blocked", "can't", "cannot",
    "not working", "error", "pending", "lawyer", "legal action",
    "angry", "furious", "unacceptable", "ridiculous", "terrible",
    "manager", "supervisor", "escalate", "every time", "not resolved",
    "still waiting", "nothing gets fixed", "my money", "my account",
    "cash out", "fraud", "stolen", "hacked", "tracking", "delivery",
    "not received", "hasn't arrived", "tired of dealing",
]

def _complaint_score(texts: List[str]) -> float:
    joined = " ".join(texts).lower()
    return sum(1 for sig in _COMPLAINT_SIGNALS if sig in joined)

def get_customer_text(data: dict) -> str:
    speakers: Dict[str, List[str]] = {}
    speaker_start: Dict[str, float] = {}
    for seg in data.get("segments", []):
        spk   = seg.get("speaker", "")
        txt   = seg.get("text", "").strip()
        start = float(seg.get("start", 0))
        if spk and txt:
            if spk not in speaker_start:
                speaker_start[spk] = start
            speakers.setdefault(spk, []).append(txt)
    if not speakers:
        return extract_transcript(data)
    if len(speakers) == 1:
        return _clean(" ".join(list(speakers.values())[0]))
    scores = {spk: _complaint_score(texts) for spk, texts in speakers.items()}
    max_sc = max(scores.values())
    candidates = [s for s, sc in scores.items() if sc == max_sc]
    customer = min(candidates, key=lambda s: speaker_start.get(s, 0))
    return _clean(" ".join(speakers[customer]))


# ───────────────────────────────────────────────────────────────
# 2) Sentiment Analysis
# ───────────────────────────────────────────────────────────────
_NEUTRAL_OVERRIDES = [
    "i'm not angry", "i am not angry", "not upset", "not frustrated",
    "not angry", "just need to know", "just want to know",
]
_VADER_POS_BOOST = [
    "thank you", "thanks", "appreciate", "helpful", "great",
    "perfect", "excellent", "i'm happy", "i'm satisfied",
    "very satisfied", "resolved", "sorted out", "smooth transaction",
    "transformed my", "great product", "love the product",
]
_VADER_NEG_BOOST = [
    "angry", "furious", "unacceptable", "ridiculous", "terrible",
    "worst", "useless", "lawyer", "legal action", "i want a manager",
    "holding my money", "every time i call", "nothing gets fixed",
    "tired of dealing", "really tired",
]

def _vader_sentiment(text: str) -> Tuple[str, float]:
    compound = _vader.polarity_scores(text)["compound"]
    t = text.lower()
    if any(p in t for p in _VADER_POS_BOOST):    compound = min(compound + 0.30, 1.0)
    if any(n in t for n in _VADER_NEG_BOOST):    compound = max(compound - 0.40, -1.0)
    if any(o in t for o in _NEUTRAL_OVERRIDES):  compound = min(compound + 0.25, 1.0)
    compound = round(compound, 4)
    if compound >= 0.25:   return "positive", compound
    if compound <= -0.25:  return "negative", compound
    return "neutral", compound

def _roberta_sentiment(text: str) -> Tuple[Optional[str], float, float]:
    if _roberta is None:
        return None, 0.0, 0.0
    buckets: Dict[str, float] = {"positive": 0.0, "neutral": 0.0, "negative": 0.0}
    total_w = 0.0
    for chunk in _chunk(text):
        try:
            res   = _roberta(chunk)[0]
            label = _map_roberta_label(res["label"])
            conf  = float(res["score"])
            w     = len(chunk.split())
            buckets[label] += conf * w
            total_w += w
        except Exception:
            pass
    if total_w == 0:
        return None, 0.0, 0.0
    for k in buckets:
        buckets[k] /= total_w
    best_label = max(buckets, key=buckets.__getitem__)
    best_prob  = buckets[best_label]
    signed = (best_prob if best_label == "positive"
              else -best_prob if best_label == "negative"
              else 0.0)
    return best_label, round(signed, 4), round(best_prob, 4)

def analyze_sentiment(text: str) -> Tuple[str, float, float]:
    if not text:
        return "neutral", 0.0, 0.0
    r_label, r_score, r_prob = _roberta_sentiment(text)
    v_label, v_score         = _vader_sentiment(text)
    t = text.lower()
    has_override = any(o in t for o in _NEUTRAL_OVERRIDES)
    if r_label is None:
        return v_label, v_score, abs(v_score)
    if r_label == "negative" and has_override:
        blended = round(r_score * 0.4 + v_score * 0.6, 4)
        blended = max(min(blended, 1.0), -1.0)
        if blended >= 0.20:   return "positive", blended, abs(blended)
        if blended <= -0.20:  return "negative", blended, abs(blended)
        return "neutral", blended, abs(blended)
    if abs(r_score) >= 0.55:
        return r_label, r_score, r_prob
    blended = round(r_score * 0.60 + v_score * 0.40, 4)
    blended = max(min(blended, 1.0), -1.0)
    if blended >= 0.20:   return "positive", blended, abs(blended)
    if blended <= -0.20:  return "negative", blended, abs(blended)
    return "neutral", blended, abs(blended)


# ───────────────────────────────────────────────────────────────
# FIX 1 — Contextual Disambiguation
# ───────────────────────────────────────────────────────────────
def _is_nullified(phrase: str, text_lower: str) -> bool:
    """
    Returns True if the phrase should be IGNORED because a nullifier
    appears within a ±80-character window around it.
    """
    info = _AMBIGUOUS_WORDS.get(phrase)
    if not info:
        return False
    start, end = _phrase_span(phrase, text_lower)
    if start == -1:
        return False
    window_start = max(0, start - 80)
    window_end   = min(len(text_lower), end + 80)
    window = text_lower[window_start:window_end]
    return any(n in window for n in info["nullifiers"])


# ───────────────────────────────────────────────────────────────
# Semantic Expansion
# ───────────────────────────────────────────────────────────────
def _semantic_domain_expansion(text: str) -> Dict[str, List[str]]:
    if not _embedder or not _anchor_embeddings:
        return {}
    if _nlp:
        try:
            doc = _nlp(text)
            sentences = [s.text.strip() for s in doc.sents if len(s.text.split()) >= 4]
        except Exception:
            sentences = re.split(r"(?<=[.!?])\s+", text)
    else:
        sentences = re.split(r"(?<=[.!?])\s+", text)
    if not sentences:
        return {}
    try:
        sent_embs = _embedder.encode(sentences, convert_to_numpy=True)
    except Exception:
        return {}
    found: Dict[str, List[str]] = {}
    for cat, anchor_embs in _anchor_embeddings.items():
        for i, sent in enumerate(sentences):
            sims     = util.cos_sim(sent_embs[i:i+1], anchor_embs)[0].numpy()
            best_sim = float(sims.max())
            if best_sim >= SEM_THRESHOLD:
                found.setdefault(cat, []).append(f"semantic:{sent[:60]}")
                break
    return found


# ───────────────────────────────────────────────────────────────
# FIX 5 — Zero-shot arbitration for conflict resolution
# ───────────────────────────────────────────────────────────────
def _zero_shot_classify(text: str, top_k: int = 3) -> List[Tuple[str, float]]:
    """
    Runs zero-shot classification on the first 512 tokens of text.
    Returns [(label, score)] sorted by score descending.
    Maps BART labels back to our category keys.
    """
    if _zero_shot is None:
        return []
    snippet = " ".join(text.split()[:100])
    try:
        result = _zero_shot(snippet, _ZS_LABELS, multi_label=True)
        label_to_cat = {v: k for k, v in _ISSUE_DESCRIPTORS.items()}
        out = []
        for label, score in zip(result["labels"], result["scores"]):
            cat = label_to_cat.get(label)
            if cat and score >= 0.20:
                out.append((cat, float(score)))
        return out[:top_k]
    except Exception as exc:
        log.warning("Zero-shot failed: %s", exc)
        return []


# ───────────────────────────────────────────────────────────────
# 3) Domain Detection  (keyword + context check + semantic)
# ───────────────────────────────────────────────────────────────
def _detect_domains(text: str) -> Dict[str, List[str]]:
    t = text.lower()
    matched: Dict[str, List[str]] = {}

    for phrase, category, _, _, needs_ctx in sorted(
        DOMAIN_REGISTRY, key=lambda x: len(x[0]), reverse=True
    ):
        if not _phrase_in_text(phrase, t):
            continue
        # Context check for ambiguous words
        if needs_ctx and _is_nullified(phrase, t):
            log.debug("Nullified ambiguous phrase '%s'", phrase)
            continue
        matched.setdefault(category, []).append(phrase)

    # Semantic expansion — fills gaps
    sem_hits = _semantic_domain_expansion(text)
    for cat, phrases in sem_hits.items():
        if cat not in matched:
            matched[cat] = phrases

    return matched


def _domain_priority(domains: Dict[str, List[str]]) -> str:
    order = {p: i for i, p in enumerate(PRIORITY_LEVELS)}
    best  = "low"
    sem_priority_map = {
        "scam": "critical", "fraud": "critical", "legal": "critical",
        "financial": "medium", "account": "high", "technical": "medium",
        "delivery": "low", "product_inquiry": "low",
        "sales_inquiry": "medium", "positive_feedback": "low",
    }
    for phrase, category, priority, _, _ in DOMAIN_REGISTRY:
        if category in domains and phrase in domains.get(category, []):
            if order[priority] > order[best]:
                best = priority
    for cat in domains:
        if any(p.startswith("semantic:") for p in domains[cat]):
            p = sem_priority_map.get(cat, "medium")
            if order[p] > order[best]:
                best = p
    return best


# ── FIX 7 — Sentiment-Domain Consistency Check ───────────────────
def _resolve_domains(
    domains: Dict[str, List[str]],
    sentiment: str,
    customer_text: str,
) -> Dict[str, List[str]]:
    """
    Post-processing pass that removes domains that are inconsistent
    with the detected sentiment and context.

    Rules:
    - positive sentiment + "delivery" only from "order" match
      → check if this is actually positive_feedback or sales_inquiry
    - positive sentiment + "financial" only from "charge" → remove
    - If positive_feedback domain present → remove delivery if no shipment words
    """
    resolved = dict(domains)
    t = customer_text.lower()
    genuine_delivery_signals = [
        "tracking", "shipment", "hasn't arrived", "hasn't updated",
        "where is my order", "delivery status", "my package",
        "not received", "delayed", "lost",
    ]
    genuine_financial_signals = [
        "withdraw", "refund", "payment", "funds", "cash out",
        "capital gains", "fee", "billing", "invoice", "tax",
        "crypto", "transfer money",
    ]

    # If customer sounds positive and the only delivery triggers are "order" or "delivery"
    # without any tracking/shipment context → remove delivery
    if sentiment == "positive" and "delivery" in resolved:
        has_real_delivery = any(sig in t for sig in genuine_delivery_signals)
        if not has_real_delivery:
            log.debug("Removing spurious 'delivery' domain (positive sentiment, no tracking signal)")
            del resolved["delivery"]

    # If charge was the only financial trigger and battery context is present → remove
    if "financial" in resolved:
        triggers = resolved["financial"]
        if all(ph in ("charge",) for ph in triggers):
            if not any(sig in t for sig in genuine_financial_signals):
                log.debug("Removing spurious 'financial' domain (only 'charge', no financial context)")
                del resolved["financial"]

    # If positive_feedback domain is present, it likely overshadows delivery/general
    if "positive_feedback" in resolved and "delivery" in resolved:
        has_real_delivery = any(sig in t for sig in genuine_delivery_signals)
        if not has_real_delivery:
            del resolved["delivery"]

    # Product inquiry overshadows technical when there are no real error signals
    if "product_inquiry" in resolved and "technical" in resolved:
        genuine_technical = [
            "not working", "error", "bug", "crash", "failed", "broken",
            "offline", "malfunction", "install", "setup", "keep getting",
            "nothing seems to work",
        ]
        if not any(sig in t for sig in genuine_technical):
            log.debug("Removing spurious 'technical' domain (product inquiry context)")
            del resolved["technical"]

    return resolved


# ── Multi-label issue types ───────────────────────────────────────
def get_issue_types(
    domains: Dict[str, List[str]],
    zs_results: List[Tuple[str, float]],
    sentiment: str,
) -> List[str]:
    exclude = {"anger"}
    cat_weight: Dict[str, float] = {}

    for phrase, category, _, weight, _ in DOMAIN_REGISTRY:
        if category in exclude:
            continue
        if category in domains and phrase in domains.get(category, []):
            cat_weight[category] = max(cat_weight.get(category, 0), float(weight))

    for cat in domains:
        if cat in exclude or cat in cat_weight:
            continue
        if any(p.startswith("semantic:") for p in domains[cat]):
            cat_weight[cat] = max(cat_weight.get(cat, 0), 5.0)

    for cat, zs_score in zs_results:
        if cat in exclude:
            continue
        zs_weight = float(zs_score) * 10.0
        if cat in cat_weight:
            cat_weight[cat] = max(cat_weight[cat], zs_weight)
        elif zs_score >= 0.35:
            cat_weight[cat] = zs_weight

    if not cat_weight:
        for cat, zs_score in zs_results:
            if cat not in exclude and zs_score >= 0.30:
                return [cat]
        return ["general"]

    return [
        cat for cat, _ in sorted(
            cat_weight.items(), key=lambda x: x[1], reverse=True
        )
    ]


def _primary_category(issue_types: List[str]) -> str:
    return issue_types[0] if issue_types else "general"


# ───────────────────────────────────────────────────────────────
# 4) build_main_issue
# ───────────────────────────────────────────────────────────────
def build_main_issue(
    transcript: str,
    customer_text: str,
    domains: Dict[str, List[str]],
    issue_types: List[str],
    sentiment: str,
) -> str:
    if not transcript:
        return "No transcript content available."

    t_cust  = customer_text.lower()
    primary = _primary_category(issue_types)
    label   = _ISSUE_DESCRIPTORS.get(primary, _ISSUE_DESCRIPTORS["general"])

    if primary == "positive_feedback":
        return (
            "Positive Feedback — Customer contacted support to express satisfaction "
            "with a recent product or service experience. No action required."
        )

    if primary == "product_inquiry":
        # Extract product name if possible
        product = _extract_product_name(customer_text)
        features = _extract_product_features(t_cust)
        feat_str = f" regarding {features}" if features else ""
        return (
            f"{label} — Customer is inquiring about {product}{feat_str}. "
            "Agent should provide accurate product specifications or "
            "direct the customer to the relevant documentation."
        )

    if primary == "sales_inquiry":
        product = _extract_product_name(customer_text)
        return (
            f"{label} — Customer is requesting a quote or placing a purchase order "
            f"for {product}. Agent should provide pricing, availability, "
            "and bulk discount information."
        )

    if primary == "scam":
        triggers = ", ".join(
            p for p in domains.get("scam", [])[:2] if not p.startswith("semantic:")
        ) or "remote access indicators"
        return (
            f"{label} — Indicators of a third-party remote-access or "
            f"social-engineering scam were detected ({triggers}). "
            "Immediate agent verification and customer warning required."
        )

    if primary == "fraud":
        triggers = ", ".join(
            p for p in domains.get("fraud", [])[:2] if not p.startswith("semantic:")
        ) or "fraudulent activity indicators"
        return (
            f"{label} — Customer reports signs of fraudulent activity "
            f"on their account ({triggers}). "
            "Urgent review by the fraud team is required."
        )

    if primary == "legal":
        co_issues = [t for t in issue_types if t not in ("legal", "escalation", "anger")]
        underlying = (
            f"an unresolved {_ISSUE_DESCRIPTORS[co_issues[0]].lower()}"
            if co_issues else "an unresolved issue"
        )
        return (
            f"{label} — Customer has explicitly threatened legal action "
            f"following {underlying}. "
            "Immediate escalation to senior support is required."
        )

    if primary == "financial":
        if any(k in t_cust for k in ("pending withdrawal", "withdrawal", "withdraw", "cash out", "cash-out", "get my money")):
            dur = _extract_duration(t_cust)
            dur_str = f" for {dur}" if dur else ""
            return (
                f"{label} — Customer reports a withdrawal or fund-release request "
                f"that has been pending{dur_str} with no resolution. "
                "Account fund access may be affected."
            )
        if "refund" in t_cust:
            return (
                f"{label} — Customer is requesting a refund that has not "
                "yet been processed or acknowledged."
            )
        if any(k in t_cust for k in ("blocked", "can't access", "cannot access", "frozen")):
            return (
                f"{label} — Customer's account has been restricted, "
                "preventing access to funds. "
                "The reason for the restriction requires urgent clarification."
            )
        if any(k in t_cust for k in ("tax", "fee", "capital gains")):
            return (
                f"{label} — Customer is disputing unexpected charges or "
                "tax deductions that are blocking a financial transaction."
            )
        return (
            f"{label} — Customer is experiencing an issue related to a "
            "financial transaction, balance, or account funds."
        )

    if primary == "account":
        if any(k in t_cust for k in ("blocked", "suspended")):
            return (
                f"{label} — Customer's account has been blocked or suspended "
                "without prior notification, preventing login and access to funds."
            )
        return (
            f"{label} — Customer is unable to access their account and requires "
            "immediate assistance to restore access."
        )

    if primary == "technical":
        product = _extract_product_name(customer_text)
        dur     = _extract_duration(t_cust)
        dur_str = f" for {dur}" if dur else ""
        if any(k in t_cust for k in ("install", "installation", "set up", "setup")):
            return (
                f"{label} — Customer is experiencing installation errors with "
                f"{product}{dur_str}. "
                "They have followed standard troubleshooting steps without success. "
                "Technical escalation is recommended."
            )
        return (
            f"{label} — Customer is unable to complete an action due to "
            "a system error or platform malfunction. "
            "Technical investigation is required."
        )

    if primary == "delivery":
        product  = _extract_product_name(customer_text)
        time_ref = _extract_time_ref(t_cust)
        if any(k in t_cust for k in ("tracking", "hasn't updated", "no update", "not updated")):
            time_str = f" since {time_ref}" if time_ref else ""
            return (
                f"{label} — The tracking status for the customer's "
                f"{product} has not been updated{time_str}. "
                "Customer is requesting a delivery status update and ETA."
            )
        return (
            f"{label} — Customer is requesting a delivery status update "
            f"for their {product}."
        )

    if primary == "escalation":
        if any(k in t_cust for k in ("manager", "supervisor")):
            return (
                f"{label} — Customer is explicitly requesting to speak with "
                "a manager or supervisor due to an unresolved issue."
            )
        return (
            f"{label} — Customer is requesting escalation to a senior "
            "support agent as their issue has not been resolved."
        )

    if sentiment == "positive":
        return (
            "Positive Feedback — Customer contacted support in a positive manner. "
            "No action required."
        )
    if sentiment == "negative":
        return (
            "Customer Concern — Customer has expressed dissatisfaction "
            "with an unspecified issue. Agent review is required."
        )
    return (
        "General Inquiry — Customer has contacted support with a question "
        "or request that requires agent review."
    )


def _extract_product_name(text: str) -> str:
    """Extract a named product (model number, brand + model) if present."""
    # Pattern: word(s) + code (letters + digits or digits + letters)
    match = re.search(
        r"\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z0-9]+){0,3})\b",
        text
    )
    if match:
        candidate = match.group(1)
        # Reject common non-product words
        non_products = {
            "I", "My", "The", "This", "Hello", "Thank", "Please",
            "Can", "Could", "Would", "What", "When", "Where", "How",
        }
        if candidate.split()[0] not in non_products:
            return candidate
    return "the product"

def _extract_product_features(text: str) -> str:
    features = []
    feature_map = {
        "battery life": "battery life",
        "microsd":      "microSD support",
        "btu":          "BTU rating",
        "remote control": "remote control availability",
        "screen size":  "screen size",
        "storage":      "storage capacity",
        "warranty":     "warranty terms",
        "specifications": "product specifications",
    }
    for key, label in feature_map.items():
        if key in text:
            features.append(label)
    return " and ".join(features[:2]) if features else ""

def _extract_duration(text: str) -> str:
    match = re.search(r"(\w+\s+(?:day|days|week|weeks|hour|hours|month|months))", text)
    return match.group(1) if match else ""

def _extract_time_ref(text: str) -> str:
    match = re.search(
        r"(last\s+\w+|since\s+\w+|\w+\s+(?:day|days|week|weeks)\s+ago)", text
    )
    return match.group(1) if match else ""


# ───────────────────────────────────────────────────────────────
# 5) Keyword Extraction — MMR + context-aware polarity
# ───────────────────────────────────────────────────────────────
def _mmr_select(
    doc_emb: np.ndarray,
    cand_embs: np.ndarray,
    candidates: List[str],
    top_k: int,
    diversity: float = 0.5,
) -> List[str]:
    if len(candidates) <= top_k:
        return candidates
    selected_idx: List[int] = []
    candidate_idx = list(range(len(candidates)))
    doc_sims = util.cos_sim(doc_emb.reshape(1, -1), cand_embs)[0].numpy()
    while len(selected_idx) < top_k and candidate_idx:
        if not selected_idx:
            best   = int(np.argmax([doc_sims[i] for i in candidate_idx]))
            chosen = candidate_idx[best]
        else:
            sel_embs = cand_embs[selected_idx]
            scores   = []
            for idx in candidate_idx:
                rel     = float(doc_sims[idx])
                max_sim = float(util.cos_sim(cand_embs[idx:idx+1], sel_embs)[0].max())
                scores.append(diversity * rel - (1 - diversity) * max_sim)
            best   = int(np.argmax(scores))
            chosen = candidate_idx[best]
        selected_idx.append(chosen)
        candidate_idx.remove(chosen)
    return [candidates[i] for i in selected_idx]


def extract_keywords(
    transcript: str,
    domains: Dict[str, List[str]],
    max_kw: int = MAX_KEYWORDS,
    sentiment: str = "neutral",
    issue_types: Optional[List[str]] = None,
) -> Dict:
    empty: Dict = {
        "negative": [], "positive": [], "neutral": [],
        "categories": {}, "top_negative_phrase": "", "top_issue_phrase": "",
        "primary_polarity": sentiment,
        "primary_issue_type": (issue_types[0] if issue_types else "general"),
        "display": [],
    }
    if not transcript:
        return empty

    issue_types = issue_types or []
    t_lower = transcript.lower()
    seen: Set[str] = set()
    pool: List[Tuple[float, str, str]] = []
    domain_keys: Set[str] = set()
    phrase_categories: Dict[str, str] = {}

    categories: Dict[str, List[str]] = {}
    for phrase, category, _, _, needs_ctx in DOMAIN_REGISTRY:
        if _phrase_in_text(phrase, t_lower) and not (needs_ctx and _is_nullified(phrase, t_lower)):
            categories.setdefault(category, []).append(phrase)
    for cat in categories:
        categories[cat] = list(dict.fromkeys(categories[cat]))

    # Layer 1 — Domain phrases (word-boundary matched, context verified)
    for phrase, category, _, weight, needs_ctx in sorted(
        DOMAIN_REGISTRY, key=lambda x: x[3], reverse=True
    ):
        if not _phrase_in_text(phrase, t_lower):
            continue
        if needs_ctx and _is_nullified(phrase, t_lower):
            continue
        key = phrase.lower()
        if key not in seen and _valid_kw(phrase) and not _is_reference_phrase(phrase):
            seen.add(key)
            domain_keys.add(key)
            phrase_categories[key] = category
            w = _domain_weight(weight, category, sentiment)
            pool.append((float(w + 20), phrase, _category_polarity(category)))

    # Layer 2 — Merged adjacent phrases (bigrams/trigrams)
    for phrase in _extract_merged_phrases(transcript):
        key = phrase.lower()
        if key not in seen and _is_analytical_candidate(phrase):
            seen.add(key)
            pool.append((8.0, phrase, "neutral"))

    # Layer 3 — spaCy noun chunks only (no raw entities / single tokens)
    if _nlp:
        try:
            doc = _nlp(transcript)
            for chunk in doc.noun_chunks:
                text = _clean_keyphrase(chunk.text.strip())
                key  = text.lower()
                if (
                    key not in seen
                    and len(text.split()) >= 2
                    and _valid_keyphrase(text)
                    and not _is_time_phrase(text)
                    and not _is_reference_phrase(text)
                    and _is_analytical_candidate(text)
                ):
                    seen.add(key)
                    pool.append((6.0, text, "neutral"))
        except Exception as exc:
            log.warning("spaCy keyword pass failed: %s", exc)

    if not pool:
        neu = []
        for items in categories.values():
            for text in items:
                if _valid_kw(text) and len(neu) < max_kw:
                    neu.append(text)
        result = _finalize_keyword_buckets(
            [(10.0, t, "neutral") for t in neu],
            phrase_categories,
            transcript,
            categories,
            domain_keys,
            sentiment,
            issue_types,
            max_kw,
        )
        return result

    # Layer 6 — MMR diversity selection
    mmr_limit = max_kw * 3
    if _embedder and len(pool) > mmr_limit:
        try:
            candidates = [text for _, text, _ in pool]
            pol_map    = {text: pol for _, text, pol in pool}
            weight_map = {text: w for w, text, _ in pool}
            doc_emb    = _embedder.encode(transcript, convert_to_numpy=True)
            cand_embs  = _embedder.encode(candidates, convert_to_numpy=True)
            selected   = _mmr_select(doc_emb, cand_embs, candidates, mmr_limit)
            pool = [
                (weight_map.get(text, 5.0), text, pol_map.get(text, "neutral"))
                for text in selected
            ]
        except Exception as exc:
            log.warning("MMR failed: %s", exc)
            pool.sort(key=lambda x: x[0], reverse=True)
    else:
        pool.sort(key=lambda x: x[0], reverse=True)

    return _finalize_keyword_buckets(
        pool,
        phrase_categories,
        transcript,
        categories,
        domain_keys,
        sentiment,
        issue_types,
        max_kw,
    )

def _find_top_phrases(transcript: str) -> Tuple[str, str]:
    if not _nlp or not transcript:
        return "", ""
    try:
        doc = _nlp(transcript)
        sentences = [s.text.strip() for s in doc.sents if len(s.text.split()) >= 4]
    except Exception:
        sentences = re.split(r"(?<=[.!?])\s+", transcript)
    issue_triggers = [
        "withdraw", "payment", "delay", "refund", "problem", "issue",
        "tracking", "pending", "blocked", "error", "failed", "can't",
        "cash out", "frozen", "stuck", "install", "not working",
    ]
    top_neg, top_neg_sc   = "", -1.0
    top_issue, top_iss_sc = "", -1.0
    for sent in sentences:
        _, score, _ = analyze_sentiment(sent)
        if score < -0.3 and abs(score) > top_neg_sc:
            top_neg_sc = abs(score)
            top_neg    = sent.strip()
        sl = sent.lower()
        if any(k in sl for k in issue_triggers) and abs(score) > top_iss_sc:
            top_iss_sc = abs(score)
            top_issue  = sent.strip()
    return top_neg, top_issue


# ───────────────────────────────────────────────────────────────
# 6) Priority — Intent-Driven
# ───────────────────────────────────────────────────────────────
def infer_priority(
    sentiment: str,
    transcript: str,
    domains: Dict[str, List[str]],
    issue_types: List[str],
) -> str:
    base  = _domain_priority(domains)
    t     = transcript.lower()
    order = {p: i for i, p in enumerate(PRIORITY_LEVELS)}

    # Positive-only interactions are always low
    if issue_types == ["positive_feedback"] or (
        "positive_feedback" in issue_types and sentiment == "positive"
        and not any(d in issue_types for d in ("financial","legal","scam","fraud","account"))
    ):
        return "low"

    # Product/sales inquiries are low-medium
    if set(issue_types) <= {"product_inquiry", "sales_inquiry", "general"}:
        return "medium" if "sales_inquiry" in issue_types else "low"

    critical_phrases = [
        "legal action", "lawyer", "fraud", "stolen", "unauthorized",
        "police", "anydesk", "scam", "identity theft", "i will sue",
    ]
    high_phrases = [
        "manager", "supervisor", "unacceptable", "furious",
        "every time i call", "nothing gets fixed", "fourth time",
        "i want a manager", "tired of dealing", "really tired",
        "three hours", "past three", "cannot figure",
    ]

    if any(p in t for p in critical_phrases):
        base = "critical" if order["critical"] > order[base] else base
    elif any(p in t for p in high_phrases):
        base = "high" if order["high"] > order[base] else base
    elif sentiment == "negative" and base == "low":
        base = "medium"

    # Frustrated customer + technical = upgrade to high
    if "technical" in issue_types and sentiment == "negative" and base == "medium":
        base = "high"

    return base


# ───────────────────────────────────────────────────────────────
# 7) Follow-up
# ───────────────────────────────────────────────────────────────
def _ends_with_question(text: str) -> bool:
    if text.strip().endswith("?"):
        return True
    tail = text[-200:].lower()
    return any(q in tail for q in [
        "can you", "could you", "would you", "what about",
        "how can i", "when will", "why is", "is it", "are you",
        "do you", "should i", "can we", "can someone",
    ])

def infer_followup(
    sentiment: str,
    priority: str,
    transcript: str,
    domains: Dict[str, List[str]],
    issue_types: List[str],
) -> bool:
    # Positive feedback or informational product/sales inquiries → no follow-up
    if issue_types == ["positive_feedback"]:
        return False
    if set(issue_types) <= {"product_inquiry", "sales_inquiry", "general"} and sentiment == "positive":
        return False
    t = transcript.lower()
    triggers = [
        "call me back", "call back", "follow up", "not resolved",
        "still not", "waiting", "no response", "manager", "escalate",
        "every time i call", "fourth time", "nothing gets fixed",
        "still waiting", "can someone", "please assist",
    ]
    if any(w in t for w in triggers):                        return True
    if _ends_with_question(transcript):                      return True
    if priority in {"high", "critical"}:                     return True
    if sentiment == "negative":                              return True
    if any(c in domains for c in ("scam","fraud","legal")):  return True
    return False


# ───────────────────────────────────────────────────────────────
# 8) Confidence Score
# ───────────────────────────────────────────────────────────────
def compute_confidence(
    roberta_prob: float,
    domains: Dict[str, List[str]],
    transcript: str,
    issue_types: List[str],
    zs_results: List[Tuple[str, float]],
) -> float:
    model_comp = roberta_prob

    max_weight = 0
    for phrase, category, _, weight, _ in DOMAIN_REGISTRY:
        if category in domains and phrase in domains.get(category, []):
            max_weight = max(max_weight, weight)
    for cat in domains:
        if any(p.startswith("semantic:") for p in domains[cat]):
            max_weight = max(max_weight, 6)
    domain_comp = min(max_weight / 10.0, 1.0)

    specific_types = [t for t in issue_types if t not in ("general", "anger")]
    specificity_comp = min(len(specific_types) / 3.0, 1.0)

    # Zero-shot confirmation bonus
    zs_bonus = 0.0
    primary  = _primary_category(issue_types)
    for cat, score in zs_results:
        if cat == primary and score >= 0.40:
            zs_bonus = 0.10
            break

    confidence = (
        0.35 * model_comp +
        0.35 * domain_comp +
        0.20 * specificity_comp +
        0.10 * (1.0 if zs_bonus else 0.0) + zs_bonus
    )
    word_count = len(transcript.split())
    if word_count < 10:   confidence -= 0.15
    elif word_count > 150: confidence += 0.05
    return round(max(min(confidence, 1.0), 0.0), 3)


# ───────────────────────────────────────────────────────────────
# 9) Summary
# ───────────────────────────────────────────────────────────────
def generate_summary(
    main_issue: str,
    sentiment: str,
    priority: str,
    needs_followup: bool,
    issue_types: List[str],
) -> str:
    tone_map = {
        "positive": "cooperative and satisfied",
        "neutral":  "calm and informational",
        "negative": "frustrated and dissatisfied",
    }
    tone        = tone_map.get(sentiment, "neutral")
    issue_label = main_issue.split("—")[0].strip() if "—" in main_issue else main_issue[:60]
    pri_note    = f" Priority level: {priority.upper()}." if priority in {"high","critical"} else ""
    fu_note     = " Immediate follow-up is recommended." if needs_followup else ""
    multi_note  = (
        f" Co-occurring issues: {', '.join(issue_types[1:])}."
        if len(issue_types) > 1 else ""
    )
    return (
        f"The customer contacted support regarding: {issue_label}. "
        f"The overall tone of the conversation was {tone}."
        f"{pri_note}{multi_note}{fu_note}"
    )


# ───────────────────────────────────────────────────────────────
# 10) Main Entrypoint
# ───────────────────────────────────────────────────────────────
def analyze_call_nlp(data: dict) -> dict:
    """
    Full NLP pipeline v8 — Contextual Intelligence Edition.

    Output fields
    ─────────────
    main_issue        str    Professional CRM-ready description
    summary           str    Dashboard card sentence
    sentiment         str    positive | neutral | negative
    sentiment_score   float  Signed [-1.0, 1.0]
    keywords          dict   neg/pos/neu + categories + top phrases
    issue_type        str    Primary category key
    issue_types       list   All detected categories (multi-label)
    priority          str    low | medium | high | critical
    needs_followup    bool
    transcript        str    Full cleaned text
    customer_text     str    Customer-only speech
    confidence_score  float  [0.0, 1.0]
    detected_language str
    model_used        str
    """
    transcript    = extract_transcript(data)
    customer_text = get_customer_text(data)

    # Sentiment on customer text only
    sentiment, score, roberta_prob = analyze_sentiment(customer_text or transcript)

    # Domain detection with contextual disambiguation
    raw_domains = _detect_domains(transcript)

    # Consistency check: remove domains that contradict sentiment/context
    domains = _resolve_domains(raw_domains, sentiment, customer_text)

    # Zero-shot for conflict resolution and gap-filling
    zs_results = _zero_shot_classify(customer_text or transcript)

    issue_types = get_issue_types(domains, zs_results, sentiment)
    main_issue  = build_main_issue(transcript, customer_text, domains, issue_types, sentiment)
    kw_source   = customer_text or transcript
    keywords    = extract_keywords(
        kw_source, domains, sentiment=sentiment, issue_types=issue_types,
    )
    priority    = infer_priority(sentiment, transcript, domains, issue_types)
    needs_fu    = infer_followup(sentiment, priority, transcript, domains, issue_types)
    confidence  = compute_confidence(roberta_prob, domains, transcript, issue_types, zs_results)
    language    = _safe_get_language(data)
    summary     = generate_summary(main_issue, sentiment, priority, needs_fu, issue_types)

    return {
        "main_issue":        main_issue,
        "summary":           summary,
        "sentiment":         sentiment,
        "sentiment_score":   round(float(score), 4),
        "keywords":          keywords,
        "issue_type":        _primary_category(issue_types),
        "issue_types":       issue_types,
        "priority":          priority,
        "needs_followup":    needs_fu,
        "transcript":        transcript,
        "customer_text":     customer_text,
        "confidence_score":  confidence,
        "detected_language": language,
        "model_used":        "hybrid_optimized_v8.4",
    }