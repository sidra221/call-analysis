import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../l10n/app_localizations.dart';
import '../../../shared/widgets/ui.dart';
import '../../calls/application/calls_controller.dart';
import '../application/dashboard_providers.dart';
import 'dashboard_screen.dart';

class DashboardIssuesScreen extends ConsumerWidget {
  final bool isPositive;

  const DashboardIssuesScreen({
    super.key,
    required this.isPositive,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final issuesAsync = isPositive
        ? ref.watch(topPositiveIssuesProvider)
        : ref.watch(topNegativeIssuesProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          isPositive ? l10n.topPositiveFeedback : l10n.topNegativeIssues,
        ),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, size: 18),
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
        child: issuesAsync.when(
          data: (issues) {
            if (issues.isEmpty) {
              return EmptyView(message: l10n.noIssuesData);
            }

            return RefreshIndicator.adaptive(
              onRefresh: () async {
                ref.invalidate(
                  isPositive
                      ? topPositiveIssuesProvider
                      : topNegativeIssuesProvider,
                );
              },
              child: ListView.separated(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
                itemCount: issues.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  return HorizontalIssueCard(
                    issue: issues[index],
                    fullWidth: true,
                    onTap: () {
                      ref.read(callsControllerProvider.notifier).applyFilter(
                            CallsFilter(search: issues[index].title),
                          );
                      context.go('/calls');
                    },
                  );
                },
              ),
            );
          },
          error: (_, __) => ErrorView(
            message: l10n.failedToLoadSummary,
            onRetry: () => ref.invalidate(
              isPositive
                  ? topPositiveIssuesProvider
                  : topNegativeIssuesProvider,
            ),
          ),
          loading: () => const Center(
            child: CircularProgressIndicator.adaptive(),
          ),
        ),
      ),
    );
  }
}
