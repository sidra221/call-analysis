class AppNotification {
  final String id;
  final String title;
  final String description;
  final DateTime time;
  final String type;
  final bool isRead;

  const AppNotification({
    required this.id,
    required this.title,
    required this.description,
    required this.time,
    required this.type,
    required this.isRead,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) =>
      AppNotification(
        id: json['id'],
        title: json['title'],
        description: json['description'],
        time: DateTime.parse(json['time']),
        type: json['type'],
        isRead: json['isRead'] ?? false,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'description': description,
        'time': time.toIso8601String(),
        'type': type,
        'isRead': isRead,
      };
}