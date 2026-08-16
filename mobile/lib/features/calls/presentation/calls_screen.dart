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
        onOpenFilters: () => _showFilters(context, state),
        showReset: activeFilterCount > 0 || _searchQuery.isNotEmpty,
        onResetFilters: () {
          _searchCtrl.clear();
          ref.read(callsControllerProvider.notifier).applyFilter(const CallsFilter());
          setState(() => _searchQuery = '');
        },
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
            prefixIcon: const Icon(Icons.search_rounded),
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

  void _showFilters(BuildContext context, CallsState state) {
    showModalBottomSheet(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (sheetContext) {
        return _CallsFilterSheet(
          initialFilter: state.filter,
          onFilterChanged: (filter) {
            ref.read(callsControllerProvider.notifier).applyFilter(filter);
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;
    final state = ref.watch(callsControllerProvider);
    final filteredItems = _filterItems(state.items);

    final hasActiveFilters = _activeFilterCount(state) > 0;

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
            // Search and Filter
            _buildTopSection(context, state),

            // Active filters indicator
            if (hasActiveFilters)
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
                child: Row(
                  children: [
                    Icon(
                      Icons.filter_list_outlined,
                      size: 12,
                      color: scheme.primary,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      l10n.filters,
                      style: GoogleFonts.roboto(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: scheme.onSurfaceVariant,
                      ),
                    ),
                    const Spacer(),
                    TextButton(
                      onPressed: () {
                        ref
                            .read(callsControllerProvider.notifier)
                            .applyFilter(const CallsFilter());
                      },
                      style: TextButton.styleFrom(
                        padding: EdgeInsets.zero,
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      child: Text(
                        l10n.clear,
                        style: GoogleFonts.roboto(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: scheme.primary,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

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

  void _apply() {
    widget.onFilterChanged(
      CallsFilter(priority: _priority, sentiment: _sentiment),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return SafeArea(
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                l10n.filterCalls,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
              ),
              const SizedBox(height: 18),
              DropdownButtonFormField<PriorityLevel?>(
                value: _priority,
                decoration: InputDecoration(
                  labelText: l10n.priority,
                  border: const OutlineInputBorder(),
                ),
                items: [
                  DropdownMenuItem<PriorityLevel?>(
                    value: null,
                    child: Text(l10n.allCalls),
                  ),
                  DropdownMenuItem(
                    value: PriorityLevel.high,
                    child: Text(l10n.highPriority),
                  ),
                  DropdownMenuItem(
                    value: PriorityLevel.medium,
                    child: Text(l10n.mediumPriority),
                  ),
                  DropdownMenuItem(
                    value: PriorityLevel.low,
                    child: Text(l10n.lowPriority),
                  ),
                ],
                onChanged: (value) {
                  setState(() => _priority = value);
                  _apply();
                },
              ),
              const SizedBox(height: 14),
              DropdownButtonFormField<Sentiment?>(
                value: _sentiment,
                decoration: InputDecoration(
                  labelText: l10n.sentiment,
                  border: const OutlineInputBorder(),
                ),
                items: [
                  DropdownMenuItem<Sentiment?>(
                    value: null,
                    child: Text(l10n.allCalls),
                  ),
                  DropdownMenuItem(
                    value: Sentiment.positive,
                    child: Text(l10n.sentimentPositive),
                  ),
                  DropdownMenuItem(
                    value: Sentiment.neutral,
                    child: Text(l10n.sentimentNeutral),
                  ),
                  DropdownMenuItem(
                    value: Sentiment.negative,
                    child: Text(l10n.sentimentNegative),
                  ),
                ],
                onChanged: (value) {
                  setState(() => _sentiment = value);
                  _apply();
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}