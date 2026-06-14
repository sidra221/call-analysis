# ================================================================
#   Call Analytics NLP Pipeline v7 — Maximum Accuracy Edition
#
#   Improvements over v6:
#   1. Semantic synonym expansion  (catches cash-out, get my money out)
#   2. Multi-label issue_types     (account + financial + legal together)
#   3. Strict MMR keyword filter   (kills "One", "today", time phrases)
#   4. Smart speaker identification (complaint-signal, not word count)
#   5. True model confidence score (RoBERTa prob × domain weight)
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
log = logging.getLogger("call_nlp_v7")

# ───────────────────────────────────────────────────────────────
# Constants
# ───────────────────────────────────────────────────────────────
PRIORITY_LEVELS = ["low", "medium", "high", "critical"]
MAX_KEYWORDS    = 12
CHUNK_WORDS     = 180
OVERLAP_WORDS   = 40

# ── IMPROVEMENT 1 ───────────────────────────────────────────────
# Semantic anchor phrases per category.
# If any phrase in the transcript is semantically close to an anchor
# (cosine ≥ SEM_THRESHOLD), that category is triggered even without
# an exact keyword match.
SEM_THRESHOLD = 0.72

SEMANTIC_ANCHORS: Dict[str, List[str]] = {
    "financial": [
        "I cannot get my money out",
        "cash out my account",
        "get my funds",
        "release my balance",
        "move money",
        "the transaction is stuck",
        "money is not moving",
        "my balance is frozen",
        "pull out my investment",
        "liquidate my position",
    ],
    "account": [
        "I cannot log in",
        "locked out of my account",
        "my profile is disabled",
        "access denied",
        "cannot reach my account",
    ],
    "technical": [
        "the app keeps crashing",
        "the platform is down",
        "I keep getting an error",
        "the system is not responding",
        "something is wrong with the website",
    ],
    "delivery": [
        "my parcel has not arrived",
        "no update on my shipment",
        "I have not received my item",
        "where is my order",
        "the courier has not delivered",
    ],
    "legal": [
        "I will take this to court",
        "I am going to report this",
        "I will get my attorney involved",
        "I am filing a complaint",
    ],
    "scam": [
        "they asked me to install an app",
        "someone asked for my screen",
        "they want remote control",
        "they sent me a QR code to scan",
    ],
}

