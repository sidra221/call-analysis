class Report {
  final String id;
  final String title;
  final DateTime date;
  final String summary;
  final String recommendations;

  const Report({required this.id, required this.title, required this.date, required this.summary, required this.recommendations});

  factory Report.fromJson(Map<String, dynamic> json) => Report(
        id: json['id'] as String,
        title: json['title'] as String,
        date: DateTime.parse(json['date'] as String),
        summary: json['summary'] as String,
        recommendations: json['recommendations'] as String,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'date': date.toIso8601String(),
        'summary': summary,
        'recommendations': recommendations,
      };
}

