class PaginatedResult<T> {
  final List<T> items;
  final int count;
  final bool hasMore;

  const PaginatedResult({
    required this.items,
    required this.count,
    required this.hasMore,
  });

  static PaginatedResult<T> fromJson<T>(
    Map<String, dynamic> response,
    T Function(Map<String, dynamic> json) mapper,
  ) {
    final data = response['data'] ?? response;
    if (data is! Map<String, dynamic>) {
      final list = data is List
          ? List<Map<String, dynamic>>.from(data)
          : <Map<String, dynamic>>[];
      return PaginatedResult(
        items: list.map(mapper).toList(),
        count: list.length,
        hasMore: false,
      );
    }

    final results = List<Map<String, dynamic>>.from(
      data['results'] ?? const [],
    );
    final count = (data['count'] as num?)?.toInt() ?? results.length;
    final next = data['next'];

    return PaginatedResult(
      items: results.map(mapper).toList(),
      count: count,
      hasMore: next != null,
    );
  }
}
