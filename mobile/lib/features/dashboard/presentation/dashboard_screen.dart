import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_staggered_animations/flutter_staggered_animations.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../shared/l10n/call_chip_labels.dart';
import '../../../shared/widgets/ui.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/theme_provider.dart';
import '../../../core/locale/locale_provider.dart';
import '../../../features/notifications/application/notifications_provider.dart';
import '../../../features/auth/application/auth_controller.dart';
import '../../../features/auth/domain/user_profile.dart';
import '../../../shared/enums.dart';
import '../../calls/application/calls_controller.dart';
import '../application/dashboard_providers.dart';
import '../domain/dashboard_issue.dart';
import 'sentiment_chart.dart';
import '../../../l10n/app_localizations.dart';

void _openCalls(
  BuildContext context,
  WidgetRef ref, {
  PriorityLevel? priority,
  Sentiment? sentiment,
  String? search,
}) {
  ref.read(callsControllerProvider.notifier).applyFilter(
        CallsFilter(
          priority: priority,
          sentiment: sentiment,
          search: search,
        ),
      );
  context.go('/calls');
}

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final userAsync = ref.watch(userProfileProvider);
    final summaryAsync = ref.watch(dashboardSummaryProvider);
    final negIssuesAsync = ref.watch(topNegativeIssuesProvider);
    final posIssuesAsync = ref.watch(topPositiveIssuesProvider);
    final liveFeedAsync = ref.watch(liveFeedProvider);
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator.adaptive(
          onRefresh: () async {
            ref.invalidate(userProfileProvider);
            ref.invalidate(dashboardSummaryProvider);
            ref.invalidate(topNegativeIssuesProvider);
            ref.invalidate(topPositiveIssuesProvider);
            ref.invalidate(liveFeedProvider);
          },
          child: CustomScrollView(
            slivers: [
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                sliver: SliverToBoxAdapter(
                  child: userAsync.when(
                    data: (user) => Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                l10n.welcomeBack,
                                style: GoogleFonts.roboto(
                                  fontSize: 22,
                                  fontWeight: FontWeight.w800,
                                  color: scheme.onSurface,
                                  letterSpacing: -0.5,
                                  height: 1.2,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                user.name,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.roboto(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: scheme.primary,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                l10n.welcomeSubtitle,
                                style: GoogleFonts.roboto(
                                  fontSize: 13,
                                  color: scheme.onSurfaceVariant,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Consumer(
                          builder: (context, ref, child) {
                            final notificationsAsync =
                                ref.watch(notificationsProvider);
                            final unreadCount = notificationsAsync.when(
                              data: (list) =>
                                  list.where((n) => !n.isRead).length,
                              loading: () => 0,
                              error: (_, __) => 0,
                            );

                            return Stack(
                              
                              clipBehavior: Clip.none,
                              children: [
                               
IconButton(
  onPressed: () => context.push('/notifications'),
  icon: Icon(
    Icons.notifications,
    size: 20,
    color: scheme.onSurfaceVariant,
  ),
  style: IconButton.styleFrom(
    backgroundColor: scheme.surface,
    side: BorderSide(
      color: scheme.outline,
    ),
    padding: const EdgeInsets.all(12),
    shape: const CircleBorder(),
  ),
),
                                if (unreadCount > 0)
                                  Positioned(
                                    top: 4,
                                    right: 4,
                                    child: Container(
                                      constraints: const BoxConstraints(
                                        minWidth: 20,
                                        minHeight: 20,
                                      ),
                                      decoration: BoxDecoration(
                                        color: Colors.red,
                                        shape: BoxShape.circle,
                                        boxShadow: [
  BoxShadow(
    color: AppTheme.danger.withValues(alpha: 0.4),
    blurRadius: 8,
    offset: const Offset(0, 2),
  ),
],
                                      ),
                                      child: Center(
                                        child: Padding(
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 5),
                                          child: Text(
                                            unreadCount > 99
                                                ? '99+'
                                                : '$unreadCount',
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 11,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                              ],
                            );
                          },
                        ),
                        const SizedBox(width: 8),
                        Consumer(
                          builder: (context, ref, child) {
                            return _ProfileMenuButton(user: userAsync.value);
                          },
                        ),
                      ],
                    ),
                    error: (e, _) => const SizedBox.shrink(),
                    loading: () => const SizedBox.shrink(),
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                sliver: SliverToBoxAdapter(
                  child: summaryAsync.when(
                    data: (summary) => Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: AnimationConfiguration.toStaggeredList(
                        duration: const Duration(milliseconds: 375),
                        childAnimationBuilder: (widget) => SlideAnimation(
                          horizontalOffset: 50,
                          child: FadeInAnimation(child: widget),
                        ),
                        children: [
                          Text(
                            l10n.callPriorityTitle,
                            style: GoogleFonts.roboto(
                              fontSize: 20,
                              fontWeight: FontWeight.w700,
                              color: scheme.onSurface,
                              letterSpacing: -0.5,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: PriorityCard(
                                  icon: Icons.warning_amber,
                                  title: l10n.criticalPriority,
                                  value: summary.criticalPriorityCount.toString(),
                                  color: AppTheme.priorityCritical,
                                  onTap: () => _openCalls(
                                    context,
                                    ref,
                                    priority: PriorityLevel.critical,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: PriorityCard(
                                  icon: Icons.arrow_upward,
                                  title: l10n.highPriority,
                                  value: summary.highPriorityCount.toString(),
                                  color: AppTheme.priorityHigh,
                                  onTap: () => _openCalls(
                                    context,
                                    ref,
                                    priority: PriorityLevel.high,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: PriorityCard(
                                  icon: Icons.remove,
                                  title: l10n.mediumPriority,
                                  value: summary.mediumPriorityCount.toString(),
                                  color: AppTheme.priorityMedium,
                                  onTap: () => _openCalls(
                                    context,
                                    ref,
                                    priority: PriorityLevel.medium,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: PriorityCard(
                                  icon: Icons.arrow_downward,
                                  title: l10n.lowPriority,
                                  value: summary.lowPriorityCount.toString(),
                                  color: AppTheme.priorityLow,
                                  onTap: () => _openCalls(
                                    context,
                                    ref,
                                    priority: PriorityLevel.low,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 20),
                          Text(
                            l10n.sentimentAnalysis,
                            style: GoogleFonts.roboto(
                              fontSize: 20,
                              fontWeight: FontWeight.w700,
                              color: scheme.onSurface,
                              letterSpacing: -0.5,
                            ),
                          ),
                          const SizedBox(height: 12),
                          SentimentChart(
                            positivePct: summary.positivePct,
                            neutralPct: summary.neutralPct,
                            negativePct: summary.negativePct,
                            onSentimentTap: (sentiment) => _openCalls(
                              context,
                              ref,
                              sentiment: sentiment,
                            ),
                          ),
                        ],
                      ),
                    ),
                    error: (e, _) => ErrorView(
                      message: l10n.failedToLoadSummary,
                      onRetry: () => ref.invalidate(dashboardSummaryProvider),
                    ),
                    loading: () => const SizedBox.shrink(),
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 8),
                sliver: SliverToBoxAdapter(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        l10n.liveFeed,
                        style: GoogleFonts.roboto(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          color: scheme.onSurface,
                          letterSpacing: -0.5,
                        ),
                      ),
                      TextButton(
                        onPressed: () => _openCalls(context, ref),
                        child: Text(
                          l10n.viewAll,
                          style: GoogleFonts.roboto(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            letterSpacing: -0.2,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
                sliver: liveFeedAsync.when(
                  data: (calls) => SliverToBoxAdapter(
                    child: AppCard(
                      child: calls.isEmpty
                          ? Text(
                              l10n.noRecentCalls,
                              style: GoogleFonts.roboto(
                                fontSize: 14,
                                color: scheme.onSurfaceVariant,
                              ),
                            )
                          : Column(
                              children: calls.map((call) {
                                final id = call['id']?.toString() ?? '—';
                                final status = call['status']?.toString() ?? '—';
                                final sentiment =
                                    call['sentiment']?.toString() ?? 'neutral';
                                final createdAt =
                                    call['created_at']?.toString() ?? '';
                                return ListTile(
                                  contentPadding: EdgeInsets.zero,
                                  title: Text(
                                    l10n.callNumber(id),
                                    style: GoogleFonts.roboto(
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  subtitle: Text(
                                    '${localizeApiCallStatus(l10n, status)} • ${localizeApiSentiment(l10n, sentiment)}',
                                    style: GoogleFonts.roboto(
                                      fontSize: 13,
                                      color: scheme.onSurfaceVariant,
                                    ),
                                  ),
                                  trailing: Text(
                                    createdAt.length >= 10
                                        ? createdAt.substring(0, 10)
                                        : createdAt,
                                    style: GoogleFonts.roboto(
                                      fontSize: 12,
                                      color: scheme.onSurfaceVariant,
                                    ),
                                  ),
                                  onTap: () => context.push('/calls/$id'),
                                );
                              }).toList(),
                            ),
                    ),
                  ),
                  error: (e, _) => SliverToBoxAdapter(
                    child: ErrorView(
                      message: l10n.failedToLoadLiveFeed,
                      onRetry: () => ref.invalidate(liveFeedProvider),
                    ),
                  ),
                  loading: () => const SliverToBoxAdapter(
                    child: Center(child: CircularProgressIndicator.adaptive()),
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 8),
                sliver: SliverToBoxAdapter(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        l10n.topNegativeIssues,
                        style: GoogleFonts.roboto(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          color: scheme.onSurface,
                          letterSpacing: -0.5,
                        ),
                      ),
                      TextButton(
                        onPressed: () => context.push('/issues/negative'),
                        child: Text(
                          l10n.viewAll,
                          style: GoogleFonts.roboto(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            letterSpacing: -0.2,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 0, 0, 12),
                sliver: negIssuesAsync.when(
                  data: (issues) => SliverToBoxAdapter(
                    child: SizedBox(
                      height: 180,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.only(right: 20),
                        itemCount: issues.length,
                        itemBuilder: (context, i) => AnimationConfiguration.staggeredList(
                          position: i,
                          duration: const Duration(milliseconds: 375),
                          child: SlideAnimation(
                            horizontalOffset: 50,
                            child: FadeInAnimation(
                              child: Padding(
                                padding: const EdgeInsets.only(right: 12),
                                child: HorizontalIssueCard(
                                  issue: issues[i],
                                  onTap: () => _openCalls(
                                    context,
                                    ref,
                                    search: issues[i].title,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                  error: (e, _) => const SliverToBoxAdapter(child: SizedBox.shrink()),
                  loading: () => const SliverToBoxAdapter(child: SizedBox.shrink()),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 8),
                sliver: SliverToBoxAdapter(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        l10n.topPositiveFeedback,
                        style: GoogleFonts.roboto(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          color: scheme.onSurface,
                          letterSpacing: -0.5,
                        ),
                      ),
                      TextButton(
                        onPressed: () => context.push('/issues/positive'),
                        child: Text(
                          l10n.viewAll,
                          style: GoogleFonts.roboto(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            letterSpacing: -0.2,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 0, 0, 12),
                sliver: posIssuesAsync.when(
                  data: (issues) => SliverToBoxAdapter(
                    child: SizedBox(
                      height: 180,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.only(right: 20),
                        itemCount: issues.length,
                        itemBuilder: (context, i) => AnimationConfiguration.staggeredList(
                          position: i,
                          duration: const Duration(milliseconds: 375),
                          child: SlideAnimation(
                            horizontalOffset: 50,
                            child: FadeInAnimation(
                              child: Padding(
                                padding: const EdgeInsets.only(right: 12),
                                child: HorizontalIssueCard(
                                  issue: issues[i],
                                  onTap: () => _openCalls(
                                    context,
                                    ref,
                                    search: issues[i].title,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                  error: (e, _) => const SliverToBoxAdapter(child: SizedBox.shrink()),
                  loading: () => const SliverToBoxAdapter(child: SizedBox.shrink()),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
class PriorityCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String value;
  final Color color;
  final VoidCallback? onTap;

  const PriorityCard({
    super.key,
    required this.icon,
    required this.title,
    required this.value,
    required this.color,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Ink(
          height: 92,
          padding: const EdgeInsets.symmetric(
            horizontal: 14,
            vertical: 12,
          ),
          decoration: AppTheme.cardDecoration(scheme, radius: 16),
          child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Icon(
                icon,
                size: 19,
                color: color,
              ),
            ),
          ),

          const SizedBox(width: 10),

          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.roboto(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: scheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  value,
                  style: GoogleFonts.roboto(
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                    color: scheme.onSurface,
                  ),
                ),
              ],
            ),
          ),
        ],
          ),
        ),
      ),
    );
  }
}

class HorizontalIssueCard extends StatelessWidget {
  final DashboardIssue issue;
  final bool fullWidth;
  final VoidCallback? onTap;

  const HorizontalIssueCard({
    super.key,
    required this.issue,
    this.fullWidth = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;
    final color = issue.isPositive ? AppTheme.success : AppTheme.danger;
    final screenWidth = MediaQuery.of(context).size.width;
    final cardWidth = fullWidth ? double.infinity : (screenWidth - 48) / 2;

    return SizedBox(
      width: cardWidth,
      child: AppCard(
        onTap: onTap,
        padding: const EdgeInsets.all(14),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.start,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: AppTheme.chipBackgroundOpacity),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: color.withValues(alpha: AppTheme.chipBorderOpacity),
                      width: 1,
                    ),
                  ),
                  child: Icon(
                    issue.isPositive ? Icons.thumb_up : Icons.thumb_down,
                    size: 18,
                    color: color,
                  ),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: _trendColor(issue.trend, issue.isPositive)
                        .withValues(alpha: AppTheme.chipBackgroundOpacity),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: _trendColor(issue.trend, issue.isPositive)
                          .withValues(alpha: AppTheme.chipBorderOpacity),
                      width: 1,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        _trendIcon(issue.trend),
                        size: 12,
                        color: _trendColor(issue.trend, issue.isPositive),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        _trendLabel(context, issue.trend),
                        style: GoogleFonts.roboto(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: _trendColor(issue.trend, issue.isPositive),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              issue.title,
              style: GoogleFonts.roboto(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: scheme.onSurface,
                letterSpacing: -0.2,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 8),
            Text(
              '${issue.count} ${l10n.mentions}',
              style: GoogleFonts.roboto(
                fontSize: 12,
                color: scheme.onSurfaceVariant,
                fontWeight: FontWeight.w400,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _trendColor(Trend trend, bool isPositive) {
    if (trend == Trend.up && isPositive) return AppTheme.success;
    if (trend == Trend.up && !isPositive) return AppTheme.danger;
    if (trend == Trend.down && isPositive) return AppTheme.danger;
    if (trend == Trend.down && !isPositive) return AppTheme.success;
    return AppTheme.warning;
  }

  IconData _trendIcon(Trend trend) {
    switch (trend) {
      case Trend.up:
        return Icons.trending_up;
      case Trend.down:
        return Icons.trending_down;
      case Trend.stable:
        return Icons.remove;
    }
  }

  String _trendLabel(BuildContext context,Trend trend) {
    final l10n = AppLocalizations.of(context)!;
    switch (trend) {
      case Trend.up:
        return l10n.trendUp;
      case Trend.down:
        return l10n.trendDown;
      case Trend.stable:
        return l10n.trendStable;
    }
  }
}

class _ProfileMenuButton extends ConsumerWidget {
  final UserProfile? user;
  const _ProfileMenuButton({required this.user});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final themeMode = ref.watch(themeProvider);
    final locale = ref.watch(localeProvider);
    final isDarkMode = themeMode == ThemeMode.dark ||
        (themeMode == ThemeMode.system &&
            MediaQuery.of(context).platformBrightness == Brightness.dark);
    final scheme = Theme.of(context).colorScheme;
    return PopupMenuButton<String>(
   

icon: Container(
  padding: const EdgeInsets.all(12),
  decoration: BoxDecoration(
    color: scheme.surface,
    shape: BoxShape.circle,
    border: Border.all(
      color: scheme.outline,
    ),
  ),
  child: Icon(
    Icons.person,
    size: 20,
    color: scheme.onSurfaceVariant,
  ),
),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      color: Theme.of(context).colorScheme.surface,
      elevation: 8,
      position: PopupMenuPosition.under,
      onSelected: (value) async {
        if (value == 'language_en') {
          await ref.read(localeProvider.notifier).setLocale('en');
        } else if (value == 'language_ar') {
          await ref.read(localeProvider.notifier).setLocale('ar');
        } else if (value == 'toggle_dark_mode') {
          await ref.read(themeProvider.notifier).toggleDarkMode(!isDarkMode);
        } else if (value == 'logout') {
          final confirmed = await showDialog<bool>(
            context: context,
            builder: (context) => AlertDialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              title: Text(l10n.logOut),
              content: Text(l10n.logoutConfirmation),
              actions: [
                OutlinedButton(
                  onPressed: () => Navigator.pop(context, false),
                  child: Text(MaterialLocalizations.of(context).cancelButtonLabel),
                ),
                ElevatedButton(
                  onPressed: () => Navigator.pop(context, true),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.danger,
                    foregroundColor: Colors.white,
                    overlayColor: Colors.white.withValues(alpha: 0.16),
                  ),
                  child: Text(l10n.logOut),
                ),
              ],
            ),
          );
          if (confirmed == true && context.mounted) {
            await ref.read(authControllerProvider.notifier).logout();
            if (context.mounted) {
              context.go('/login');
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(l10n.loggedOutSuccessfully),
                  behavior: SnackBarBehavior.floating,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              );
            }
          }
        }
      },
      itemBuilder: (context) => [
        PopupMenuItem<String>(
          enabled: false,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppTheme.primary.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.person,
                      size: 18,
                      color: AppTheme.primary,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user?.name ?? l10n.user,
                          style: GoogleFonts.roboto(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: scheme.onSurface,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const PopupMenuDivider(height: 1),
        PopupMenuItem<String>(
          enabled: false,
          child: DropdownButton<String>(
            isExpanded: true,
            value: locale.languageCode,
            underline: const SizedBox.shrink(),
            items: [
              DropdownMenuItem(value: 'en', child: Text(l10n.english)),
              DropdownMenuItem(value: 'ar', child: Text(l10n.arabic)),
            ],
            onChanged: (code) {
              if (code != null) {
                Navigator.pop(context, 'language_$code');
              }
            },
          ),
        ),
        const PopupMenuDivider(height: 1),
        PopupMenuItem<String>(
          value: 'toggle_dark_mode',
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: isDarkMode
                      ? AppTheme.primary.withValues(alpha: 0.12)
                      : AppTheme.warning.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  isDarkMode ? Icons.dark_mode : Icons.light_mode,
                  size: 18,
                  color: isDarkMode ? AppTheme.primary : AppTheme.warning,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  isDarkMode ? l10n.darkMode : l10n.lightMode,
                  style: GoogleFonts.roboto(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: scheme.onSurface,
                  ),
                ),
              ),
              Switch(
                value: isDarkMode,
                onChanged: (value) {
                  Navigator.pop(context, 'toggle_dark_mode');
                },
              ),
            ],
          ),
        ),
        const PopupMenuDivider(height: 1),
        PopupMenuItem<String>(
          value: 'logout',
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppTheme.danger.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.logout,
                  size: 18,
                  color: AppTheme.danger,
                ),
              ),
              const SizedBox(width: 12),
              Text(
                l10n.logOut,
                style: GoogleFonts.roboto(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.danger,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