# ── Domain Registry ─────────────────────────────────────────────
DOMAIN_REGISTRY: List[Tuple[str, str, str, int]] = [
    ("anydesk",             "scam",       "critical", 10),
    ("remote access",       "scam",       "critical", 10),
    ("share screen",        "scam",       "critical", 10),
    ("share your screen",   "scam",       "critical", 10),
    ("control your device", "scam",       "critical", 10),
    ("verification app",    "scam",       "critical",  9),
    ("install this app",    "scam",       "critical",  9),
    ("qr code",             "scam",       "critical",  8),
    ("fraud",               "fraud",      "critical", 10),
    ("unauthorized",        "fraud",      "critical",  9),
    ("stolen",              "fraud",      "critical",  9),
    ("hacked",              "fraud",      "critical",  9),
    ("identity theft",      "fraud",      "critical", 10),
    ("legal action",        "legal",      "critical",  9),
    ("lawyer",              "legal",      "critical",  8),
    ("attorney",            "legal",      "critical",  8),
    ("police",              "legal",      "critical",  8),
    ("sue",                 "legal",      "critical",  7),
    ("lawsuit",             "legal",      "critical",  9),
    ("court",               "legal",      "critical",  7),
    ("withdraw",            "financial",  "medium",    7),
    ("withdrawal",          "financial",  "medium",    7),
    ("pending withdrawal",  "financial",  "high",      9),
    ("refund",              "financial",  "medium",    7),
    ("payment",             "financial",  "medium",    6),
    ("transfer",            "financial",  "medium",    6),
    ("bank",                "financial",  "medium",    5),
    ("crypto",              "financial",  "medium",    6),
    ("fee",                 "financial",  "medium",    5),
    ("tax",                 "financial",  "medium",    5),
    ("invoice",             "financial",  "medium",    5),
    ("billing",             "financial",  "medium",    5),
    ("charge",              "financial",  "medium",    5),
    ("funds",               "financial",  "medium",    6),
    ("capital gains",       "financial",  "medium",    6),
    ("cash out",            "financial",  "medium",    8),
    ("cash-out",            "financial",  "medium",    8),
    ("get my money",        "financial",  "medium",    8),
    ("my money is",         "financial",  "medium",    7),
    ("blocked my account",  "account",    "high",      9),
    ("account blocked",     "account",    "high",      8),
    ("account suspended",   "account",    "high",      8),
    ("locked out",          "account",    "high",      7),
    ("cannot login",        "account",    "high",      8),
    ("can't login",         "account",    "high",      8),
    ("not working",         "technical",  "medium",    7),
    ("error",               "technical",  "medium",    6),
    ("bug",                 "technical",  "medium",    6),
    ("failed",              "technical",  "medium",    6),
    ("crash",               "technical",  "medium",    6),
    ("broken",              "technical",  "medium",    5),
    ("offline",             "technical",  "medium",    5),
    ("pending",             "technical",  "medium",    6),
    ("delivery",            "delivery",   "low",       5),
    ("shipment",            "delivery",   "low",       5),
    ("tracking",            "delivery",   "low",       4),
    ("package",             "delivery",   "low",       4),
    ("order",               "delivery",   "low",       3),
    ("hasn't updated",      "delivery",   "medium",    7),
    ("no update",           "delivery",   "medium",    6),
    ("manager",             "escalation", "high",      7),
    ("supervisor",          "escalation", "high",      7),
    ("escalate",            "escalation", "high",      7),
    ("complaint",           "escalation", "high",      6),
    ("not resolved",        "escalation", "high",      7),
    ("still waiting",       "escalation", "high",      6),
    ("no response",         "escalation", "high",      6),
    ("call me back",        "escalation", "high",      6),
    ("every time i call",   "escalation", "high",      8),
    ("fourth time",         "escalation", "high",      7),
    ("nothing gets fixed",  "escalation", "high",      8),
    ("angry",               "anger",      "high",      6),
    ("furious",             "anger",      "high",      7),
    ("terrible",            "anger",      "high",      5),
    ("unacceptable",        "anger",      "high",      6),
    ("ridiculous",          "anger",      "high",      5),
    ("outrageous",          "anger",      "high",      6),
    ("thank you",           "satisfaction", "low",     3),
    ("appreciate",          "satisfaction", "low",     3),
    ("helpful",             "satisfaction", "low",     3),
    ("very helpful",        "satisfaction", "low",     4),
    ("resolved",            "satisfaction", "low",     4),
]

# ── Keyword stopwords ────────────────────────────────────────────
# IMPROVEMENT 3: expanded to kill time expressions and filler words
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
}

# Time/date patterns — strip these from keyword candidates
_TIME_PATTERN = re.compile(
    r"\b(\d+\s*(days?|weeks?|hours?|months?)|"
    r"(last|this|next)\s+\w+|"
    r"(monday|tuesday|wednesday|thursday|friday|saturday|sunday)|"
    r"\d+\s*(am|pm)|"
    r"(today|yesterday|tomorrow))\b",
    re.IGNORECASE,
)

# Issue descriptors
_ISSUE_DESCRIPTORS: Dict[str, str] = {
    "scam":       "Potential Scam / Remote Access Attempt",
    "fraud":      "Suspected Fraudulent Activity",
    "legal":      "Legal Threat",
    "financial":  "Financial / Payment Issue",
    "account":    "Account Access Issue",
    "technical":  "Technical Issue",
    "delivery":   "Delivery / Shipment Issue",
    "escalation": "Escalation Request",
    "anger":      "Customer Dissatisfaction",
    "general":    "General Inquiry",
}

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

log.info("⏳ Loading sentence embedder …")
try:
    _embedder = SentenceTransformer(
        "sentence-transformers/all-MiniLM-L6-v2", device="cpu"
    )
    # Pre-encode all semantic anchors once at startup
    _anchor_embeddings: Dict[str, np.ndarray] = {
        cat: _embedder.encode(phrases, convert_to_numpy=True)
        for cat, phrases in SEMANTIC_ANCHORS.items()
    }
    log.info("Semantic anchors encoded.")
