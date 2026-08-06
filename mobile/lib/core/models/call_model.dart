



// ─────────────────────────────────────────
// Call Analysis Model
// ─────────────────────────────────────────
class CallAnalysis {
  final int id;
  final String? mainIssue;
  final String? sentiment;
  final double sentimentScore;
  final List<String> keywords;
  final String priority;
  final bool needsFollowup;
  final bool isReviewed;
  final String? transcript;

  CallAnalysis({
    required this.id,
    this.mainIssue,
    this.sentiment,
    required this.sentimentScore,
    required this.keywords,
    required this.priority,
    required this.needsFollowup,
    required this.isReviewed,
    this.transcript,
  });

  factory CallAnalysis.fromJson(Map<String, dynamic> json) {
    return CallAnalysis(
      id: json['id'] ?? 0,
      mainIssue: json['main_issue'],
      sentiment: json['sentiment'],
      sentimentScore: (json['sentiment_score'] ?? 0).toDouble(),
      keywords: List<String>.from(json['keywords'] ?? []),
      priority: json['priority'] ?? 'low',
      needsFollowup: json['needs_followup'] ?? false,
      isReviewed: json['is_reviewed'] ?? false,
      transcript: json['transcript'],
    );
  }
}

// ─────────────────────────────────────────
// Call Model
// ─────────────────────────────────────────
class CallModel {
  final String id;
  final String status;
  final double duration;
  final String createdAt;
  final String? uploadedByUsername;
  final CallAnalysis? analysis;

  CallModel({
    required this.id,
    required this.status,
    required this.duration,
    required this.createdAt,
    this.uploadedByUsername,
    this.analysis,
  });

  factory CallModel.fromJson(Map<String, dynamic> json) {
    return CallModel(
      id: json['id'] ?? '',
      status: json['status'] ?? 'pending',
      duration: (json['duration'] ?? 0).toDouble(),
      createdAt: json['created_at'] ?? '',
      uploadedByUsername: json['uploaded_by_username'],
      analysis: json['analysis'] != null
          ? CallAnalysis.fromJson(json['analysis'])
          : null,
    );
  }
}


