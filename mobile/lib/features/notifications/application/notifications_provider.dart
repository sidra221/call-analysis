import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/notifications_repository.dart';
import '../domain/app_notification.dart';

class NotificationsNotifier extends AsyncNotifier<List<AppNotification>> {
  @override
  Future<List<AppNotification>> build() async {
    final repo = ref.watch(notificationsRepositoryProvider);
    return repo.getNotifications();
  }

  Future<void> markAsRead(String notificationId) async {
    final repo = ref.read(notificationsRepositoryProvider);
    await repo.markAsRead(notificationId);
    state = AsyncData(await repo.getNotifications());
  }
}

final notificationsProvider =
    AsyncNotifierProvider<NotificationsNotifier, List<AppNotification>>(
  () => NotificationsNotifier(),
);

