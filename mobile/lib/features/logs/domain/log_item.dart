enum LogType {
  activity,
  system,
  userAction,
}

class LogItem {
  final String id;
  final LogType type;
  final String title;
  final String description;
  final DateTime timestamp;
  final String? extra;

  LogItem({
    required this.id,
    required this.type,
    required this.title,
    required this.description,
    required this.timestamp,
    this.extra,
  });
}
