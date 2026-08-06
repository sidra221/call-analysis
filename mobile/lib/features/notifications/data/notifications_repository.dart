import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/data/mock_api_service.dart';
import '../domain/app_notification.dart';

class NotificationsRepository {
  final MockApiService _api = MockApiService();
  List<AppNotification> _notifications = [];

  Future<List<AppNotification>> getNotifications() async {
    if (_notifications.isEmpty) {
      _notifications = await _api.fetchNotifications();
    }
    return _notifications;
  }

  Future<void> markAsRead(String notificationId) async {
    _notifications = _notifications.map((n) {
      if (n.id == notificationId && !n.isRead) {
        return AppNotification(
          id: n.id,
          title: n.title,
          description: n.description,
          time: n.time,
          type: n.type,
          isRead: true,
        );
      }
      return n;
    }).toList();
  }
}

final notificationsRepositoryProvider =
    Provider<NotificationsRepository>((ref) => NotificationsRepository());