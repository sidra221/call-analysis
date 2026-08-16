import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_staggered_animations/flutter_staggered_animations.dart';

import '../../../l10n/app_localizations.dart';
import '../../../shared/widgets/ui.dart';
import '../../../shared/widgets/app_pagination.dart';
import '../../../core/theme/app_theme.dart';
import '../domain/app_notification.dart';
import '../application/notifications_provider.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() =>
      _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  static const _pageSize = 5;
  int _currentPage = 0;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final async = ref.watch(notificationsProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.notificationsTitle),
        centerTitle: true,
        leading: IconButton(
          onPressed: () => context.pop(),
          icon: const Icon(Icons.arrow_back),
        ),
      ),
      body: SafeArea(
        child: async.when(
          data: (notifications) {
            if (notifications.isEmpty) {
              return EmptyView(
                message: l10n.noNotifications,
                subtitle: l10n.allCaughtUp,
                icon: Icons.notifications_outlined,
              );
            }

            final totalPages = totalPagesFor(notifications.length, _pageSize);
            if (_currentPage >= totalPages) {
              WidgetsBinding.instance.addPostFrameCallback((_) {
                if (mounted) setState(() => _currentPage = totalPages - 1);
              });
            }

            final pageItems =
                paginateList(notifications, _currentPage, _pageSize);

            return Column(
              children: [
                Expanded(
                  child: AnimationLimiter(
                    child: ListView.builder(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 8,
                      ),
                      itemCount: pageItems.length,
                      itemBuilder: (context, index) {
                        final notification = pageItems[index];
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
                ),
                AppPaginationBar(
                  currentPage: _currentPage,
                  totalPages: totalPages,
                  totalItems: notifications.length,
                  pageSize: _pageSize,
                  onPageChanged: (page) => setState(() => _currentPage = page),
                ),
              ],
            );
          },
          error: (e, _) => ErrorView(
            message: l10n.failedToLoadNotifications,
            onRetry: () => ref.read(notificationsProvider.notifier).refresh(),
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

  IconData _getIcon(NotificationType type) {
    switch (type) {
      case NotificationType.call:
        return Icons.phone_outlined;
      case NotificationType.followup:
      case NotificationType.followupStatus:
        return Icons.refresh;
      case NotificationType.report:
      case NotificationType.reportReview:
        return Icons.analytics_outlined;
    }
  }

  Color _getColor(NotificationType type) {
    switch (type) {
      case NotificationType.call:
        return AppTheme.primary;
      case NotificationType.followup:
      case NotificationType.followupStatus:
        return AppTheme.notificationFollowup;
      case NotificationType.report:
      case NotificationType.reportReview:
        return AppTheme.notificationReport;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;
    final icon = _getIcon(notification.type);
    final color = _getColor(notification.type);
    final actor = notification.localizedActor(l10n);
    final body = notification.localizedBody(l10n);

    return AppCard(
      onTap: () async {
        if (!notification.isRead) {
          await ref
              .read(notificationsProvider.notifier)
              .markAsRead(notification);
        }
      },
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: AppTheme.chipDecoration(color, radius: 12),
            child: Icon(
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
                      child: RichText(
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        text: TextSpan(
                          style:
                              Theme.of(context).textTheme.titleMedium?.copyWith(
                                    fontWeight: notification.isRead
                                        ? FontWeight.w600
                                        : FontWeight.w800,
                                    color: scheme.onSurface,
                                  ),
                          children: [
                            TextSpan(
                              text: actor,
                              style:
                                  const TextStyle(fontWeight: FontWeight.w800),
                            ),
                            TextSpan(text: ' $body'),
                          ],
                        ),
                      ),
                    ),
                    if (!notification.isRead)
                      Container(
                        width: 8,
                        height: 8,
                        margin: const EdgeInsets.only(left: 8),
                        decoration: const BoxDecoration(
                          color: AppTheme.primary,
                          shape: BoxShape.circle,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  notification.localizedRelativeTime(l10n),
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
