# ================================================================
#   Call Analytics NLP Pipeline v5 — CPU‑ONLY Optimized Edition
# ================================================================

from __future__ import annotations
import os
os.environ["CUDA_VISIBLE_DEVICES"] = ""   # ← يمنع GPU نهائياً

import re
import logging
from typing import List, Tuple, Optional, Dict

import numpy as np
import spacy
from nltk.sentiment import SentimentIntensityAnalyzer
from transformers import pipeline as hf_pipeline
from sentence_transformers import SentenceTransformer, util

# ───────────────────────────────────────────────────────────────
# Logging
# ───────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
log = logging.getLogger("call_nlp_v5")

# ───────────────────────────────────────────────────────────────
# Constants
# ───────────────────────────────────────────────────────────────

SENTIMENT_LABELS = {"positive", "neutral", "negative"}
PRIORITY_LEVELS  = ["low", "medium", "high", "critical"]

MAX_KEYWORDS   = 12
CHUNK_WORDS    = 180
OVERLAP_WORDS  = 40

ISSUE_LABELS = [
    "payment failure or declined transaction",
    "withdrawal or transfer problem",
    "refund not received",
    "account blocked or suspended",
    "unauthorized or fraudulent transaction",
    "remote access or scam attempt",
    "technical error or system not working",
    "delivery or shipment delay",
    "billing or invoice dispute",
    "login or authentication problem",
    "customer complaint about service quality",
    "request for manager or escalation",
    "general inquiry or information request",
]

DOMAIN_REGISTRY: List[Tuple[str, str, str, int]] = [
    ("anydesk", "scam", "critical", 10),
    ("remote access", "scam", "critical", 10),
    ("share screen", "scam", "critical", 10),
    ("control your device", "scam", "critical", 10),
    ("verification app", "scam", "critical", 10),
    ("install this app", "scam", "critical", 9),
    ("fraud", "fraud", "critical", 10),
    ("unauthorized", "fraud", "critical", 9),
    ("stolen", "fraud", "critical", 9),
    ("hacked", "fraud", "critical", 9),
    ("identity theft", "fraud", "critical", 10),
    ("legal action", "legal", "critical", 9),
    ("lawyer", "legal", "critical", 8),
    ("police", "legal", "critical", 8),
    ("sue", "legal", "critical", 7),
    ("lawsuit", "legal", "critical", 9),
    ("court", "legal", "critical", 7),
    ("withdraw", "financial", "medium", 7),
    ("withdrawal", "financial", "medium", 7),
    ("refund", "financial", "medium", 7),
    ("payment", "financial", "medium", 6),
    ("transfer", "financial", "medium", 6),
    ("bank", "financial", "medium", 5),
    ("crypto", "financial", "medium", 6),
    ("fee", "financial", "medium", 5),
    ("tax", "financial", "medium", 5),
    ("invoice", "financial", "medium", 5),
    ("billing", "financial", "medium", 5),
    ("charge", "financial", "medium", 5),
    ("not working", "technical", "medium", 7),
    ("error", "technical", "medium", 6),
    ("bug", "technical", "medium", 6),
    ("failed", "technical", "medium", 6),
    ("crash", "technical", "medium", 6),
    ("broken", "technical", "medium", 5),
    ("offline", "technical", "medium", 5),
    ("cannot login", "technical", "high", 8),
    ("account blocked", "account", "high", 8),
    ("account suspended", "account", "high", 8),
    ("locked out", "account", "high", 7),
    ("delivery", "delivery", "low", 5),
    ("shipment", "delivery", "low", 5),
    ("tracking", "delivery", "low", 4),
    ("package", "delivery", "low", 4),
    ("order", "delivery", "low", 3),
    ("manager", "escalation", "high", 7),
    ("supervisor", "escalation", "high", 7),
    ("escalate", "escalation", "high", 7),
    ("complaint", "escalation", "high", 6),
    ("not resolved", "escalation", "high", 7),
    ("still waiting", "escalation", "high", 6),
    ("no response", "escalation", "high", 6),
    ("call me back", "escalation", "high", 6),
    ("angry", "anger", "high", 6),
    ("furious", "anger", "high", 7),
    ("terrible", "anger", "high", 5),
    ("unacceptable", "anger", "high", 6),
    ("ridiculous", "anger", "high", 5),
    ("outrageous", "anger", "high", 6),
    ("thank you", "satisfaction", "low", 3),
    ("appreciate", "satisfaction", "low", 3),
    ("helpful", "satisfaction", "low", 3),
    ("very helpful", "satisfaction", "low", 4),
]

