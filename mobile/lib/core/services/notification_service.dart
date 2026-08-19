import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  await NotificationService.showLocalNotification(message);
}

class NotificationService {
  static final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;

  static const AndroidNotificationChannel _channel = AndroidNotificationChannel(
    'call_analysis_channel',
    'Vocalys Notifications',
    description: 'Notifications for Vocalys call analysis updates',
    importance: Importance.high,
  );

  // INIT
  static Future<void> initialize() async {
    await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosInit = DarwinInitializationSettings();

    const initSettings = InitializationSettings(
      android: androidInit,
      iOS: iosInit,
    );

    await _localNotifications.initialize(
      settings: initSettings,
    );

    // Android channel
    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(_channel);

    FirebaseMessaging.onMessage.listen((message) {
      showLocalNotification(message);
      _saveNotification(message);
    });

    FirebaseMessaging.onMessageOpenedApp.listen((message) {
      _saveNotification(message);
    });

    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

    // token
    final token = await _messaging.getToken();
    if (token != null) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('fcm_token', token);
    }

    _messaging.onTokenRefresh.listen((token) async {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('fcm_token', token);
    });
  }

  // SHOW NOTIFICATION
 static Future<void> showLocalNotification(RemoteMessage message) async {
  final notification = message.notification;
  if (notification == null) return;

  await _localNotifications.show(
    id: 0,
    title: notification.title,
    body: notification.body,
    notificationDetails: NotificationDetails(
      android: AndroidNotificationDetails(
        _channel.id,
        _channel.name,
        channelDescription: _channel.description,
        importance: Importance.high,
        priority: Priority.high,
        icon: '@mipmap/ic_launcher',
      ),
      iOS: const DarwinNotificationDetails(
        presentAlert: true,
        presentBadge: true,
        presentSound: true,
      ),
    ),
  );
}
  

  // SAVE LOCAL
  static Future<void> _saveNotification(RemoteMessage message) async {
    final prefs = await SharedPreferences.getInstance();

    final notifications = prefs.getStringList('notifications') ?? [];

    final notif =
        '${message.notification?.title ?? ''} | '
        '${message.notification?.body ?? ''} | '
        '${DateTime.now().toIso8601String()}';

    notifications.insert(0, notif);

    if (notifications.length > 50) {
      notifications.removeLast();
    }

    await prefs.setStringList('notifications', notifications);
  }

  static Future<String?> getFcmToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('fcm_token');
  }
}