import '../../features/calls/domain/call_enums.dart';

extension SentimentX on Sentiment {
  String get label {
    switch (this) {
      case Sentiment.positive:
        return "Positive";
      case Sentiment.neutral:
        return "Neutral";
      case Sentiment.negative:
        return "Negative";
    }
  }
}

extension PriorityLevelX on PriorityLevel {
  String get label {
    switch (this) {
      case PriorityLevel.critical:
        return "Critical";
      case PriorityLevel.low:
        return "Low";
      case PriorityLevel.medium:
        return "Medium";
      case PriorityLevel.high:
        return "High";
    }
  }
}