_KW_STOPWORDS = {
    "thing", "things", "something", "anything", "everything",
    "stuff", "way", "okay", "yeah", "hello", "hi", "hey",
    "like", "know", "going", "really", "just", "very", "also",
    "need", "want", "got", "get", "make", "let", "say", "said",
    "good", "great", "well", "right", "sure", "actually",
    "basically", "literally", "kind", "little", "bit",
}

# ───────────────────────────────────────────────────────────────
# Model Loading (CPU‑Only)
# ───────────────────────────────────────────────────────────────

log.info("⏳ Loading spaCy …")
try:
    _nlp = spacy.load("en_core_web_sm")
except:
    log.error("spaCy model missing. Run: python -m spacy download en_core_web_sm")
    _nlp = None

log.info("⏳ Loading VADER …")
_vader = SentimentIntensityAnalyzer()

log.info("⏳ Loading RoBERTa sentiment model …")
try:
    _roberta = hf_pipeline(
        "sentiment-analysis",
        model="cardiffnlp/twitter-roberta-base-sentiment-latest",
        truncation=True,
        max_length=512,
        device="cpu",
    )
    _probe = _roberta("I love this")[0]
    log.info("RoBERTa probe label: %s", _probe["label"])
except Exception as exc:
    log.warning("RoBERTa failed (%s) — falling back to VADER.", exc)
    _roberta = None

log.info("⏳ Loading zero-shot classifier …")
try:
    _zero_shot = hf_pipeline(
        "zero-shot-classification",
        model="facebook/bart-large-mnli",
        device="cpu",
    )
except Exception as exc:
    log.warning("Zero-shot failed (%s) — fallback enabled.", exc)
    _zero_shot = None

log.info("⏳ Loading sentence embeddings …")
try:
    _embedder = SentenceTransformer(
        "sentence-transformers/all-MiniLM-L6-v2",
        device="cpu"
    )
except Exception as exc:
    log.warning("Embedder failed (%s) — fallback enabled.", exc)
    _embedder = None

log.info("✅ All models loaded.")

# ───────────────────────────────────────────────────────────────
# Utility Functions
# ───────────────────────────────────────────────────────────────

