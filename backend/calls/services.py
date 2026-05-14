def map_ai_response(call, data):
    """
    Maps the AI service response dictionary
    to CallAnalysis model fields.
    """

    keywords = data.get('keywords') or []

    if not isinstance(keywords, list):
        keywords = []

    return {
        'call': call,

        'main_issue': data.get('main_issue'),

        'sentiment': data.get('sentiment'),

        'sentiment_score': float(
            data.get('sentiment_score', 0)
        ),

        'keywords': list(set(keywords)),

        'priority': data.get('priority'),

        'needs_followup': bool(
            data.get('needs_followup')
        ),

        'transcript': data.get('transcript') or '',

        'confidence_score': data.get(
            'confidence_score'
        ),

        'detected_language': data.get(
            'detected_language'
        ),
    }