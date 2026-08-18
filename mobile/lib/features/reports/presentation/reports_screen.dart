import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_staggered_animations/flutter_staggered_animations.dart';
import 'package:intl/intl.dart';
import '../../../shared/widgets/ui.dart';
import '../../../shared/widgets/app_pagination.dart';
import '../application/reports_providers.dart';
import '../domain/report.dart';
import 'report_download_button.dart';
import '../../../core/theme/app_theme.dart';
import '../../../l10n/app_localizations.dart';

class ReportsScreen extends ConsumerStatefulWidget {
  const ReportsScreen({super.key});

  @override
  ConsumerState<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends ConsumerState<ReportsScreen> {
  static const _pageSize = 5;
  int _currentPage = 0;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final async = ref.watch(reportsProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.reports),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/home');
            }
          },
        ),
      ),
      body: SafeArea(
        child: async.when(
          data: (list) {
            if (list.isEmpty) {
              return EmptyView(
                message: l10n.noReports,
                subtitle: l10n.checkBackLater,
                icon: Icons.description,
              );
            }

            final totalPages = totalPagesFor(list.length, _pageSize);
            if (_currentPage >= totalPages) {
              WidgetsBinding.instance.addPostFrameCallback((_) {
                if (mounted) setState(() => _currentPage = totalPages - 1);
              });
            }

            final pageItems = paginateList(list, _currentPage, _pageSize);

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
                      itemBuilder: (context, i) =>
                          AnimationConfiguration.staggeredList(
                        position: i,
                        duration: const Duration(milliseconds: 375),
                        child: SlideAnimation(
                          verticalOffset: 50,
                          child: FadeInAnimation(
                            child: _ReportTile(r: pageItems[i]),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                AppPaginationBar(
                  currentPage: _currentPage,
                  totalPages: totalPages,
                  totalItems: list.length,
                  pageSize: _pageSize,
                  onPageChanged: (page) => setState(() => _currentPage = page),
                ),
              ],
            );
          },
          error: (e, _) => ErrorView(
            message: l10n.failedToLoadReports,
            onRetry: () => ref.invalidate(reportsProvider),
          ),
          loading: () =>
              const Center(child: CircularProgressIndicator.adaptive()),
        ),
      ),
    );
  }
}

class _ReportTile extends StatelessWidget {
  final Report r;

  const _ReportTile({required this.r});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: AppCard(
        onTap: () => context.push('/reports/${r.id}'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppTheme.info.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.description,
                    size: 24,
                    color: AppTheme.info,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    r.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                  ),
                ),
                ReportDownloadButton(report: r, compact: true),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              r.summary,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Icon(
                  Icons.calendar_today,
                  size: 14,
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
                const SizedBox(width: 8),
                Text(
                  DateFormat.yMMMMd().format(r.date),
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