def _clean(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()

def _chunk(text: str) -> List[str]:
    words = text.split()
    if len(words) <= CHUNK_WORDS:
        return [text]
    chunks, i = [], 0
    while i < len(words):
        chunks.append(" ".join(words[i:i+CHUNK_WORDS]))
        i += CHUNK_WORDS - OVERLAP_WORDS
    return chunks

def _map_roberta_label(raw: str) -> str:
    r = raw.lower()
    if "pos" in r or r == "label_2":
        return "positive"
    if "neg" in r or r == "label_0":
        return "negative"
    return "neutral"

# ───────────────────────────────────────────────────────────────
# Transcript Extraction
# ───────────────────────────────────────────────────────────────

def extract_transcript(data: dict) -> str:
    try:
        segments = data.get("segments", [])
        texts = [seg.get("text", "").strip() for seg in segments if seg.get("text", "").strip()]
        return _clean(" ".join(texts))
    except:
        return ""

# ───────────────────────────────────────────────────────────────
# Domain Detection
# ───────────────────────────────────────────────────────────────

def _detect_domains(text: str) -> Dict[str, List[str]]:
    t = text.lower()
    matched = {}
    sorted_registry = sorted(DOMAIN_REGISTRY, key=lambda x: len(x[0]), reverse=True)
    for phrase, category, _, _ in sorted_registry:
        if phrase in t:
            matched.setdefault(category, []).append(phrase)
    return matched

def _domain_priority(domains: Dict[str, List[str]]) -> str:
    order = {p: i for i, p in enumerate(PRIORITY_LEVELS)}
    best = "low"
    for phrase, category, priority, _ in DOMAIN_REGISTRY:
        if category in domains and phrase in domains[category]:
            if order[priority] > order[best]:
                best = priority
    return best

# ───────────────────────────────────────────────────────────────
# Sentiment Analysis
# ───────────────────────────────────────────────────────────────

def _vader_sentiment(text: str):
    compound = _vader.polarity_scores(text)["compound"]
    if compound >= 0.25:
        return "positive", round(compound, 4)
    if compound <= -0.25:
        return "negative", round(compound, 4)
    return "neutral", round(compound, 4)

def _roberta_sentiment(text: str):
    if _roberta is None:
        return None, 0.0

    buckets = {"positive": 0.0, "neutral": 0.0, "negative": 0.0}
    total_w = 0.0

    for chunk in _chunk(text):
        try:
            res = _roberta(chunk)[0]
            label = _map_roberta_label(res["label"])
            conf = float(res["score"])
            weight = len(chunk.split())
            buckets[label] += conf * weight
            total_w += weight
        except:
            pass

    if total_w == 0:
        return None, 0.0

    for k in buckets:
        buckets[k] /= total_w

    best_label = max(buckets, key=buckets.__getitem__)
    best_conf = buckets[best_label]

    signed = best_conf if best_label == "positive" else (
        -best_conf if best_label == "negative" else 0.0
    )
    return best_label, round(signed, 4)

def analyze_sentiment(text: str):
    if not text:
        return "neutral", 0.0

    r_label, r_score = _roberta_sentiment(text)
    v_label, v_score = _vader_sentiment(text)

    if r_label is None:
        return v_label, v_score

    if abs(r_score) >= 0.55:
        return r_label, r_score

    blended = round((r_score * 0.60) + (v_score * 0.40), 4)
    blended = max(min(blended, 1.0), -1.0)

    if blended >= 0.20:
        return "positive", blended
    if blended <= -0.20:
        return "negative", blended
    return "neutral", blended

# ───────────────────────────────────────────────────────────────
# Main Issue Extraction
# ───────────────────────────────────────────────────────────────

def extract_main_issue(transcript: str, domains: Dict[str, List[str]], sentiment: str) -> str:
    if not transcript:
        return "No transcript content available."

    if "scam" in domains:
        p = ", ".join(domains["scam"][:2])
        return f"⚠️ Potential scam attempt detected ({p}). Immediate review required."

    if "fraud" in domains:
        p = ", ".join(domains["fraud"][:2])
        return f"Customer reports suspected fraud ({p}). High urgency."

    if "legal" in domains:
        p = ", ".join(domains["legal"][:2])
        return f"Customer issued a legal threat ({p}). Escalate immediately."

    if _nlp:
        try:
            doc = _nlp(transcript)
            sents = [s.text.strip() for s in doc.sents if len(s.text.split()) >= 4]
        except:
            sents = re.split(r"(?<=[.!?])\s+", transcript)
    else:
        sents = re.split(r"(?<=[.!?])\s+", transcript)

    if not sents:
        return "General customer inquiry."

    if _zero_shot:
        try:
            signals = [
                "problem", "issue", "cannot", "can't", "won't", "doesn't",
                "not working", "failed", "error", "help", "why", "how",
                "still", "never", "keep", "waiting", "refund", "withdraw",
                "blocked", "payment", "delivery",
            ]

            def score(s):
                sl = s.lower()
                return sum(1 for sig in signals if sig in sl)

            top_sents = sorted(sents, key=score, reverse=True)[:3]
            context = " | ".join(top_sents)

            zs = _zero_shot(context[:1024], ISSUE_LABELS, multi_label=False)
            label = zs["labels"][0]
            conf = float(zs["scores"][0])

            if conf >= 0.45:
                return f"Customer issue: {top_sents[0][:130]}"

        except:
            pass

    return _rule_based_issue(sents, domains, sentiment, transcript)

def _rule_based_issue(sents, domains, sentiment, full_text):
    signals = [
        ("problem", 3), ("issue", 3), ("cannot", 3),
        ("can't", 3), ("won't", 3), ("doesn't work", 4),
        ("not working", 4), ("failed", 3), ("error", 3),
        ("help", 2), ("still", 2), ("never", 2),
        ("keep", 2), ("always", 1), ("every time", 2),
        ("why", 1), ("how", 1), ("when will", 2),
        ("refund", 3), ("withdraw", 3), ("payment", 2),
        ("blocked", 3), ("delivery", 2), ("waiting", 2),
    ]

    best, best_score = "", -1

    for idx, sent in enumerate(sents):
        sl = sent.lower()
        score = sum(w for sig, w in signals if sig in sl)
        if idx < 4:
            score += 2
        if score > best_score and len(sent.split()) >= 5:
            best_score = score
            best = sent

    if best:
        return f"Customer issue: {best[:130]}"

    if "financial" in domains:
        return "Customer is experiencing a financial issue."
    if "account" in domains:
        return "Customer cannot access their account."
    if "technical" in domains:
        return "Customer reports a technical error."
    if "delivery" in domains:
        return "Customer reports a delivery problem."
    if "escalation" in domains:
        return "Customer is requesting escalation."
    if sentiment == "negative":
        return "Customer expressed strong dissatisfaction."

    return "General customer inquiry."

# ───────────────────────────────────────────────────────────────
# Keyword Extraction
# ───────────────────────────────────────────────────────────────

# ──────────────────────────────────────────────────────────────────────
# ★ KEYWORDS  (best possible — semantic + domain + NER)
# ──────────────────────────────────────────────────────────────────────

def _valid_kw(text: str) -> bool:
    """Filter out meaningless or generic keywords."""
    if not text:
        return False
    t = text.lower().strip()
    if len(t) < 3:
        return False
    if t in _KW_STOPWORDS:
        return False
    if all(c in ".,!?;:-" for c in t):
        return False
    return True


def extract_keywords(transcript: str, max_kw: int = MAX_KEYWORDS) -> List[str]:
    """
    Returns a flat, deduplicated, Backend-compatible list[str].

    Strategy (layered):
      1. Domain phrases     — highest signal, always include
      2. Named entities     — people, orgs, products, locations
      3. Noun phrases       — multi-word, semantically rich
      4. Key verbs/nouns    — single-word, filtered by POS
      5. Semantic re-ranking via SentenceTransformer cosine similarity
      6. Final dedup + clean
    """
    if not transcript:
        return []

    t_lower = transcript.lower()
    seen = set()
    pool = []   # (score, text)

    # ─────────────────────────────────────────────
    # Layer 1 — Domain phrases (score 10–9)
    # ─────────────────────────────────────────────
    for phrase, category, priority, weight in sorted(
        DOMAIN_REGISTRY, key=lambda x: x[3], reverse=True
    ):
        if phrase in t_lower:
            key = phrase.lower()
            if key not in seen and _valid_kw(phrase):
                seen.add(key)
                pool.append((weight, phrase))

    # ─────────────────────────────────────────────
    # Layers 2–4 — spaCy NER + noun chunks + POS tokens
    # ─────────────────────────────────────────────
    if _nlp:
        try:
            doc = _nlp(transcript)

            # Named entities (score 9)
            for ent in doc.ents:
                text = ent.text.strip()
                key = text.lower()
                if key not in seen and _valid_kw(text):
                    seen.add(key)
                    pool.append((9, text))

            # Noun phrases (score 7)
            for chunk in doc.noun_chunks:
                text = chunk.text.strip()
                key = text.lower()
                if key not in seen and len(text.split()) >= 2 and _valid_kw(text):
                    seen.add(key)
                    pool.append((7, text))

            # Important tokens (score 4–5)
            for token in doc:
                if token.is_stop or token.is_punct or token.is_space:
                    continue
                if token.pos_ not in {"NOUN", "PROPN", "VERB"}:
                    continue

                lemma = token.lemma_.strip()
                key = lemma.lower()

                if key not in seen and _valid_kw(lemma):
                    seen.add(key)
                    score = 5 if token.ent_type_ else 4
                    pool.append((score, lemma))

        except Exception as exc:
            log.warning("spaCy keyword pass failed: %s", exc)

    # ─────────────────────────────────────────────
    # Layer 5 — Semantic re-ranking (SentenceTransformer)
    # ─────────────────────────────────────────────
    if _embedder and len(pool) > max_kw:
        try:
            candidates = [text for _, text in pool]
            doc_emb = _embedder.encode(transcript, convert_to_tensor=True)
            cand_embs = _embedder.encode(candidates, convert_to_tensor=True)

            sims = util.cos_sim(doc_emb, cand_embs)[0].cpu().numpy()

            combined = []
            for (rule_score, text), sim in zip(pool, sims):
                combined_score = (rule_score / 10.0) * 0.5 + float(sim) * 0.5
                combined.append((combined_score, text))

            combined.sort(key=lambda x: x[0], reverse=True)
            return [text for _, text in combined[:max_kw]]

        except Exception as exc:
            log.warning("Semantic re-ranking failed: %s", exc)

    # ─────────────────────────────────────────────
    # Fallback — rule-score only
    # ─────────────────────────────────────────────
    pool.sort(key=lambda x: x[0], reverse=True)
    return [text for _, text in pool[:max_kw]]


# ──────────────────────────────────────────────────────────────────────
# ★ MAIN ENTRYPOINT — FULL NLP PIPELINE
# ──────────────────────────────────────────────────────────────────────

def analyze_call_nlp(data: dict) -> dict:
    """
    Main entrypoint used by backend.
    Returns:
        {
            "main_issue": str,
            "sentiment": str,
            "sentiment_score": float,
            "keywords": list[str],
            "priority": str,
            "needs_followup": bool,
            "transcript": str,
            "detected_language": str
        }
    """
    transcript = extract_transcript(data)
    sentiment, sentiment_score = analyze_sentiment(transcript)
    domains = _detect_domains(transcript)
    priority = _domain_priority(domains)
    main_issue = extract_main_issue(transcript, domains, sentiment)
    keywords = extract_keywords(transcript)

    needs_followup = (
        priority in {"high", "critical"} or
        sentiment == "negative" or
        "scam" in domains or
        "fraud" in domains or
        "legal" in domains
    )

    return {
        "main_issue": main_issue,
        "sentiment": sentiment,
        "sentiment_score": sentiment_score,
        "keywords": keywords,
        "priority": priority,
        "needs_followup": needs_followup,
        "transcript": transcript,
        "detected_language": "en",
    }
