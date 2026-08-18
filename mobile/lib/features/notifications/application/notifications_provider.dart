import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/notifications_repository.dart';
import '../domain/app_notification.dart';

/// Same 30s polling interval as React `NotificationSection`.
class NotificationsNotifier extends AsyncNotifier<List<AppNotification>> {
  Timer? _pollTimer;

  @override
  Future<List<AppNotification>> build() async {
    ref.onDispose(() => _pollTimer?.cancel());

    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 30), (_) async {
      try {
        final data =
            await ref.read(notificationsRepositoryProvider).fetchNotifications();
        state = AsyncData(data);
      } catch (_) {
        // Keep last good state on background poll errors (matches React).
      }
    });

    return ref.read(notificationsRepositoryProvider).fetchNotifications();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(notificationsRepositoryProvider).fetchNotifications(),
    );
  }

  Future<void> markAsRead(AppNotification notification) async {
    if (notification.isRead) return;
    await ref.read(notificationsRepositoryProvider).markAsRead(notification);
    final updated = (state.value ?? [])
        .map((n) => n.id == notification.id ? n.copyWith(isRead: true) : n)
        .toList();
    state = AsyncData(updated);
  }

  Future<void> markAllAsRead() async {
    final items = state.value ?? [];
    final unread = items.where((n) => !n.isRead).toList();
    if (unread.isEmpty) return;
    for (final notification in unread) {
      await ref.read(notificationsRepositoryProvider).markAsRead(notification);
    }
    state = AsyncData(items.map((n) => n.copyWith(isRead: true)).toList());
  }
}

final notificationsRepositoryProvider =
    Provider<NotificationsRepository>((ref) => NotificationsRepository());

final notificationsProvider =
    AsyncNotifierProvider<NotificationsNotifier, List<AppNotification>>(
  NotificationsNotifier.new,
);
