import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/logs_repository.dart';
import '../domain/log_item.dart';
import '../../../shared/widgets/app_pagination.dart';

class LogsFilter {
  final String search;
  final String action;
  final String username;
  final String date;

  const LogsFilter({
    this.search = '',
    this.action = 'all',
    this.username = '',
    this.date = '',
  });

  LogsFilter copyWith({
    String? search,
    String? action,
    String? username,
    String? date,
  }) {
    return LogsFilter(
      search: search ?? this.search,
      action: action ?? this.action,
      username: username ?? this.username,
      date: date ?? this.date,
    );
  }
}

class LogsState {
  final List<LogItem> items;
  final int page;
  final int totalCount;
  final bool isLoading;
  final bool hasMore;
  final LogsFilter filter;
  final List<String> userOptions;
  final String? error;

  const LogsState({
    this.items = const [],
    this.page = 1,
    this.totalCount = 0,
    this.isLoading = false,
    this.hasMore = true,
    this.filter = const LogsFilter(),
    this.userOptions = const [],
    this.error,
  });

  LogsState copyWith({
    List<LogItem>? items,
    int? page,
    int? totalCount,
    bool? isLoading,
    bool? hasMore,
    LogsFilter? filter,
    List<String>? userOptions,
    String? error,
  }) {
    return LogsState(
      items: items ?? this.items,
      page: page ?? this.page,
      totalCount: totalCount ?? this.totalCount,
      isLoading: isLoading ?? this.isLoading,
      hasMore: hasMore ?? this.hasMore,
      filter: filter ?? this.filter,
      userOptions: userOptions ?? this.userOptions,
      error: error,
    );
  }
}

class LogsController extends Notifier<LogsState> {
  static const _pageSize = 20;

  @override
  LogsState build() => const LogsState();

  Future<void> init() async {
    await Future.wait([refresh(), loadUsernames()]);
  }

  Future<void> loadUsernames() async {
    try {
      final repo = ref.read(logsRepositoryProvider);
      final usernames = await repo.getUsernames();
      state = state.copyWith(userOptions: usernames);
    } catch (_) {
      // Non-critical — filter autocomplete may be empty.
    }
  }

  Future<void> refresh() async {
    state = state.copyWith(isLoading: true, page: 1, error: null);
    try {
      final repo = ref.read(logsRepositoryProvider);
      final result = await repo.getLogs(
        page: 1,
        pageSize: _pageSize,
        search: state.filter.search,
        action: state.filter.action,
        username: state.filter.username,
        date: state.filter.date,
      );
      state = state.copyWith(
        items: result.items,
        page: 1,
        totalCount: result.count,
        hasMore: result.hasMore,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Failed to load logs');
    }
  }

  Future<void> goToPage(int page) async {
    if (state.isLoading || page < 1) return;
    final totalPages = totalPagesFor(state.totalCount, _pageSize);
    if (state.totalCount > 0 && page > totalPages) return;

    state = state.copyWith(isLoading: true, page: page, error: null);
    try {
      final repo = ref.read(logsRepositoryProvider);
      final result = await repo.getLogs(
        page: page,
        pageSize: _pageSize,
        search: state.filter.search,
        action: state.filter.action,
        username: state.filter.username,
        date: state.filter.date,
      );
      state = state.copyWith(
        items: result.items,
        page: page,
        totalCount: result.count,
        hasMore: result.hasMore,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Failed to load logs');
    }
  }

  Future<void> loadMore() async {
    if (state.isLoading || !state.hasMore) return;
    await goToPage(state.page + 1);
  }

  Future<void> applyFilter(LogsFilter filter) async {
    state = state.copyWith(filter: filter, page: 1);
    await refresh();
  }
}

final logsControllerProvider =
    NotifierProvider<LogsController, LogsState>(LogsController.new);
