import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/enums.dart';
import '../data/calls_repository.dart';
import '../domain/call.dart';

class CallsFilter {
  final PriorityLevel? priority;
  final Sentiment? sentiment;
  const CallsFilter({this.priority, this.sentiment});
  CallsFilter copyWith({PriorityLevel? priority, Sentiment? sentiment}) => CallsFilter(priority: priority ?? this.priority, sentiment: sentiment ?? this.sentiment);
}

class CallsState {
  final List<CallItem> items;
  final int page;
  final bool isLoading;
  final bool hasMore;
  final CallsFilter filter;
  final String? error;
  const CallsState({this.items = const [], this.page = 1, this.isLoading = false, this.hasMore = true, this.filter = const CallsFilter(), this.error});
  CallsState copyWith({List<CallItem>? items, int? page, bool? isLoading, bool? hasMore, CallsFilter? filter, String? error}) =>
      CallsState(items: items ?? this.items, page: page ?? this.page, isLoading: isLoading ?? this.isLoading, hasMore: hasMore ?? this.hasMore, filter: filter ?? this.filter, error: error);
}

class CallsController extends Notifier<CallsState> {
  @override
  CallsState build() => const CallsState();

  Future<void> refresh() async {
    state = state.copyWith(isLoading: true, page: 1, error: null);
    try {
      final repo = ref.read(callsRepositoryProvider);
      final items = await repo.getCalls(page: 1, pageSize: 20, priority: state.filter.priority, sentiment: state.filter.sentiment);
      state = state.copyWith(items: items, page: 1, hasMore: items.length == 20, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Failed to load');
    }
  }

  Future<void> loadMore() async {
    if (state.isLoading || !state.hasMore) return;
    state = state.copyWith(isLoading: true);
    final next = state.page + 1;
    try {
      final repo = ref.read(callsRepositoryProvider);
      final items = await repo.getCalls(page: next, pageSize: 20, priority: state.filter.priority, sentiment: state.filter.sentiment);
      state = state.copyWith(items: [...state.items, ...items], page: next, hasMore: items.length == 20, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Failed to load more');
    }
  }

  Future<void> applyFilter(CallsFilter filter) async {
    state = state.copyWith(filter: filter, page: 1);
    await refresh();
  }
}

final callsControllerProvider = NotifierProvider<CallsController, CallsState>(CallsController.new);

final callDetailsProvider = FutureProvider.family<CallDetails, String>((ref, id) async {
  final repo = ref.watch(callsRepositoryProvider);
  return repo.getCallDetails(id);
});

