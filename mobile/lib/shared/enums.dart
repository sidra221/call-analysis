enum CallStatus { completed, inProgress, queued, failed }

enum PriorityLevel { critical, high, medium, low }

enum Sentiment { positive, neutral, negative }

extension EnumParsers on PriorityLevel {
  static PriorityLevel fromString(String v) {
    switch (v.toLowerCase()) {
      case 'critical':
        return PriorityLevel.critical;
      case 'low':
        return PriorityLevel.low;
      case 'medium':
        return PriorityLevel.medium;
      case 'high':
        return PriorityLevel.high;
      default:
        return PriorityLevel.low;
    }
  }

  String get label {
    switch (this) {
      case PriorityLevel.critical:
        return 'Critical';
      case PriorityLevel.low:
        return 'Low';
      case PriorityLevel.medium:
        return 'Medium';
      case PriorityLevel.high:
        return 'High';
    }
  }
}

extension SentimentParsers on Sentiment {
  static Sentiment fromString(String v) {
    switch (v.toLowerCase()) {
      case 'positive':
        return Sentiment.positive;
      case 'neutral':
        return Sentiment.neutral;
      case 'negative':
        return Sentiment.negative;
      default:
        return Sentiment.neutral;
    }
  }

  String get label {
    switch (this) {
      case Sentiment.positive:
        return 'Positive';
      case Sentiment.neutral:
        return 'Neutral';
      case Sentiment.negative:
        return 'Negative';
    }
  }
}

