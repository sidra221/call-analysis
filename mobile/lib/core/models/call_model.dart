List<String> parseCallKeywords(dynamic raw) {
  if (raw == null) return const [];

  if (raw is List) {
    return raw
        .whereType<String>()
        .map((item) => item.trim())
        .where((item) => item.isNotEmpty)
        .toList();
  }

  if (raw is Map) {
    final map = Map<String, dynamic>.from(raw);
    final display = map['display'];
    if (display is List) {
      final fromDisplay = <String>[];
      for (final item in display) {
        if (item is Map && item['text'] is String) {
          final text = (item['text'] as String).trim();
          if (text.isNotEmpty) fromDisplay.add(text);
        } else if (item is String && item.trim().isNotEmpty) {
          fromDisplay.add(item.trim());
        }
      }
      if (fromDisplay.isNotEmpty) return fromDisplay;
    }

    final merged = <String>[];
    final seen = <String>{};
    for (final bucket in ['negative', 'positive', 'neutral']) {
      final items = map[bucket];
      if (items is! List) continue;
      for (final item in items) {
        if (item is! String) continue;
        final text = item.trim();
        final key = text.toLowerCase();
        if (text.isNotEmpty && seen.add(key)) merged.add(text);
      }
    }
    return merged;
  }

  return const [];
}

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
      id: json['id'] is int ? json['id'] as int : int.tryParse('${json['id']}') ?? 0,
      mainIssue: json['main_issue'] as String?,
      sentiment: json['sentiment'] as String?,
      sentimentScore: (json['sentiment_score'] ?? 0).toDouble(),
      keywords: parseCallKeywords(json['keywords']),
      priority: json['priority']?.toString() ?? 'low',
      needsFollowup: json['needs_followup'] == true,
      isReviewed: json['is_reviewed'] == true,
      transcript: json['transcript'] as String?,
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
  final String? audioFile;
  final CallAnalysis? analysis;

  CallModel({
    required this.id,
    required this.status,
    required this.duration,
    required this.createdAt,
    this.uploadedByUsername,
    this.audioFile,
    this.analysis,
  });

  factory CallModel.fromJson(Map<String, dynamic> json) {
    return CallModel(
      id: json['id']?.toString() ?? '',
      status: json['status']?.toString() ?? 'pending',
      duration: (json['duration'] ?? 0).toDouble(),
      createdAt: json['created_at']?.toString() ?? '',
      uploadedByUsername: json['uploaded_by_username'] as String?,
      audioFile: json['audio_file'] as String?,
      analysis: json['analysis'] is Map<String, dynamic>
          ? CallAnalysis.fromJson(json['analysis'] as Map<String, dynamic>)
          : null,
    );
  }
}