except Exception as exc:
    log.warning("Embedder failed (%s) — semantic expansion disabled.", exc)
    _embedder = None
    _anchor_embeddings = {}

log.info("✅ All models loaded.")


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

def _valid_kw(text: str) -> bool:
    t = text.lower().strip()
    if len(t) < 3:                  return False
    if t in _KW_STOPWORDS:          return False
    if _is_time_phrase(t):          return False
    if all(c in ".,!?;:-" for c in t): return False
    if re.fullmatch(r"\d+", t):     return False   # pure numbers
    return True


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


# ───────────────────────────────────────────────────────────────
# IMPROVEMENT 4 — Smart Speaker Identification
# ───────────────────────────────────────────────────────────────
_COMPLAINT_SIGNALS = [
    "withdraw", "withdrawal", "refund", "blocked", "can't", "cannot",
    "not working", "error", "pending", "lawyer", "legal action",
    "angry", "furious", "unacceptable", "ridiculous", "terrible",
    "manager", "supervisor", "escalate", "every time", "not resolved",
    "still waiting", "nothing gets fixed", "my money", "my account",
    "cash out", "fraud", "stolen", "hacked", "tracking", "delivery",
    "not received", "hasn't arrived",
]

def _complaint_score(texts: List[str]) -> float:
    """Count complaint signals in a list of sentences."""
    joined = " ".join(texts).lower()
    return sum(1 for sig in _COMPLAINT_SIGNALS if sig in joined)

def get_customer_text(data: dict) -> str:
    """
    Identify the customer speaker using complaint-signal density,
    not raw word count. Falls back to full transcript if no diarization.

    Logic:
    1. If only one speaker exists → that is the customer.
    2. Score each speaker by how many complaint signals appear in
       their utterances.
    3. The speaker with the highest complaint score is the customer.
    4. Tie-break: the speaker who speaks FIRST (earliest start time).
    """
    speakers: Dict[str, List[str]] = {}
    speaker_start: Dict[str, float] = {}

    for seg in data.get("segments", []):
        spk = seg.get("speaker", "")
        txt = seg.get("text", "").strip()
        start = float(seg.get("start", 0))
        if spk and txt:
            if spk not in speaker_start:
                speaker_start[spk] = start
            speakers.setdefault(spk, []).append(txt)

    if not speakers:
        return extract_transcript(data)

    if len(speakers) == 1:
        only = list(speakers.keys())[0]
        return _clean(" ".join(speakers[only]))

    # Score by complaint density
    scores = {spk: _complaint_score(texts) for spk, texts in speakers.items()}
    max_score = max(scores.values())

    # Among tied speakers, pick earliest start
    candidates = [spk for spk, sc in scores.items() if sc == max_score]
    customer = min(candidates, key=lambda s: speaker_start.get(s, 0))

    return _clean(" ".join(speakers[customer]))


# ───────────────────────────────────────────────────────────────
# 2) Sentiment Analysis
# ───────────────────────────────────────────────────────────────
_NEUTRAL_OVERRIDES = [
    "i'm not angry", "i am not angry", "not upset", "not frustrated",
    "not angry", "just need to know", "just want to know", "i'm calm",
]
_VADER_POS_BOOST = [
    "thank you", "thanks", "appreciate", "helpful", "great",
    "perfect", "excellent", "i'm happy", "i'm satisfied",
    "resolved", "sorted out",
]
_VADER_NEG_BOOST = [
    "angry", "furious", "unacceptable", "ridiculous", "terrible",
    "worst", "useless", "lawyer", "legal action", "i want a manager",
    "holding my money", "every time i call", "nothing gets fixed",
]

def _vader_sentiment(text: str) -> Tuple[str, float]:
    compound = _vader.polarity_scores(text)["compound"]
    t = text.lower()
    if any(p in t for p in _VADER_POS_BOOST):   compound = min(compound + 0.30, 1.0)
    if any(n in t for n in _VADER_NEG_BOOST):   compound = max(compound - 0.40, -1.0)
    if any(o in t for o in _NEUTRAL_OVERRIDES): compound = min(compound + 0.25, 1.0)
    compound = round(compound, 4)
    if compound >= 0.25:   return "positive", compound
    if compound <= -0.25:  return "negative", compound
    return "neutral", compound

