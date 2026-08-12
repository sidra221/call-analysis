import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';

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
        destinations: const [
          NavigationDestination(
            icon: FaIcon(FontAwesomeIcons.house),
            selectedIcon: FaIcon(FontAwesomeIcons.houseChimney),
            label: 'Home',
          ),
          NavigationDestination(
            icon: FaIcon(FontAwesomeIcons.phone),
            selectedIcon: FaIcon(FontAwesomeIcons.phoneVolume),
            label: 'Calls',
          ),
          NavigationDestination(
            icon: FaIcon(FontAwesomeIcons.chartLine),
            selectedIcon: FaIcon(FontAwesomeIcons.chartLine),
            label: 'Reports',
          ),
          NavigationDestination(
            icon: FaIcon(FontAwesomeIcons.fileLines),
            selectedIcon: FaIcon(FontAwesomeIcons.fileLines),
            label: 'Logs',
          ),
        ],
      ),
    );
  }
}
