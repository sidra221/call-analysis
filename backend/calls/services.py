def _empty_keywords():
    return {
        "negative": [], "positive": [], "neutral": [],
        "categories": {}, "display": [],
        "primary_polarity": "", "primary_issue_type": "",
    }


def _normalize_keywords(raw):
    """Normalize to v8 structured dict {negative, positive, neutral, categories}."""
    if isinstance(raw, dict) and any(k in raw for k in ("negative", "positive", "neutral")):
        result = _empty_keywords()
        seen = set()

        def _add(bucket, item):
            if not isinstance(item, str):
                return
            cleaned = item.strip()
            key = cleaned.lower()
            if not cleaned or key in seen:
                return
            seen.add(key)
            result[bucket].append(cleaned)

        for bucket in ("negative", "positive", "neutral"):
            for item in raw.get(bucket, []) or []:
                _add(bucket, item)

        categories = raw.get("categories") or {}
        if isinstance(categories, dict):
            cleaned_cats = {}
            for cat, items in categories.items():
                if not isinstance(items, list):
                    continue
                cat_items = []
                for item in items:
                    if isinstance(item, str) and item.strip():
                        cat_items.append(item.strip())
                if cat_items:
                    cleaned_cats[cat] = cat_items
            result["categories"] = cleaned_cats

        for field in ("primary_polarity", "primary_issue_type"):
            val = raw.get(field)
            if isinstance(val, str) and val.strip():
                result[field] = val.strip()

        display = raw.get("display") or []
        if isinstance(display, list):
            cleaned_display = []
            for item in display:
                if isinstance(item, str) and item.strip():
                    cleaned_display.append({
                        "text": item.strip(),
                        "polarity": result.get("primary_polarity") or "neutral",
                        "category": result.get("primary_issue_type") or "",
                    })
                elif isinstance(item, dict) and isinstance(item.get("text"), str) and item["text"].strip():
                    cleaned_display.append({
                        "text": item["text"].strip(),
                        "polarity": (item.get("polarity") or result.get("primary_polarity") or "neutral"),
                        "category": (item.get("category") or result.get("primary_issue_type") or ""),
                        "keyword_role": (item.get("keyword_role") or ""),
                    })
            result["display"] = cleaned_display

        if not result["display"]:
            for bucket in ("negative", "positive", "neutral"):
                for item in result[bucket]:
                    result["display"].append({
                        "text": item,
                        "polarity": bucket,
                        "category": result.get("primary_issue_type") or "",
                    })

        return result

    if isinstance(raw, list):
        result = _empty_keywords()
        seen = set()
        for item in raw:
            if not isinstance(item, str):
                continue
            cleaned = item.strip()
            key = cleaned.lower()
            if cleaned and key not in seen:
                seen.add(key)
                result["neutral"].append(cleaned)
        return result

    return _empty_keywords()


def flatten_keywords(raw):
    """Flat keyword list for search, dashboard stats, and legacy callers."""
    structured = _normalize_keywords(raw)
    if structured.get("display"):
        return [item["text"] for item in structured["display"] if item.get("text")]
    merged = []
    seen = set()
    for bucket in ("negative", "positive", "neutral"):
        for item in structured.get(bucket, []) or []:
            key = item.lower()
            if key not in seen:
                seen.add(key)
                merged.append(item)
    for items in (structured.get("categories") or {}).values():
        if not isinstance(items, list):
            continue
        for item in items:
            if not isinstance(item, str):
                continue
            key = item.lower()
            if item.strip() and key not in seen:
                seen.add(key)
                merged.append(item.strip())
    return merged


def top_keywords_counts(limit=10):
    """Aggregate keyword frequency across all analyses (supports structured + legacy)."""
    from collections import Counter
    from .models import CallAnalysis

    counter = Counter()
    for raw in CallAnalysis.objects.values_list("keywords", flat=True):
        for kw in flatten_keywords(raw):
            counter[kw.lower()] += 1
    return [{"keyword": k, "count": c} for k, c in counter.most_common(limit)]


def map_ai_response(call, data):
    """
    Maps the AI service response dictionary
    to CallAnalysis model fields.
    """

    keywords = _normalize_keywords(
        data.get('keywords') or data.get('keywords_detail')
    )
    repeated = data.get("repeated_issues", [])
    top_issues = []
    for i in repeated:
        top_issues.append({
            "issue": i.get("issue"),
            "count": i.get("count"),
            "priority": i.get("priority"),
            "description": i.get("description"),
            "suggested_solution": i.get("suggested_solution"),
            "related_keywords": i.get("related_keywords", []),
        })

    return {
        "call": call,
        "main_issue": data.get("main_issue"),
        "sentiment": data.get("sentiment"),
        "sentiment_score": float(data.get("sentiment_score") or 0),
        "keywords": keywords,
        "priority": data.get("priority"),
        "needs_followup": bool(data.get("needs_followup")),
        "followup_reason": (data.get("followup_reason") or "").strip(),
        "summary": data.get("summary") or "",
        "meta_intent": (data.get("meta_intent") or "").strip(),
        "meta_intents": data.get("meta_intents") if isinstance(data.get("meta_intents"), list) else [],
        "llm_refined": bool(data.get("llm_refined")),
        "transcript": data.get("transcript") or "",
        "confidence_score": data.get("confidence_score"),
        "detected_language": data.get("detected_language"),
        "top_issues": top_issues,
    }
