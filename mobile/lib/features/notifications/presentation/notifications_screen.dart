import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_staggered_animations/flutter_staggered_animations.dart';
import 'package:google_fonts/google_fonts.dart';

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

class _NotificationsScreenState extends ConsumerState<NotificationsScreen>
    with SingleTickerProviderStateMixin {
  static const _pageSize = 5;
  int _currentPage = 0;
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      if (_tabController.indexIsChanging) return;
      setState(() => _currentPage = 0);
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final async = ref.watch(notificationsProvider);
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.notificationsTitle),
        centerTitle: true,
        leading: IconButton(
          onPressed: () => context.pop(),
          icon: const Icon(Icons.arrow_back),
        ),
        actions: [
          async.maybeWhen(
            data: (notifications) {
              final hasUnread = notifications.any((n) => !n.isRead);
              if (!hasUnread) return const SizedBox.shrink();
              return TextButton(
                onPressed: () =>
                    ref.read(notificationsProvider.notifier).markAllAsRead(),
                child: Text(l10n.markAllRead),
              );
            },
            orElse: () => const SizedBox.shrink(),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          labelStyle: GoogleFonts.roboto(fontWeight: FontWeight.w700),
          tabs: [
            Tab(
              text: async.maybeWhen(
                data: (list) => '${l10n.notificationsAll} (${list.length})',
                orElse: () => l10n.notificationsAll,
              ),
            ),
            Tab(
              text: async.maybeWhen(
                data: (list) {
                  final unread = list.where((n) => !n.isRead).length;
                  return '${l10n.unread} ($unread)';
                },
                orElse: () => l10n.unread,
              ),
            ),
          ],
        ),
      ),
      body: SafeArea(
        child: async.when(
          data: (notifications) {
            final showUnreadOnly = _tabController.index == 1;
            final visible = showUnreadOnly
                ? notifications.where((n) => !n.isRead).toList()
                : notifications;

            if (visible.isEmpty) {
              return EmptyView(
                message: showUnreadOnly
                    ? l10n.noUnreadNotifications
                    : l10n.noNotifications,
                subtitle: l10n.allCaughtUp,
                icon: Icons.notifications,
              );
            }

            final totalPages = totalPagesFor(visible.length, _pageSize);
            if (_currentPage >= totalPages) {
              WidgetsBinding.instance.addPostFrameCallback((_) {
                if (mounted) setState(() => _currentPage = totalPages - 1);
              });
            }

            final pageItems = paginateList(visible, _currentPage, _pageSize);

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
                  totalItems: visible.length,
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
      backgroundColor: scheme.surface,
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
        return Icons.phone;
      case NotificationType.followup:
      case NotificationType.followupStatus:
        return Icons.refresh;
      case NotificationType.report:
      case NotificationType.reportReview:
        return Icons.analytics;
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
    final unread = !notification.isRead;

    return AppCard(
      onTap: () async {
        if (unread) {
          await ref
              .read(notificationsProvider.notifier)
              .markAsRead(notification);
        }
      },
      color: unread ? color.withValues(alpha: 0.06) : null,
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
                                    fontWeight:
                                        unread ? FontWeight.w800 : FontWeight.w600,
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
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: unread
                            ? AppTheme.primary.withValues(alpha: 0.12)
                            : scheme.surfaceContainerHighest,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        unread ? l10n.unread : l10n.read,
                        style: GoogleFonts.roboto(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: unread
                              ? AppTheme.primary
                              : scheme.onSurfaceVariant,
                        ),
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
