
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/splash_screen.dart';
import '../../features/dashboard/presentation/dashboard_screen.dart';
import '../../features/calls/presentation/calls_screen.dart';
import '../../features/calls/presentation/call_details_screen.dart';
import '../../features/reports/presentation/reports_screen.dart';
import '../../features/reports/presentation/report_details_screen.dart';
import '../../features/logs/presentation/logs_screen.dart';
import '../../features/notifications/presentation/notifications_screen.dart';
import '../../shared/widgets/app_shell.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(
        path: '/',
        name: 'splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/login',
        name: 'login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/notifications',
        name: 'notifications',
        builder: (context, state) => const NotificationsScreen(),
      ),
      ShellRoute(
        builder: (context, state, child) => AppShell(child: child),
        routes: [
          GoRoute(
            path: '/home',
            name: 'home',
            pageBuilder: (context, state) => const NoTransitionPage(child: DashboardScreen()),
          ),
          GoRoute(
            path: '/calls',
            name: 'calls',
            pageBuilder: (context, state) => const NoTransitionPage(child: CallsScreen()),
            routes: [
              GoRoute(
                path: ':id',
                name: 'call-details',
                builder: (context, state) => CallDetailsScreen(callId: state.pathParameters['id']!),
              ),
            ],
          ),
          GoRoute(
            path: '/reports',
            name: 'reports',
            pageBuilder: (context, state) => const NoTransitionPage(child: ReportsScreen()),
            routes: [
              GoRoute(
                path: ':id',
                name: 'report-details',
                builder: (context, state) => ReportDetailsScreen(reportId: state.pathParameters['id']!),
              ),
            ],
          ),
          GoRoute(
            path: '/logs',
            name: 'logs',
            pageBuilder: (context, state) => const NoTransitionPage(child: LogsScreen()),
          ),
        ],
      ),
    ],
  );
});
