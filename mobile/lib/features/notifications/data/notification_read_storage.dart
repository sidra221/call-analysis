import 'package:shared_preferences/shared_preferences.dart';

/// Mirrors React `localStorage` keys: `read_{type}_{id}`.
class NotificationReadStorage {
  static Future<bool> isUnread(String type, String id) async {
    final prefs = await SharedPreferences.getInstance();
    return !prefs.containsKey(_key(type, id));
  }

  static Future<void> markRead(String type, String id) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_key(type, id), true);
  }

  static String _key(String type, String id) => 'read_${type}_$id';
}
