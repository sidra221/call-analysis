def map_ai_response(call, data):
    return {
        'call': call,
        'main_issue': data.get('main_issue'),
        'sentiment_score': float(data.get('sentiment_score', 0)),
        'keywords': list(set(data.get('keywords') or [])),
        'priority': data.get('priority'),
        'needs_followup': bool(data.get('needs_followup')),
        'transcript': data.get('transcript') or '',
        'sentiment': data.get('sentiment'),
    }