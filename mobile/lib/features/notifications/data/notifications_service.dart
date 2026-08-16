import '../../../core/api/api_client.dart';
import '../../../core/models/models.dart';
import '../../../core/services/auth_service.dart';
import '../domain/app_notification.dart';
import 'notification_read_storage.dart';

/// Builds notifications from the same API sources and rules as
/// `frontend/src/layout/MainLayout/Header/NotificationSection/index.jsx`.
class NotificationsService {
  static const _maxItems = 30;

  static List<dynamic> _results(dynamic response) {
    final data = response['data'] ?? response;
    if (data is List) return data;
    if (data is Map && data['results'] is List) {
      return data['results'] as List;
    }
    return const [];
  }

  static DateTime? _parseDate(String? raw) {
    if (raw == null || raw.isEmpty) return null;
    return DateTime.tryParse(raw);
  }

  static double _hoursSince(DateTime date) {
    return DateTime.now().difference(date).inMinutes / 60.0;
  }

  static Future<List<AppNotification>> fetchNotifications() async {
    final user = await AuthService.getSavedUser();
    if (user == null) {
      throw ApiException(message: 'Not authenticated', statusCode: 401);
    }

    final currentUser = user.username.toLowerCase();
    final currentRole = user.role.toLowerCase();
    final currentUserId = user.id;

    final notifications = <AppNotification>[];

    // 1. Recent completed calls (24h) — manager/QA, exclude uploader
    if (currentRole == 'manager' || currentRole == 'qa') {
      final callsRes = await ApiClient.get('/api/calls/calls/');
      for (final raw in _results(callsRes)) {
        if (raw is! Map) continue;
        final call = CallModel.fromJson(Map<String, dynamic>.from(raw));
        final created = _parseDate(call.createdAt);
        if (created == null) continue;

        final uploader = (call.uploadedByUsername ?? '').toLowerCase();
        if (_hoursSince(created) > 24) continue;
        if (call.status != 'completed') continue;
        if (uploader == currentUser) continue;

        final callId = call.id;
        notifications.add(
          AppNotification(
            id: 'call-$callId',
            actorName: call.uploadedByUsername ?? 'System',
            type: NotificationType.call,
            time: created,
            isRead: !(await NotificationReadStorage.isUnread('call', callId)),
            readType: 'call',
            readId: callId,
            callId: callId,
          ),
        );
      }
    }

    // 2. Follow-ups assigned to current user
    final followupsRes = await ApiClient.get('/api/calls/followups/');
    final followups = _results(followupsRes)
        .whereType<Map>()
        .map((e) => FollowUpModel.fromJson(Map<String, dynamic>.from(e)))
        .where((f) => f.assignedToUsername.toLowerCase() == currentUser)
        .toList();

    for (final followup in followups) {
      final created = _parseDate(followup.createdAt);
      if (created == null) continue;

      notifications.add(
        AppNotification(
          id: 'followup-${followup.id}',
          actorName: 'System',
          type: NotificationType.followup,
          time: created,
          isRead: !(await NotificationReadStorage.isUnread(
            'followup',
            '${followup.id}',
          )),
          readType: 'followup',
          readId: '${followup.id}',
          callId: followup.callId,
        ),
      );
    }

    // 3. Follow-up status changes (24h) — assigned user only
    for (final followup in followups) {
      final updated = _parseDate(followup.updatedAt);
      final created = _parseDate(followup.createdAt);
      if (updated == null || created == null) continue;
      if (_hoursSince(updated) > 24) continue;
      if (followup.updatedAt == followup.createdAt) continue;

      final readId = '${followup.id}-${followup.updatedAt}';
      final statusCompleted = followup.status == 'done';
      notifications.add(
        AppNotification(
          id: 'followup-status-$readId',
          actorName: followup.updatedByUsername.isNotEmpty
              ? followup.updatedByUsername
              : 'Someone',
          type: NotificationType.followupStatus,
          time: updated,
          isRead: !(await NotificationReadStorage.isUnread(
            'followup-status',
            readId,
          )),
          readType: 'followup-status',
          readId: readId,
          callId: followup.callId,
          followupStatus: followup.status,
          statusCompleted: statusCompleted,
        ),
      );
    }

    // 4. Published reports (7 days) — manager only
    if (currentRole == 'manager') {
      final reportsRes = await ApiClient.get('/api/reports/reports/');
      for (final raw in _results(reportsRes)) {
        if (raw is! Map) continue;
        final map = Map<String, dynamic>.from(raw);
        final created = _parseDate(map['created_at']?.toString());
        if (created == null) continue;
        if (_hoursSince(created) > 168) continue;
        if (map['status']?.toString() != 'published') continue;

        final reportId = '${map['id']}';
        final period = map['period']?.toString() ?? '';
        notifications.add(
          AppNotification(
            id: 'report-$reportId',
            actorName: map['created_by_username']?.toString() ?? 'QA',
            type: NotificationType.report,
            time: created,
            isRead: !(await NotificationReadStorage.isUnread('report', reportId)),
            readType: 'report',
            readId: reportId,
            reportPeriod: period.isNotEmpty ? period : null,
          ),
        );
      }
    }

    // 5. Report reviews (48h) — QA owner only
    if (currentRole == 'qa') {
      final reportsRes = await ApiClient.get('/api/reports/reports/');
      for (final raw in _results(reportsRes)) {
        if (raw is! Map) continue;
        final map = Map<String, dynamic>.from(raw);

        final createdBy = map['created_by'];
        final createdById = createdBy is int
            ? createdBy
            : int.tryParse('$createdBy');
        final ownerById = currentUserId != null &&
            createdById != null &&
            createdById == currentUserId;
        final ownerByName =
            (map['created_by_username']?.toString() ?? '').toLowerCase() ==
                currentUser;
        if (!ownerById && !ownerByName) continue;

        final reviewedAtRaw = map['reviewed_at']?.toString();
        final reviewed = _parseDate(reviewedAtRaw);
        if (reviewed == null) continue;
        if (_hoursSince(reviewed) > 48) continue;
        if (map['status']?.toString() == 'draft') continue;

        final period = map['period']?.toString() ?? '';
        final managerNotes = map['manager_notes']?.toString() ?? '';
        final hasNotes = managerNotes.trim().isNotEmpty;
        final notificationKey = hasNotes
            ? '${map['id']}-$reviewedAtRaw-notes'
            : '${map['id']}-$reviewedAtRaw-approve';

        notifications.add(
          AppNotification(
            id: 'report-review-$notificationKey',
            actorName: map['reviewed_by_username']?.toString() ?? 'Manager',
            type: NotificationType.reportReview,
            time: reviewed,
            isRead: !(await NotificationReadStorage.isUnread(
              'report-review',
              notificationKey,
            )),
            readType: 'report-review',
            readId: notificationKey,
            reportPeriod: period.isNotEmpty ? period : null,
            hasManagerNotes: hasNotes,
          ),
        );
      }
    }

    notifications.sort((a, b) => b.time.compareTo(a.time));
    if (notifications.length > _maxItems) {
      return notifications.sublist(0, _maxItems);
    }
    return notifications;
  }
}
