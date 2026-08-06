class DashboardSummary {
  final int totalCalls;
  final int completedCalls;
  final int inProgressCalls;

  final int criticalPriorityCount;
  final int highPriorityCount;
  final int mediumPriorityCount;
  final int lowPriorityCount;

  final double positivePct;
  final double neutralPct;
  final double negativePct;

  const DashboardSummary({
    required this.totalCalls,
    required this.completedCalls,
    required this.inProgressCalls,

    required this.criticalPriorityCount,
    required this.highPriorityCount,
    required this.mediumPriorityCount,
    required this.lowPriorityCount,

    required this.positivePct,
    required this.neutralPct,
    required this.negativePct,
  });

  factory DashboardSummary.fromJson(Map<String, dynamic> json) =>
      DashboardSummary(
        totalCalls: json['totalCalls'] as int,
        completedCalls: json['completedCalls'] as int,
        inProgressCalls: json['inProgressCalls'] as int,

        criticalPriorityCount:
            json['criticalPriorityCount'] as int,
        highPriorityCount:
            json['highPriorityCount'] as int,
        mediumPriorityCount:
            json['mediumPriorityCount'] as int,
        lowPriorityCount:
            json['lowPriorityCount'] as int,

        positivePct: (json['positivePct'] as num).toDouble(),
        neutralPct: (json['neutralPct'] as num).toDouble(),
        negativePct: (json['negativePct'] as num).toDouble(),
      );

  Map<String, dynamic> toJson() => {
        'totalCalls': totalCalls,
        'completedCalls': completedCalls,
        'inProgressCalls': inProgressCalls,

        'criticalPriorityCount': criticalPriorityCount,
        'highPriorityCount': highPriorityCount,
        'mediumPriorityCount': mediumPriorityCount,
        'lowPriorityCount': lowPriorityCount,

        'positivePct': positivePct,
        'neutralPct': neutralPct,
        'negativePct': negativePct,
      };
}