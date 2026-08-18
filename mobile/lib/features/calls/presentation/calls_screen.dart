import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_staggered_animations/flutter_staggered_animations.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../shared/enums.dart';
import '../../../shared/widgets/ui.dart';
import '../../../shared/widgets/app_pagination.dart';
import '../../../shared/widgets/app_filters.dart';
import '../../../shared/widgets/call_tile.dart';
import '../application/calls_controller.dart';
import '../domain/call.dart';
import '../../../l10n/app_localizations.dart';

class CallsScreen extends ConsumerStatefulWidget {
  const CallsScreen({super.key});

  @override
  ConsumerState<CallsScreen> createState() => _CallsScreenState();
}

class _CallsScreenState extends ConsumerState<CallsScreen> {
  final ScrollController _scrollCtrl = ScrollController();
  final TextEditingController _searchCtrl = TextEditingController();

  String _searchQuery = '';

  @override
  void initState() {
    super.initState();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(callsControllerProvider.notifier).refresh();
    });

    _searchCtrl.addListener(() {
      setState(() {
        _searchQuery = _searchCtrl.text.trim().toLowerCase();
      });
    });
  }

  @override
  void dispose() {
    _scrollCtrl.dispose();
    _searchCtrl.dispose();
    super.dispose();
  }

  List<CallItem> _filterItems(List<CallItem> items) {
    if (_searchQuery.isEmpty) return items;

    return items.where((item) {
      final name = item.callerName.toLowerCase();
      final number = item.callerNumber.toLowerCase();
      final id = item.id.toLowerCase();

      return name.contains(_searchQuery) ||
          number.contains(_searchQuery) ||
          id.contains(_searchQuery);
    }).toList();
  }

  void _clearSearch() {
    _searchCtrl.clear();
    FocusScope.of(context).unfocus();
  }

  Widget _buildTopSection(BuildContext context, CallsState state) {
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;
    final activeFilterCount = _activeFilterCount(state);

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
      child: AppFilterToolbar(
        activeFilterCount: activeFilterCount,
        showReset: activeFilterCount > 0 || _searchQuery.isNotEmpty,
        onResetFilters: () {
          _searchCtrl.clear();
          ref.read(callsControllerProvider.notifier).applyFilter(const CallsFilter());
          setState(() => _searchQuery = '');
        },
        filterPanel: _CallsFilterSheet(
          initialFilter: state.filter,
          onFilterChanged: (filter) {
            ref.read(callsControllerProvider.notifier).applyFilter(filter);
          },
        ),
        searchField: TextField(
          controller: _searchCtrl,
          onChanged: (value) {
            setState(() {
              _searchQuery = value.trim().toLowerCase();
            });
          },
          decoration: InputDecoration(
            hintText: l10n.searchCalls,
            hintStyle: GoogleFonts.roboto(
              fontSize: 14,
              color: scheme.onSurfaceVariant,
            ),
            prefixIcon: const Icon(Icons.search),
            suffixIcon: _searchQuery.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.clear_rounded),
                    onPressed: _clearSearch,
                  )
                : null,
            filled: true,
            fillColor: scheme.surfaceContainerHighest.withValues(
              alpha: 0.45,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide.none,
            ),
          ),
        ),
      ),
    );
  }

  int _activeFilterCount(CallsState state) {
    var count = 0;
    if (state.filter.priority != null) count++;
    if (state.filter.sentiment != null) count++;
    return count;
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final state = ref.watch(callsControllerProvider);
    final filteredItems = _filterItems(state.items);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.calls),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back,
            size: 18,
          ),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/home');
            }
          },
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            _buildTopSection(context, state),

            // Calls list
            Expanded(
              child: RefreshIndicator.adaptive(
                onRefresh: () {
                  return ref
                      .read(callsControllerProvider.notifier)
                      .refresh();
                },
                child: state.isLoading && state.items.isEmpty
                    ? const Center(
                        child: CircularProgressIndicator.adaptive(),
                      )
                    : filteredItems.isEmpty
                        ? EmptyView(
                            message: l10n.noCallsFound,
                            subtitle: l10n.tryChangingFilters,
                          )
                        : AnimationLimiter(
                            child: ListView.builder(
                              controller: _scrollCtrl,
                              physics: const AlwaysScrollableScrollPhysics(),
                              padding: const EdgeInsets.fromLTRB(
                                20,
                                8,
                                20,
                                16,
                              ),
                              itemCount: filteredItems.length,
                              itemBuilder: (context, index) {
                                final call = filteredItems[index];

                                return AnimationConfiguration.staggeredList(
                                  position: index,
                                  duration: const Duration(
                                    milliseconds: 375,
                                  ),
                                  child: SlideAnimation(
                                    verticalOffset: 40,
                                    child: FadeInAnimation(
                                      child: CallTile(item: call),
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
              ),
            ),
            AppPaginationBar(
              currentPage: state.page - 1,
              totalPages: totalPagesFor(state.totalCount, 20),
              totalItems: state.totalCount,
              pageSize: 20,
              isLoading: state.isLoading,
              onPageChanged: (page) => ref
                  .read(callsControllerProvider.notifier)
                  .goToPage(page + 1),
            ),
          ],
        ),
      ),
    );
  }
}

