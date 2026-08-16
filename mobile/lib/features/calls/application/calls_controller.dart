import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/enums.dart';
import '../../../shared/widgets/app_pagination.dart';
import '../data/calls_repository.dart';
import '../domain/call.dart';

class CallsFilter {
  final PriorityLevel? priority;
  final Sentiment? sentiment;
  const CallsFilter({this.priority, this.sentiment});
  CallsFilter copyWith({PriorityLevel? priority, Sentiment? sentiment}) =>
      CallsFilter(
        priority: priority ?? this.priority,
        sentiment: sentiment ?? this.sentiment,
      );
}

class CallsState {
  final List<CallItem> items;
  final int page;
  final int totalCount;
  final bool isLoading;
  final bool hasMore;
  final CallsFilter filter;
  final String? error;

  const CallsState({
    this.items = const [],
    this.page = 1,
    this.totalCount = 0,
    this.isLoading = false,
    this.hasMore = true,
    this.filter = const CallsFilter(),
    this.error,
  });

  CallsState copyWith({
    List<CallItem>? items,
    int? page,
    int? totalCount,
    bool? isLoading,
    bool? hasMore,
    CallsFilter? filter,
    String? error,
  }) =>
      CallsState(
        items: items ?? this.items,
        page: page ?? this.page,
        totalCount: totalCount ?? this.totalCount,
        isLoading: isLoading ?? this.isLoading,
        hasMore: hasMore ?? this.hasMore,
        filter: filter ?? this.filter,
        error: error,
      );
}

class CallsController extends Notifier<CallsState> {
  static const _pageSize = 20;

  @override
  CallsState build() => const CallsState();

  Future<void> refresh() async {
    state = state.copyWith(isLoading: true, page: 1, error: null);
    try {
      final repo = ref.read(callsRepositoryProvider);
      final result = await repo.getCalls(
        page: 1,
        pageSize: _pageSize,
        priority: state.filter.priority,
        sentiment: state.filter.sentiment,
      );
      state = state.copyWith(
        items: result.items,
        page: 1,
        totalCount: result.count,
        hasMore: result.hasMore,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Failed to load');
    }
  }

  Future<void> goToPage(int page) async {
    if (state.isLoading || page < 1) return;
    final totalPages = totalPagesFor(state.totalCount, _pageSize);
    if (state.totalCount > 0 && page > totalPages) return;

    state = state.copyWith(isLoading: true, page: page, error: null);
    try {
      final repo = ref.read(callsRepositoryProvider);
      final result = await repo.getCalls(
        page: page,
        pageSize: _pageSize,
        priority: state.filter.priority,
        sentiment: state.filter.sentiment,
      );
      state = state.copyWith(
        items: result.items,
        page: page,
        totalCount: result.count,
        hasMore: result.hasMore,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Failed to load');
    }
  }

  Future<void> loadMore() async {
    if (state.isLoading || !state.hasMore) return;
    await goToPage(state.page + 1);
  }

  Future<void> applyFilter(CallsFilter filter) async {
    state = state.copyWith(filter: filter, page: 1);
    await refresh();
  }
}

final callsControllerProvider =
    NotifierProvider<CallsController, CallsState>(CallsController.new);

final callDetailsProvider = FutureProvider.family<CallDetails, String>((ref, id) async {
  final repo = ref.watch(callsRepositoryProvider);
  return repo.getCallDetails(id);
});
