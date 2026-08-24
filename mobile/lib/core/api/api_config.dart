import 'package:flutter/foundation.dart';

class ApiConfig {
  /// Backend port exposed by docker-compose (`8001:8000`).
  static const int backendPort = 8001;

  /// Full API URL override — use for ngrok, e.g. https://abc.ngrok-free.app
  /// flutter build ... --dart-define=API_BASE_URL=https://your-subdomain.ngrok-free.app
  static const String baseUrlOverride = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: '',
  );

  /// LAN IP for physical devices — override: --dart-define=API_HOST=<IP>
  static const String host = String.fromEnvironment(
    'API_HOST',
    defaultValue: '172.23.216.187',
  );

  static String get baseUrl {
    final override = baseUrlOverride.trim();
    if (override.isNotEmpty) {
      return override.endsWith('/')
          ? override.substring(0, override.length - 1)
          : override;
    }

    if (kIsWeb) {
      return 'http://localhost:$backendPort';
    }

    // Android emulator reaches the host machine at 10.0.2.2.
    // Physical phones (Android + iOS) must use the laptop Wi‑Fi IP.
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
      case TargetPlatform.iOS:
        return 'http://$host:$backendPort';
      default:
        return 'http://localhost:$backendPort';
    }
  }

  static bool get usesNgrok => baseUrl.contains('ngrok');
}