// -----------------------------------------------------------------------------
// CALLS FILTER SHEET — dropdowns like React Calls.jsx (apply on change)
// -----------------------------------------------------------------------------

class _CallsFilterSheet extends StatefulWidget {
  final CallsFilter initialFilter;
  final ValueChanged<CallsFilter> onFilterChanged;

  const _CallsFilterSheet({
    required this.initialFilter,
    required this.onFilterChanged,
  });

  @override
  State<_CallsFilterSheet> createState() => _CallsFilterSheetState();
}

class _CallsFilterSheetState extends State<_CallsFilterSheet> {
  late PriorityLevel? _priority;
  late Sentiment? _sentiment;

  @override
  void initState() {
    super.initState();
    _priority = widget.initialFilter.priority;
    _sentiment = widget.initialFilter.sentiment;
  }

  @override
  void didUpdateWidget(_CallsFilterSheet oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.initialFilter.priority != widget.initialFilter.priority ||
        oldWidget.initialFilter.sentiment != widget.initialFilter.sentiment) {
      _priority = widget.initialFilter.priority;
      _sentiment = widget.initialFilter.sentiment;
    }
  }

  void _apply() {
    widget.onFilterChanged(
      CallsFilter(
        priority: _priority,
        sentiment: _sentiment,
        search: widget.initialFilter.search,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AppExpandingSelect<PriorityLevel>(
          label: l10n.priority,
          value: _priority,
          options: [
            AppSelectOption(label: l10n.allCalls),
            AppSelectOption(
              value: PriorityLevel.critical,
              label: l10n.criticalPriority,
            ),
            AppSelectOption(
              value: PriorityLevel.high,
              label: l10n.highPriority,
            ),
            AppSelectOption(
              value: PriorityLevel.medium,
              label: l10n.mediumPriority,
            ),
            AppSelectOption(
              value: PriorityLevel.low,
              label: l10n.lowPriority,
            ),
          ],
          onChanged: (value) {
            setState(() => _priority = value);
            _apply();
          },
        ),
        const SizedBox(height: 14),
        AppExpandingSelect<Sentiment>(
          label: l10n.sentiment,
          value: _sentiment,
          options: [
            AppSelectOption(label: l10n.allCalls),
            AppSelectOption(
              value: Sentiment.positive,
              label: l10n.sentimentPositive,
            ),
            AppSelectOption(
              value: Sentiment.neutral,
              label: l10n.sentimentNeutral,
            ),
            AppSelectOption(
              value: Sentiment.negative,
              label: l10n.sentimentNegative,
            ),
          ],
          onChanged: (value) {
            setState(() => _sentiment = value);
            _apply();
          },
        ),
      ],
    );
  }
}