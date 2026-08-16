class ReportIssue {
  final String title;
  final int count;

  const ReportIssue({required this.title, required this.count});
}

class Report {
  final String id;
  final String title;
  final String period;
  final DateTime date;
  final String summary;
  final String recommendations;
  final String positives;
  final List<ReportIssue> topIssues;
  final Map<String, dynamic> sentimentStats;
  final String managerNotes;
  final String createdByUsername;

  const Report({
    required this.id,
    required this.title,
    required this.period,
    required this.date,
    required this.summary,
    required this.recommendations,
    required this.positives,
    required this.topIssues,
    required this.sentimentStats,
    required this.managerNotes,
    required this.createdByUsername,
  });

  String get overallSentiment {
    if (sentimentStats.isEmpty) return 'neutral';
    var best = 'neutral';
    var bestCount = -1;
    for (final entry in sentimentStats.entries) {
      final count = entry.value is num ? (entry.value as num).toInt() : 0;
      if (count > bestCount) {
        bestCount = count;
        best = entry.key.toString();
      }
    }
    return best;
  }

  factory Report.fromJson(Map<String, dynamic> json) => Report(
        id: json['id'] as String,
        title: json['title'] as String,
        period: json['period'] as String? ?? '',
        date: DateTime.parse(json['date'] as String),
        summary: json['summary'] as String,
        recommendations: json['recommendations'] as String,
        positives: json['positives'] as String? ?? '',
        topIssues: (json['topIssues'] as List?)
                ?.map((e) => ReportIssue(
                      title: e['title'] as String,
                      count: e['count'] as int,
                    ))
                .toList() ??
            const [],
        sentimentStats: Map<String, dynamic>.from(json['sentimentStats'] ?? {}),
        managerNotes: json['managerNotes'] as String? ?? '',
        createdByUsername: json['createdByUsername'] as String? ?? '',
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'period': period,
        'date': date.toIso8601String(),
        'summary': summary,
        'recommendations': recommendations,
        'positives': positives,
        'topIssues': topIssues
            .map((e) => {'title': e.title, 'count': e.count})
            .toList(),
        'sentimentStats': sentimentStats,
        'managerNotes': managerNotes,
        'createdByUsername': createdByUsername,
      };
}
