import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:flutter_staggered_animations/flutter_staggered_animations.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../shared/widgets/ui.dart';
import '../../../shared/widgets/call_tile.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/theme_provider.dart';
import '../../../features/notifications/application/notifications_provider.dart';
import '../../../features/auth/application/auth_controller.dart';
import '../../../features/auth/domain/user_profile.dart';
import '../application/dashboard_providers.dart';
import '../domain/dashboard_issue.dart';
import 'sentiment_chart.dart';
import '../../../l10n/app_localizations.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final userAsync = ref.watch(userProfileProvider);
    final summaryAsync = ref.watch(dashboardSummaryProvider);
    final negIssuesAsync = ref.watch(topNegativeIssuesProvider);
    final posIssuesAsync = ref.watch(topPositiveIssuesProvider);
    final followUpCallsAsync = ref.watch(priorityFollowUpCallsProvider);
     final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator.adaptive(
          onRefresh: () async {
            ref.invalidate(userProfileProvider);
            ref.invalidate(dashboardSummaryProvider);
            ref.invalidate(topNegativeIssuesProvider);
            ref.invalidate(topPositiveIssuesProvider);
            ref.invalidate(priorityFollowUpCallsProvider);
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
  child: Row(
    children: [
      Text(
        '${l10n.welcomeBack} ',
        style: GoogleFonts.plusJakartaSans(
          fontSize: 14,
          color: AppTheme.textSecondary,
          fontWeight: FontWeight.w500,
        ),
      ),
      Flexible(
        child: Text(
          user.name.split(' ').first,
          overflow: TextOverflow.ellipsis,
          style: GoogleFonts.plusJakartaSans(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: AppTheme.textPrimary,
            letterSpacing: -0.5,
          ),
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
  icon: FaIcon(
    FontAwesomeIcons.bell,
    size: 20,
    color: isDark
        ? Colors.white
        : AppTheme.textSecondary,
  ),
  style: IconButton.styleFrom(
    backgroundColor: isDark
        ? AppTheme.surface
        : Colors.white,
    side: BorderSide(
      color: isDark
          ? AppTheme.divider
          : AppTheme.textSecondary,
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
                          Row(
  children: [
    Expanded(
      child: PriorityCard(
        icon: FontAwesomeIcons.triangleExclamation,
        title: 'Critical Priority',
        value: summary.criticalPriorityCount.toString(),
        color: AppTheme.danger,
      ),
    ),
    const SizedBox(width: 12),
    Expanded(
      child: PriorityCard(
        icon: FontAwesomeIcons.arrowUp,
        title: 'High Priority',
        value: summary.highPriorityCount.toString(),
        color: AppTheme.warning,
      ),
    ),
  ],
),
const SizedBox(height: 12),
Row(
  children: [
    Expanded(
      child: PriorityCard(
        icon: FontAwesomeIcons.minus,
        title: 'Medium Priority',
        value: summary.mediumPriorityCount.toString(),
        color: const Color(0xFFEAB308),
      ),
    ),
    const SizedBox(width: 12),
    Expanded(
      child: PriorityCard(
        icon: FontAwesomeIcons.arrowDown,
        title: 'Low Priority',
        value: summary.lowPriorityCount.toString(),
        color: AppTheme.success,
      ),
    ),
  ],
),
                          const SizedBox(height: 12),
                          AppCard(
                            child: SentimentChart(
                              positivePct: summary.positivePct,
                              neutralPct: summary.neutralPct,
                              negativePct: summary.negativePct,
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
                padding: const EdgeInsets.fromLTRB(20, 8, 0, 8),
                sliver: SliverToBoxAdapter(
                  child: Text(
                    l10n.topNegativeIssues,
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.textPrimary,
                      letterSpacing: -0.5,
                    ),
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
                                child: HorizontalIssueCard(issue: issues[i]),
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
                padding: const EdgeInsets.fromLTRB(20, 8, 0, 8),
                sliver: SliverToBoxAdapter(
                  child: Text(
                    l10n.topPositiveFeedback,
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.textPrimary,
                      letterSpacing: -0.5,
                    ),
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
                                child: HorizontalIssueCard(issue: issues[i]),
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
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
                sliver: SliverToBoxAdapter(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        l10n.priorityFollowUps,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.textPrimary,
                          letterSpacing: -0.5,
                        ),
                      ),
                      TextButton(
                        onPressed: () => context.go('/calls'),
                        child: Text(
                          l10n.viewAll,
                          style: GoogleFonts.plusJakartaSans(
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
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
                sliver: followUpCallsAsync.when(
                  data: (calls) => SliverList.list(
                    children: AnimationConfiguration.toStaggeredList(
                      duration: const Duration(milliseconds: 375),
                      childAnimationBuilder: (widget) => SlideAnimation(
                        verticalOffset: 50,
                        child: FadeInAnimation(child: widget),
                      ),
                      children: calls.map((call) => CallTile(item: call)).toList(),
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
  final FaIconData icon;
  final String title;
  final String value;
  final Color color;

  const PriorityCard({
    super.key,
    required this.icon,
    required this.title,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Container(
      height: 92,
      padding: const EdgeInsets.symmetric(
        horizontal: 14,
        vertical: 12,
      ),
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color:AppTheme.textSecondary,
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
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
              child: FaIcon(
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
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: scheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  value,
                  style: GoogleFonts.plusJakartaSans(
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
    );
  }
}

class HorizontalIssueCard extends StatelessWidget {
  final DashboardIssue issue;
  const HorizontalIssueCard({super.key, required this.issue});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final color = issue.isPositive ? AppTheme.success : AppTheme.danger;
    final screenWidth = MediaQuery.of(context).size.width;
    final cardWidth = (screenWidth - 48) / 2;

    return SizedBox(
      width: cardWidth,
      child: AppCard(
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
                    color: color.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: color.withValues(alpha: 0.2),
                      width: 1,
                    ),
                  ),
                  child: FaIcon(
                    issue.isPositive ? FontAwesomeIcons.thumbsUp : FontAwesomeIcons.thumbsDown,
                    size: 18,
                    color: color,
                  ),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: _trendColor(issue.trend, issue.isPositive).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: _trendColor(issue.trend, issue.isPositive).withValues(alpha: 0.2),
                      width: 1,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      FaIcon(
                        _trendIcon(issue.trend),
                        size: 12,
                        color: _trendColor(issue.trend, issue.isPositive),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        _trendLabel(context, issue.trend),
                        style: GoogleFonts.plusJakartaSans(
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
              style: GoogleFonts.plusJakartaSans(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppTheme.textPrimary,
                letterSpacing: -0.2,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 8),
            Text(
              '${issue.count} ${l10n.mentions}',
              style: GoogleFonts.plusJakartaSans(
                fontSize: 12,
                color: AppTheme.textSecondary,
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

  FaIconData _trendIcon(Trend trend) {
    switch (trend) {
      case Trend.up:
        return FontAwesomeIcons.arrowTrendUp;
      case Trend.down:
        return FontAwesomeIcons.arrowTrendDown;
      case Trend.stable:
        return FontAwesomeIcons.minus;
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
    final isDarkMode = themeMode == ThemeMode.dark ||
        (themeMode == ThemeMode.system &&
            MediaQuery.of(context).platformBrightness == Brightness.dark);
final isDark = Theme.of(context).brightness == Brightness.dark;
    return PopupMenuButton<String>(
   

icon: Container(
  padding: const EdgeInsets.all(12),
  decoration: BoxDecoration(
    color: isDark
        ? AppTheme.surface
        : Colors.white,
    shape: BoxShape.circle,
    border: Border.all(
      color: isDark
          ? AppTheme.divider
          : AppTheme.textSecondary,
    ),
  ),
  child: FaIcon(
    FontAwesomeIcons.user,
    size: 20,
    color: isDark
        ? Colors.white
        : AppTheme.textSecondary,
  ),
),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      color: Theme.of(context).colorScheme.surface,
      elevation: 8,
      position: PopupMenuPosition.under,
      onSelected: (value) async {
        if (value == 'toggle_dark_mode') {
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
                TextButton(
                  onPressed: () => Navigator.pop(context, false),
                  child: Text(MaterialLocalizations.of(context).cancelButtonLabel),
                ),
                ElevatedButton(
                  onPressed: () => Navigator.pop(context, true),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.danger,
                    foregroundColor: Colors.white,
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
                    child: const FaIcon(
                      FontAwesomeIcons.user,
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
                          user?.name ?? 'User',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          l10n.manager,
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: AppTheme.textSecondary,
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
                child: FaIcon(
                  isDarkMode ? FontAwesomeIcons.moon : FontAwesomeIcons.sun,
                  size: 18,
                  color: isDarkMode ? AppTheme.primary : AppTheme.warning,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  isDarkMode ? l10n.darkMode : l10n.lightMode,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textPrimary,
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
                child: const FaIcon(
                  FontAwesomeIcons.rightFromBracket,
                  size: 18,
                  color: AppTheme.danger,
                ),
              ),
              const SizedBox(width: 12),
              Text(
                l10n.logOut,
                style: GoogleFonts.plusJakartaSans(
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
