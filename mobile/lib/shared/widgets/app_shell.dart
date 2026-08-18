import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../l10n/app_localizations.dart';

class AppShell extends ConsumerWidget {
  final Widget child;
  const AppShell({super.key, required this.child});

  int _indexForLocation(BuildContext context) {
    final loc = GoRouterState.of(context).uri.toString();
    if (loc.startsWith('/home')) return 0;
    if (loc.startsWith('/calls')) return 1;
    if (loc.startsWith('/reports')) return 2;
    if (loc.startsWith('/logs')) return 3;
    return 0;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final idx = _indexForLocation(context);
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: idx,
        elevation: 0,
        backgroundColor: scheme.surface,
        onDestinationSelected: (i) {
          switch (i) {
            case 0:
              context.go('/home');
              break;
            case 1:
              context.go('/calls');
              break;
            case 2:
              context.go('/reports');
              break;
            case 3:
              context.go('/logs');
              break;
          }
        },
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.home),
            selectedIcon: const Icon(Icons.home),
            label: l10n.home,
          ),
          NavigationDestination(
            icon: const Icon(Icons.phone),
            selectedIcon: const Icon(Icons.phone_in_talk),
            label: l10n.calls,
          ),
          NavigationDestination(
            icon: const Icon(Icons.analytics),
            selectedIcon: const Icon(Icons.analytics),
            label: l10n.reports,
          ),
          NavigationDestination(
            icon: const Icon(Icons.description),
            selectedIcon: const Icon(Icons.description),
            label: l10n.logs,
          ),
        ],
      ),
    );
  }
}
