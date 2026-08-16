import '../../l10n/app_localizations.dart';
import '../enums.dart';

extension CallStatusL10n on CallStatus {
  String localized(AppLocalizations l10n) {
    switch (this) {
      case CallStatus.completed:
        return l10n.statusCompleted;
      case CallStatus.inProgress:
        return l10n.statusProcessing;
      case CallStatus.queued:
        return l10n.statusPending;
      case CallStatus.failed:
        return l10n.statusFailed;
    }
  }
}

extension PriorityLevelL10n on PriorityLevel {
  String localizedShort(AppLocalizations l10n) {
    switch (this) {
      case PriorityLevel.high:
        return l10n.priorityHigh;
      case PriorityLevel.medium:
        return l10n.priorityMedium;
      case PriorityLevel.low:
        return l10n.priorityLow;
    }
  }

  String localizedFull(AppLocalizations l10n) {
    switch (this) {
      case PriorityLevel.high:
        return l10n.highPriority;
      case PriorityLevel.medium:
        return l10n.mediumPriority;
      case PriorityLevel.low:
        return l10n.lowPriority;
    }
  }
}

extension SentimentL10n on Sentiment {
  String localized(AppLocalizations l10n) {
    switch (this) {
      case Sentiment.positive:
        return l10n.sentimentPositive;
      case Sentiment.neutral:
        return l10n.sentimentNeutral;
      case Sentiment.negative:
        return l10n.sentimentNegative;
    }
  }
}

/// Localizes raw API status strings (e.g. Live Feed subtitle).
String localizeApiCallStatus(AppLocalizations l10n, String raw) {
  switch (raw.toLowerCase()) {
    case 'completed':
      return l10n.statusCompleted;
    case 'processing':
      return l10n.statusProcessing;
    case 'failed':
      return l10n.statusFailed;
    case 'pending':
      return l10n.statusPending;
    default:
      return raw;
  }
}

/// Localizes raw API sentiment strings (e.g. Live Feed subtitle).
String localizeApiSentiment(AppLocalizations l10n, String raw) {
  return SentimentParsers.fromString(raw).localized(l10n);
}