def _roberta_sentiment(text: str) -> Tuple[Optional[str], float, float]:
    """Returns (label, signed_score, raw_probability)."""
    if _roberta is None:
        return None, 0.0, 0.0
    buckets: Dict[str, float] = {"positive": 0.0, "neutral": 0.0, "negative": 0.0}
    total_w = 0.0
    for chunk in _chunk(text):
        try:
            res = _roberta(chunk)[0]
            label = _map_roberta_label(res["label"])
            conf = float(res["score"])
            w = len(chunk.split())
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
    signed = best_prob if best_label == "positive" else (
             -best_prob if best_label == "negative" else 0.0)
    return best_label, round(signed, 4), round(best_prob, 4)

def analyze_sentiment(text: str) -> Tuple[str, float, float]:
    """Returns (label, signed_score, raw_probability_for_confidence)."""
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
# IMPROVEMENT 1 — Semantic Synonym Expansion
# ───────────────────────────────────────────────────────────────
def _semantic_domain_expansion(text: str) -> Dict[str, List[str]]:
    """
    For each sentence in the transcript, check cosine similarity
    against pre-encoded anchor phrases per category.
    If similarity ≥ SEM_THRESHOLD, add the category as a semantic hit.
    Returns { category: ["semantic match: <sentence>"] }
    """
    if not _embedder or not _anchor_embeddings:
        return {}

    # Work sentence-by-sentence for precision
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
            sims = util.cos_sim(
                sent_embs[i:i+1], anchor_embs
            )[0].numpy()
            best_sim = float(sims.max())
            if best_sim >= SEM_THRESHOLD:
                found.setdefault(cat, []).append(
                    f"semantic:{sent[:60]}"
                )
                break   # one match per sentence per category is enough

    return found


# ───────────────────────────────────────────────────────────────
# 3) Domain Detection  (keyword + semantic expansion)
# ───────────────────────────────────────────────────────────────
def _detect_domains(text: str) -> Dict[str, List[str]]:
    t = text.lower()
    matched: Dict[str, List[str]] = {}

    # Keyword matches
    for phrase, category, _, _ in sorted(
        DOMAIN_REGISTRY, key=lambda x: len(x[0]), reverse=True
    ):
        if phrase in t:
            matched.setdefault(category, []).append(phrase)

    # Semantic expansion — fills gaps keyword matching misses
    sem_hits = _semantic_domain_expansion(text)
    for cat, phrases in sem_hits.items():
        if cat not in matched:          # only add if keyword didn't already catch it
            matched[cat] = phrases

    return matched


def _domain_priority(domains: Dict[str, List[str]]) -> str:
    order = {p: i for i, p in enumerate(PRIORITY_LEVELS)}
    best = "low"
    for phrase, category, priority, _ in DOMAIN_REGISTRY:
        if category in domains and any(
            phrase == p or p.startswith("semantic:") for p in domains[category]
        ):
            if order[priority] > order[best]:
                best = priority
    # Also check semantic-only categories
    sem_priority_map = {
        "scam": "critical", "fraud": "critical", "legal": "critical",
        "financial": "medium", "account": "high", "technical": "medium",
        "delivery": "low",
    }
    for cat in domains:
        if any(p.startswith("semantic:") for p in domains[cat]):
            p = sem_priority_map.get(cat, "medium")
            if order[p] > order[best]:
                best = p
    return best


