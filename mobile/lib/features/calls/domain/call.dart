import 'package:intl/intl.dart';
import '../../../shared/enums.dart';

class CallItem {
  final String id;
  final String callerName;
  final String callerNumber;
  final CallStatus status;
  final PriorityLevel priority;
  final Sentiment sentiment;
  final DateTime date;
  final String agentName;
  final int durationMinutes;

  const CallItem({
    required this.id,
    required this.callerName,
    required this.callerNumber,
    required this.status,
    required this.priority,
    required this.sentiment,
    required this.date,
    required this.agentName,
    required this.durationMinutes,
  });

  factory CallItem.fromJson(Map<String, dynamic> json) => CallItem(
        id: json['id'] as String,
        callerName: json['callerName'] as String,
        callerNumber: json['callerNumber'] as String,
        status: CallStatus.values.firstWhere((e) => e.name == json['status'], orElse: () => CallStatus.completed),
        priority: EnumParsers.fromString(json['priority'] as String),
        sentiment: SentimentParsers.fromString(json['sentiment'] as String),
        date: DateTime.parse(json['date'] as String),
        agentName: json['agentName'] as String? ?? 'John Doe',
        durationMinutes: json['durationMinutes'] as int? ?? 15,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'callerName': callerName,
        'callerNumber': callerNumber,
        'status': status.name,
        'priority': priority.name,
        'sentiment': sentiment.name,
        'date': date.toIso8601String(),
        'agentName': agentName,
        'durationMinutes': durationMinutes,
      };

  String get dateLabel => DateFormat.yMMMd().add_jm().format(date);
}

class CallDetails {
  final CallItem base;
  final String transcript;
  final String mainIssue;
  final List<String> keywords;
  final bool needsFollowUp;
  final bool isReviewed;
  final String? audioUrl;
  final String summary;
  final List<String> keyIssues;
  final List<String> notes;

  const CallDetails({
    required this.base,
    required this.transcript,
    required this.mainIssue,
    required this.keywords,
    required this.needsFollowUp,
    required this.isReviewed,
    this.audioUrl,
    required this.summary,
    required this.keyIssues,
    required this.notes,
  });

  factory CallDetails.fromJson(Map<String, dynamic> json) => CallDetails(
        base: CallItem.fromJson(json['base'] as Map<String, dynamic>),
        transcript: json['transcript'] as String,
        mainIssue: json['mainIssue'] as String,
        keywords: (json['keywords'] as List).map((e) => e.toString()).toList(),
        needsFollowUp: json['needsFollowUp'] as bool,
        isReviewed: json['isReviewed'] as bool? ?? false,
        audioUrl: json['audioUrl'] as String?,
        summary: json['summary'] as String? ?? 'Customer called regarding a billing discrepancy.',
        keyIssues: (json['keyIssues'] as List?)?.map((e) => e.toString()).toList() ?? ['Long wait time', 'Agent knowledge'],
        notes: (json['notes'] as List?)?.map((e) => e.toString()).toList() ?? [],
      );

  Map<String, dynamic> toJson() => {
        'base': base.toJson(),
        'transcript': transcript,
        'mainIssue': mainIssue,
        'keywords': keywords,
        'needsFollowUp': needsFollowUp,
        'isReviewed': isReviewed,
        'audioUrl': audioUrl,
        'summary': summary,
        'keyIssues': keyIssues,
        'notes': notes,
      };
}
