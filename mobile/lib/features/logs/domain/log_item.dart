class LogItem {
  final String id;
  final String action;
  final String username;
  final String description;
  final DateTime timestamp;

  LogItem({
    required this.id,
    required this.action,
    required this.username,
    required this.description,
    required this.timestamp,
  });
}
