import '../../../l10n/app_localizations.dart';

enum NotificationType {
  call,
  followup,
  followupStatus,
  report,
  reportReview,
}

class AppNotification {
  final String id;
  final String actorName;
  final NotificationType type;
  final DateTime time;
  final bool isRead;
  final String readType;
  final String readId;
  final String? callId;
  final String? followupStatus;
  final bool? statusCompleted;
  final String? reportPeriod;
  final bool? hasManagerNotes;

  const AppNotification({
    required this.id,
    required this.actorName,
    required this.type,
    required this.time,
    required this.isRead,
    required this.readType,
    required this.readId,
    this.callId,
    this.followupStatus,
    this.statusCompleted,
    this.reportPeriod,
    this.hasManagerNotes,
  });

  String localizedActor(AppLocalizations l10n) {
    switch (actorName) {
      case 'System':
        return l10n.notifActorSystem;
      case 'Someone':
        return l10n.notifActorSomeone;
      case 'Manager':
        return l10n.manager;
      case 'QA':
        return l10n.notifActorQa;
      default:
        return actorName;
    }
  }

  String localizedBody(AppLocalizations l10n) {
    final period = reportPeriod ?? l10n.notifDefaultReportPeriod;
    final actor = localizedActor(l10n);

    switch (type) {
      case NotificationType.call:
        return l10n.notifCallUploaded(actor, callId ?? '—');
      case NotificationType.followup:
        return l10n.notifFollowupAssigned(callId ?? '—');
      case NotificationType.followupStatus:
        if (statusCompleted == true) {
          return l10n.notifFollowupStatusCompleted(
            actor,
            callId ?? '—',
          );
        }
        return l10n.notifFollowupStatusUpdated(
          actor,
          callId ?? '—',
          followupStatus ?? '',
        );
      case NotificationType.report:
        return l10n.notifReportPublished(actor, period);
      case NotificationType.reportReview:
        if (hasManagerNotes == true) {
          return l10n.notifReportReviewNotes(actor, period);
        }
        return l10n.notifReportReviewApproved(actor, period);
    }
  }

  String localizedRelativeTime(AppLocalizations l10n) {
    final diff = DateTime.now().difference(time);
    final seconds = diff.inSeconds;
    final minutes = diff.inMinutes;
    final hours = diff.inHours;
    final days = diff.inDays;

    if (seconds < 60) return l10n.timeJustNow;
    if (minutes < 60) return l10n.timeMinutesAgo(minutes);
    if (hours < 24) return l10n.timeHoursAgo(hours);
    if (days < 7) return l10n.timeDaysAgo(days);
    return l10n.timeOnDate(
      time.year,
      time.month,
      time.day,
    );
  }
}
