def _normalize_keywords(raw):
    """Accept v8 structured dict, v7 flat list, or legacy keyword payloads."""
    if isinstance(raw, list):
        return [
            k.strip() for k in raw
            if isinstance(k, str) and k.strip()
        ]

    if isinstance(raw, dict):
        merged = []
        seen = set()

        def _add(item):
            if not isinstance(item, str):
                return
            cleaned = item.strip()
            key = cleaned.lower()
            if cleaned and key not in seen:
                seen.add(key)
                merged.append(cleaned)

        for bucket in ("negative", "positive", "neutral"):
            for item in raw.get(bucket, []) or []:
                _add(item)

        categories = raw.get("categories") or {}
        if isinstance(categories, dict):
            for items in categories.values():
                if not isinstance(items, list):
                    continue
                for item in items:
                    _add(item)

        return merged

    return []


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
        "sentiment_score": float(data.get("sentiment_score", 0)),
        "keywords": list(set(keywords)),
        "priority": data.get("priority"),
        "needs_followup": bool(data.get("needs_followup")),
        "transcript": data.get("transcript") or "",
        "confidence_score": data.get("confidence_score"),
        "detected_language": data.get("detected_language"),
        "top_issues": top_issues,
    }
