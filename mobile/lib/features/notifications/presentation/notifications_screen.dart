import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:flutter_staggered_animations/flutter_staggered_animations.dart';
import 'package:intl/intl.dart';
import '../../../shared/widgets/ui.dart';
import '../../../core/theme/app_theme.dart';
import '../domain/app_notification.dart';
import '../application/notifications_provider.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(notificationsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        centerTitle: true,
        leading: IconButton(
          onPressed: () => context.pop(),
          icon: const FaIcon(FontAwesomeIcons.arrowLeft),
        ),
      ),
      body: SafeArea(
        child: async.when(
          data: (notifications) => notifications.isEmpty
              ? const EmptyView(
                  message: 'No Notifications',
                  subtitle: 'You\'re all caught up!',
                  icon: FontAwesomeIcons.bell,
                )
              : AnimationLimiter(
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 8,
                    ),
                    itemCount: notifications.length,
                    itemBuilder: (context, index) {
                      final notification = notifications[index];
                      return AnimationConfiguration.staggeredList(
                        position: index,
                        duration: const Duration(milliseconds: 375),
                        child: SlideAnimation(
                          verticalOffset: 50,
                          child: FadeInAnimation(
                            child: Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: NotificationCard(
                                notification: notification,
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
          error: (e, _) => ErrorView(
            message: 'Failed to load notifications',
            onRetry: () => ref.invalidate(notificationsProvider),
          ),
          loading: () => const Center(
            child: CircularProgressIndicator.adaptive(),
          ),
        ),
      ),
    );
  }
}

class NotificationCard extends ConsumerWidget {
  final AppNotification notification;
  const NotificationCard({
    super.key,
    required this.notification,
  });

  FaIconData _getIcon(String type) {
    switch (type) {
      case 'call':
        return FontAwesomeIcons.phone;
      case 'followup':
        return FontAwesomeIcons.clock;
      case 'report':
        return FontAwesomeIcons.fileLines;
      case 'system':
        return FontAwesomeIcons.gear;
      default:
        return FontAwesomeIcons.bell;
    }
  }

  Color _getColor(String type) {
    switch (type) {
      case 'call':
        return AppTheme.primary;
      case 'followup':
        return AppTheme.warning;
      case 'report':
        return AppTheme.info;
      case 'system':
        return AppTheme.success;
      default:
        return AppTheme.primary;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scheme = Theme.of(context).colorScheme;
    final icon = _getIcon(notification.type);
    final color = _getColor(notification.type);

    return AppCard(
      onTap: () async {
        if (!notification.isRead) {
          await ref
              .read(notificationsProvider.notifier)
              .markAsRead(notification.id);
        }
        // TODO: Add notification-specific navigation here later if needed
      },
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: FaIcon(
              icon,
              size: 22,
              color: color,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        notification.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(
                              fontWeight: notification.isRead
                                  ? FontWeight.w600
                                  : FontWeight.w800,
                            ),
                      ),
                    ),
                    if (!notification.isRead)
                      Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: AppTheme.danger,
                          shape: BoxShape.circle,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  notification.description,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: scheme.onSurfaceVariant,
                      ),
                ),
                const SizedBox(height: 6),
                Text(
                  DateFormat('h:mm a, MMM d').format(notification.time),
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: scheme.outline,
                      ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
