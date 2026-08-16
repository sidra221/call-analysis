import 'notification_read_storage.dart';
import 'notifications_service.dart';
import '../domain/app_notification.dart';

class NotificationsRepository {
  Future<List<AppNotification>> fetchNotifications() {
    return NotificationsService.fetchNotifications();
  }

  Future<void> markAsRead(AppNotification notification) async {
    await NotificationReadStorage.markRead(
      notification.readType,
      notification.readId,
    );
  }
}
