def map_ai_response(call, data):
    """
    Maps the raw AI service response dictionary to CallAnalysis model fields.

    Ensures:
    - keywords is always a list with no duplicates
    - sentiment_score is safely cast to float
    - needs_followup is cast to bool
    - transcript falls back to an empty string if missing
    """

    # Extract keywords and remove duplicates while preserving type safety
    keywords = data.get('keywords') or []
    if not isinstance(keywords, list):
        keywords = []

    return {
        'call': call,
        'main_issue': data.get('main_issue'),
        'sentiment': data.get('sentiment'),
        'sentiment_score': float(data.get('sentiment_score', 0)),
        'keywords': list(set(keywords)),
        'priority': data.get('priority'),
        'needs_followup': bool(data.get('needs_followup')),
        'transcript': data.get('transcript') or '',
    }