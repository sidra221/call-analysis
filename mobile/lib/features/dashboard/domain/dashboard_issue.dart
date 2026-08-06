enum Trend {
  up,
  down,
  stable,
}

class DashboardIssue {
  final String id;
  final String title;
  final int count;
  final double severity; // 0.0 - 1.0
  final Trend trend;
  final bool isPositive;

  DashboardIssue({
    required this.id,
    required this.title,
    required this.count,
    required this.severity,
    required this.trend,
    required this.isPositive,
  });
}