# ── IMPROVEMENT 2 — Multi-label issue_types ──────────────────────
def get_issue_types(domains: Dict[str, List[str]]) -> List[str]:
    """
    Returns ALL relevant issue types sorted by priority (critical first).
    Excludes meta-categories that aren't customer issues.
    """
    exclude = {"anger", "satisfaction"}
    priority_order = {p: i for i, p in enumerate(PRIORITY_LEVELS)}

    # Build (priority_value, category) pairs
    cat_priority: Dict[str, int] = {}
    for phrase, category, priority, _ in DOMAIN_REGISTRY:
        if category in domains and category not in exclude:
            pv = priority_order[priority]
            cat_priority[category] = max(cat_priority.get(category, 0), pv)

    # Also include semantic-only categories
    sem_priority_map = {
        "scam": 3, "fraud": 3, "legal": 3,
        "financial": 1, "account": 2, "technical": 1, "delivery": 0,
    }
    for cat in domains:
        if cat not in exclude and cat not in cat_priority:
            if any(p.startswith("semantic:") for p in domains[cat]):
                cat_priority[cat] = sem_priority_map.get(cat, 1)

    if not cat_priority:
        return ["general"]

    return [
        cat for cat, _ in sorted(
            cat_priority.items(), key=lambda x: x[1], reverse=True
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

    t_cust   = customer_text.lower()
    primary  = _primary_category(issue_types)
    label    = _ISSUE_DESCRIPTORS.get(primary, _ISSUE_DESCRIPTORS["general"])

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
        if any(k in t_cust for k in ("tax", "fee", "capital gains", "charge")):
            return (
                f"{label} — Customer is disputing unexpected charges or "
                "tax deductions that are blocking a financial transaction."
            )
        if "payment" in t_cust:
            return (
                f"{label} — Customer is experiencing a failure or delay "
                "in processing a payment."
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
        if "pending" in t_cust:
            return (
                f"{label} — A transaction or request submitted by the customer "
                "has been pending for an extended period without progressing."
            )
        return (
            f"{label} — Customer is unable to complete an action due to "
            "a system error or platform malfunction. "
            "Technical investigation is required."
        )

    if primary == "delivery":
        product  = _extract_product(t_cust)
        time_ref = _extract_time_ref(t_cust)
        if any(k in t_cust for k in ("tracking", "hasn't updated", "no update", "not updated")):
            time_str = f" since {time_ref}" if time_ref else ""
            return (
                f"{label} — The tracking status for the customer's "
                f"{product} has not been updated{time_str}. "
                "Customer is requesting a delivery status update and ETA."
            )
        if any(k in t_cust for k in ("lost", "missing")):
            return (
                f"{label} — Customer believes their {product} may be "
                "lost or missing. Courier investigation is recommended."
            )
        return (
            f"{label} — Customer is requesting an update on the status "
            f"of their {product} delivery."
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

    if "satisfaction" in domains:
        return (
            "Positive Feedback — Customer expressed satisfaction "
            "with the support received. No action required."
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


def _extract_duration(text: str) -> str:
    match = re.search(r"(\w+\s+(?:day|days|week|weeks|hour|hours|month|months))", text)
    return match.group(1) if match else ""

def _extract_time_ref(text: str) -> str:
    match = re.search(
        r"(last\s+\w+|since\s+\w+|\w+\s+(?:day|days|week|weeks)\s+ago)", text
    )
    return match.group(1) if match else ""

def _extract_product(text: str) -> str:
    match = re.search(
        r"\b(laptop|phone|tablet|parcel|package|item|product|order|"
        r"headphones|watch|keyboard|monitor|charger)\b",
        text,
    )
    return match.group(1) if match else "shipment"


# ───────────────────────────────────────────────────────────────
# IMPROVEMENT 3 — Strict MMR Keyword Extraction
# ───────────────────────────────────────────────────────────────
def _mmr_select(
    doc_embedding: np.ndarray,
    candidate_embeddings: np.ndarray,
    candidates: List[str],
    top_k: int,
    diversity: float = 0.5,
) -> List[str]:
    """
    Maximal Marginal Relevance selection.
    diversity=0.5 balances relevance and diversity.
    Filters out near-duplicate keywords.
    """
    if len(candidates) <= top_k:
        return candidates

    selected_idx: List[int] = []
    candidate_idx = list(range(len(candidates)))

    # Relevance: cosine similarity to the document
    doc_sims = util.cos_sim(
        doc_embedding.reshape(1, -1), candidate_embeddings
    )[0].numpy()

    while len(selected_idx) < top_k and candidate_idx:
        if not selected_idx:
            # First pick: most relevant
            best = int(np.argmax([doc_sims[i] for i in candidate_idx]))
            chosen = candidate_idx[best]
        else:
            # MMR score = λ * relevance - (1-λ) * max_similarity_to_selected
            sel_embs = candidate_embeddings[selected_idx]
            scores = []
            for idx in candidate_idx:
                relevance = float(doc_sims[idx])
                max_sim = float(
                    util.cos_sim(
                        candidate_embeddings[idx:idx+1], sel_embs
                    )[0].max()
                )
                mmr = diversity * relevance - (1 - diversity) * max_sim
                scores.append(mmr)
            best = int(np.argmax(scores))
            chosen = candidate_idx[best]

        selected_idx.append(chosen)
        candidate_idx.remove(chosen)

    return [candidates[i] for i in selected_idx]


def extract_keywords(transcript: str, max_kw: int = MAX_KEYWORDS) -> Dict:
    empty: Dict = {
        "negative": [], "positive": [], "neutral": [],
        "categories": {}, "top_negative_phrase": "", "top_issue_phrase": "",
    }
    if not transcript:
        return empty

    t_lower = transcript.lower()
    seen: Set[str] = set()
    pool: List[Tuple[float, str, str]] = []

    # Layer 1 — Domain phrases
    for phrase, category, priority, weight in sorted(
        DOMAIN_REGISTRY, key=lambda x: x[3], reverse=True
    ):
        if phrase in t_lower and not phrase.startswith("semantic:"):
            key = phrase.lower()
            if key not in seen and _valid_kw(phrase):
                seen.add(key)
                polarity = (
                    "negative" if category in {"scam","fraud","legal","anger","escalation"}
                    else "positive" if category == "satisfaction"
                    else "neutral"
                )
                pool.append((weight, phrase, polarity))

    # Layer 2-4 — spaCy NER + noun chunks + POS
    if _nlp:
        try:
            doc = _nlp(transcript)
            for ent in doc.ents:
                text = ent.text.strip()
                key  = text.lower()
                if key not in seen and _valid_kw(text) and not _is_time_phrase(text):
                    seen.add(key)
                    pool.append((9, text, "neutral"))
            for chunk in doc.noun_chunks:
                text = chunk.text.strip()
                key  = text.lower()
                if (key not in seen and len(text.split()) >= 2
                        and _valid_kw(text) and not _is_time_phrase(text)):
                    seen.add(key)
                    pool.append((7, text, "neutral"))
            for token in doc:
                if token.is_stop or token.is_punct or token.is_space:
                    continue
                if token.pos_ not in {"NOUN", "PROPN", "VERB"}:
                    continue
                lemma = token.lemma_.strip()
                key   = lemma.lower()
                if key not in seen and _valid_kw(lemma) and not _is_time_phrase(lemma):
                    seen.add(key)
                    pool.append((5 if token.ent_type_ else 4, lemma, "neutral"))
        except Exception as exc:
            log.warning("spaCy keyword pass failed: %s", exc)

    if not pool:
        return empty

    # Layer 5 — MMR re-ranking (replaces plain semantic re-rank)
    if _embedder and len(pool) > max_kw:
        try:
            candidates = [text for _, text, _ in pool]
            polarities = [pol  for _, _, pol  in pool]
            doc_emb    = _embedder.encode(transcript, convert_to_numpy=True)
            cand_embs  = _embedder.encode(candidates, convert_to_numpy=True)

            selected = _mmr_select(doc_emb, cand_embs, candidates, max_kw * 2)
            # Rebuild pool with original polarity preserved
            pol_map = {text: pol for _, text, pol in pool}
            pool = [(10, text, pol_map.get(text, "neutral")) for text in selected]
        except Exception as exc:
            log.warning("MMR failed: %s", exc)
            pool.sort(key=lambda x: x[0], reverse=True)
    else:
        pool.sort(key=lambda x: x[0], reverse=True)

    # Split into neg/pos/neu buckets
    neg, pos, neu = [], [], []
    for _, text, polarity in pool:
        if polarity == "negative" and len(neg) < max_kw:   neg.append(text)
        elif polarity == "positive" and len(pos) < max_kw: pos.append(text)
        elif polarity == "neutral" and len(neu) < max_kw:  neu.append(text)

    # Categories map
    categories: Dict[str, List[str]] = {}
    for phrase, category, _, _ in DOMAIN_REGISTRY:
        if phrase in t_lower:
            categories.setdefault(category, []).append(phrase)
    for cat in categories:
        categories[cat] = list(dict.fromkeys(categories[cat]))

    top_neg, top_issue = _find_top_phrases(transcript)

    return {
        "negative":            neg,
        "positive":            pos,
        "neutral":             neu,
        "categories":          {k: v for k, v in categories.items() if v},
        "top_negative_phrase": top_neg,
        "top_issue_phrase":    top_issue,
    }


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
        "cash out", "frozen", "stuck",
    ]
    top_neg, top_neg_sc  = "", -1.0
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


def flatten_keywords(raw_keywords) -> List[str]:
    """Return a flat deduplicated list for backward-compatible API consumers."""
    if isinstance(raw_keywords, list):
        return list(dict.fromkeys(
            k.strip() for k in raw_keywords if isinstance(k, str) and k.strip()
        ))

    if not isinstance(raw_keywords, dict):
        return []

    merged: List[str] = []
    for bucket in ("negative", "positive", "neutral"):
        for item in raw_keywords.get(bucket, []) or []:
            if isinstance(item, str) and item.strip():
                merged.append(item.strip())

    return list(dict.fromkeys(merged))


# ───────────────────────────────────────────────────────────────
# 5) Priority
# ───────────────────────────────────────────────────────────────
def infer_priority(
    sentiment: str,
    transcript: str,
    domains: Dict[str, List[str]],
) -> str:
    base  = _domain_priority(domains)
    t     = transcript.lower()
    order = {p: i for i, p in enumerate(PRIORITY_LEVELS)}

    critical_phrases = [
        "legal action", "lawyer", "fraud", "stolen", "unauthorized",
        "police", "anydesk", "scam", "identity theft", "i will sue",
    ]
    high_phrases = [
        "manager", "supervisor", "unacceptable", "furious",
        "every time i call", "nothing gets fixed", "fourth time",
        "i want a manager",
    ]

    if any(p in t for p in critical_phrases):
        base = "critical" if order["critical"] > order[base] else base
    elif any(p in t for p in high_phrases):
        base = "high" if order["high"] > order[base] else base
    elif sentiment == "negative" and base == "low":
        base = "medium"

    return base


# ───────────────────────────────────────────────────────────────
# 6) Follow-up
# ───────────────────────────────────────────────────────────────
def _ends_with_question(text: str) -> bool:
    if text.strip().endswith("?"):
        return True
    tail = text[-200:].lower()
    return any(q in tail for q in [
        "can you", "could you", "would you", "what about",
        "how can i", "when will", "why is", "is it", "are you",
        "do you", "should i", "can we",
    ])

def infer_followup(
    sentiment: str,
    priority: str,
    transcript: str,
    domains: Dict[str, List[str]],
) -> bool:
    t = transcript.lower()
    triggers = [
        "call me back", "call back", "follow up", "not resolved",
        "still not", "waiting", "no response", "manager", "escalate",
        "every time i call", "fourth time", "nothing gets fixed",
        "still waiting",
    ]
    if any(w in t for w in triggers):                       return True
    if _ends_with_question(transcript):                     return True
    if priority in {"high", "critical"}:                    return True
    if sentiment == "negative":                             return True
    if any(c in domains for c in ("scam","fraud","legal")): return True
    return False


# ───────────────────────────────────────────────────────────────
# IMPROVEMENT 5 — True Confidence Score
# ───────────────────────────────────────────────────────────────
def compute_confidence(
    roberta_prob: float,
    domains: Dict[str, List[str]],
    priority: str,
    transcript: str,
    issue_types: List[str],
) -> float:
    """
    True confidence built from three independent signals:

    1. Model probability   — RoBERTa raw softmax output (0-1)
    2. Domain signal strength — max weight of matched domain phrases
    3. Issue specificity   — general vs specific issue type

    Each component is normalized to [0, 1] and weighted.
    """
    # Component 1: Model probability (weight 40%)
    model_comp = roberta_prob  # already [0,1]

    # Component 2: Domain signal strength (weight 40%)
    # Max weight found across all matched phrases
    max_weight = 0
    for phrase, category, _, weight in DOMAIN_REGISTRY:
        if category in domains:
            for matched_phrase in domains[category]:
                if matched_phrase == phrase:
                    max_weight = max(max_weight, weight)
    # Semantic-only hits get a fixed weight of 6
    for cat, phrases in domains.items():
        if any(p.startswith("semantic:") for p in phrases):
            max_weight = max(max_weight, 6)
    domain_comp = min(max_weight / 10.0, 1.0)

    # Component 3: Specificity — non-general, non-anger issues (weight 20%)
    specific_types = [t for t in issue_types if t not in ("general", "anger")]
    specificity_comp = min(len(specific_types) / 3.0, 1.0)

    confidence = (
        0.40 * model_comp +
        0.40 * domain_comp +
        0.20 * specificity_comp
    )

    # Minor adjustments
    word_count = len(transcript.split())
    if word_count < 10:
        confidence -= 0.15
    elif word_count > 150:
        confidence += 0.05

    return round(max(min(confidence, 1.0), 0.0), 3)


# ───────────────────────────────────────────────────────────────
# 7) Summary
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
    tone = tone_map.get(sentiment, "neutral")
    issue_label = main_issue.split("—")[0].strip() if "—" in main_issue else main_issue[:60]
    priority_note  = f" Priority level: {priority.upper()}." if priority in {"high","critical"} else ""
    followup_note  = " Immediate follow-up is recommended."    if needs_followup else ""
    multi_note     = (
        f" Co-occurring issues: {', '.join(issue_types[1:])}."
        if len(issue_types) > 1 else ""
    )
    return (
        f"The customer contacted support regarding: {issue_label}. "
        f"The overall tone of the conversation was {tone}."
        f"{priority_note}{multi_note}{followup_note}"
    )


# ───────────────────────────────────────────────────────────────
# Main Entrypoint
# ───────────────────────────────────────────────────────────────
def analyze_call_nlp(data: dict) -> dict:
    """
    Full NLP pipeline v7.

    Returns
    ───────
    main_issue        str    Professional CRM-ready description
    summary           str    Dashboard card sentence
    sentiment         str    positive | neutral | negative
    sentiment_score   float  Signed [-1.0, 1.0]
    keywords          list   Flat list for backend compatibility
    keywords_detail   dict   neg/pos/neu lists + categories + top phrases
    issue_type        str    Primary category key
    issue_types       list   ALL detected categories (multi-label)
    priority          str    low | medium | high | critical
    needs_followup    bool
    transcript        str    Full cleaned text
    customer_text     str    Customer-only speech
    confidence_score  float  [0.0, 1.0] — true model-driven score
    detected_language str
    model_used        str
    """
    transcript    = extract_transcript(data)
    customer_text = get_customer_text(data)

    # Sentiment on customer text only
    sentiment, score, roberta_prob = analyze_sentiment(customer_text or transcript)

    domains     = _detect_domains(transcript)
    issue_types = get_issue_types(domains)
    main_issue  = build_main_issue(transcript, customer_text, domains, issue_types, sentiment)
    keywords_detail = extract_keywords(transcript)
    keywords    = flatten_keywords(keywords_detail)
    priority    = infer_priority(sentiment, transcript, domains)
    needs_fu    = infer_followup(sentiment, priority, transcript, domains)
    confidence  = compute_confidence(roberta_prob, domains, priority, transcript, issue_types)
    language    = _safe_get_language(data)
    summary     = generate_summary(main_issue, sentiment, priority, needs_fu, issue_types)

    return {
        "main_issue":        main_issue,
        "summary":           summary,
        "sentiment":         sentiment,
        "sentiment_score":   round(float(score), 4),
        "keywords":          keywords,
        "keywords_detail":   keywords_detail,
        "issue_type":        _primary_category(issue_types),
        "issue_types":       issue_types,
        "priority":          priority,
        "needs_followup":    needs_fu,
        "transcript":        transcript,
        "customer_text":     customer_text,
        "confidence_score":  confidence,
        "detected_language": language,
        "model_used":        "hybrid_optimized_v7.0",
    }
