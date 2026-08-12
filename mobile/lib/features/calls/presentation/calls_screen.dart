import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:flutter_staggered_animations/flutter_staggered_animations.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../shared/enums.dart';
import '../../../shared/widgets/ui.dart';
import '../../../shared/widgets/call_tile.dart';
import '../application/calls_controller.dart';
import '../domain/call.dart';
import '../../../core/theme/app_theme.dart';
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

    _scrollCtrl.addListener(_onScroll);

    _searchCtrl.addListener(() {
      setState(() {
        _searchQuery = _searchCtrl.text.trim().toLowerCase();
      });
    });
  }

  void _onScroll() {
    if (_scrollCtrl.position.pixels >
        _scrollCtrl.position.maxScrollExtent - 200) {
      ref.read(callsControllerProvider.notifier).loadMore();
    }
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
    final scheme = Theme.of(context).colorScheme;
    final hasActiveFilters =
        state.filter.priority != null || state.filter.sentiment != null;

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _searchCtrl,
              onChanged: (value) {
                setState(() {
                  _searchQuery = value.trim().toLowerCase();
                });
              },
              decoration: InputDecoration(
                hintText: 'Search calls...',
                hintStyle: GoogleFonts.plusJakartaSans(
                  fontSize: 14,
                  color: AppTheme.textSecondary,
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
          const SizedBox(width: 10),
          _FilterButton(
            isActive: hasActiveFilters,
            onPressed: () => _showFilters(context, state),
          ),
        ],
      ),
    );
  }

  void _showFilters(BuildContext context, CallsState state) {
    showModalBottomSheet(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (context) {
        return SafeArea(
          child: SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Filter Calls',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                  const SizedBox(height: 18),
                  _FilterOption(
                    title: 'All Calls',
                    icon: FontAwesomeIcons.layerGroup,
                    selected: state.filter.priority == null &&
                        state.filter.sentiment == null,
                    onTap: () {
                      ref
                          .read(callsControllerProvider.notifier)
                          .applyFilter(const CallsFilter());
                      Navigator.pop(context);
                    },
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Priority',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textSecondary,
                        ),
                  ),
                  const SizedBox(height: 8),
                  _FilterOption(
                    title: 'High Priority',
                    icon: FontAwesomeIcons.flag,
                    selected: state.filter.priority == PriorityLevel.high,
                    onTap: () {
                      ref
                          .read(callsControllerProvider.notifier)
                          .applyFilter(
                            CallsFilter(
                              priority: PriorityLevel.high,
                              sentiment: state.filter.sentiment,
                            ),
                          );
                      Navigator.pop(context);
                    },
                  ),
                  _FilterOption(
                    title: 'Medium Priority',
                    icon: FontAwesomeIcons.flag,
                    selected: state.filter.priority == PriorityLevel.medium,
                    onTap: () {
                      ref
                          .read(callsControllerProvider.notifier)
                          .applyFilter(
                            CallsFilter(
                              priority: PriorityLevel.medium,
                              sentiment: state.filter.sentiment,
                            ),
                          );
                      Navigator.pop(context);
                    },
                  ),
                  _FilterOption(
                    title: 'Low Priority',
                    icon: FontAwesomeIcons.flag,
                    selected: state.filter.priority == PriorityLevel.low,
                    onTap: () {
                      ref
                          .read(callsControllerProvider.notifier)
                          .applyFilter(
                            CallsFilter(
                              priority: PriorityLevel.low,
                              sentiment: state.filter.sentiment,
                            ),
                          );
                      Navigator.pop(context);
                    },
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Sentiment',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textSecondary,
                        ),
                  ),
                  const SizedBox(height: 8),
                  _FilterOption(
                    title: 'Positive',
                    icon: FontAwesomeIcons.faceSmile,
                    selected: state.filter.sentiment == Sentiment.positive,
                    onTap: () {
                      ref
                          .read(callsControllerProvider.notifier)
                          .applyFilter(
                            CallsFilter(
                              priority: state.filter.priority,
                              sentiment: Sentiment.positive,
                            ),
                          );
                      Navigator.pop(context);
                    },
                  ),
                  _FilterOption(
                    title: 'Neutral',
                    icon: FontAwesomeIcons.faceMeh,
                    selected: state.filter.sentiment == Sentiment.neutral,
                    onTap: () {
                      ref
                          .read(callsControllerProvider.notifier)
                          .applyFilter(
                            CallsFilter(
                              priority: state.filter.priority,
                              sentiment: Sentiment.neutral,
                            ),
                          );
                      Navigator.pop(context);
                    },
                  ),
                  _FilterOption(
                    title: 'Negative',
                    icon: FontAwesomeIcons.faceFrown,
                    selected: state.filter.sentiment == Sentiment.negative,
                    onTap: () {
                      ref
                          .read(callsControllerProvider.notifier)
                          .applyFilter(
                            CallsFilter(
                              priority: state.filter.priority,
                              sentiment: Sentiment.negative,
                            ),
                          );
                      Navigator.pop(context);
                    },
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final state = ref.watch(callsControllerProvider);
    final filteredItems = _filterItems(state.items);

    final hasActiveFilters =
        state.filter.priority != null || state.filter.sentiment != null;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          l10n.calls,
          style: GoogleFonts.plusJakartaSans(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: AppTheme.textPrimary,
            letterSpacing: -0.5,
          ),
        ),
        centerTitle: true,
        leading: IconButton(
          icon: const FaIcon(
            FontAwesomeIcons.arrowLeft,
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
                    const FaIcon(
                      FontAwesomeIcons.filter,
                      size: 12,
                      color: AppTheme.primary,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      l10n.filters,
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textSecondary,
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
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.primary,
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
                                24,
                              ),
                              itemCount:
                                  filteredItems.length +
                                  (state.hasMore ? 1 : 0),
                              itemBuilder: (context, index) {
                                if (index >= filteredItems.length) {
                                  return const Padding(
                                    padding: EdgeInsets.symmetric(
                                      vertical: 20,
                                    ),
                                    child: Center(
                                      child:
                                          CircularProgressIndicator.adaptive(),
                                    ),
                                  );
                                }

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
          ],
        ),
      ),
    );
  }
}

// -----------------------------------------------------------------------------
// SMALL UI COMPONENTS
// -----------------------------------------------------------------------------

class _FilterButton extends StatelessWidget {
  final bool isActive;
  final VoidCallback onPressed;

  const _FilterButton({
    required this.isActive,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 56,
      width: 56,
      child: IconButton(
        onPressed: onPressed,
        style: IconButton.styleFrom(
          backgroundColor: isActive
              ? Theme.of(context).colorScheme.primary.withValues(alpha: 0.12)
              : Theme.of(context)
                  .colorScheme
                  .surfaceContainerHighest
                  .withValues(alpha: 0.45),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
        icon: FaIcon(
          FontAwesomeIcons.sliders,
          size: 18,
          color: isActive
              ? Theme.of(context).colorScheme.primary
              : Theme.of(context).colorScheme.onSurfaceVariant,
        ),
      ),
    );
  }
}

class _FilterOption extends StatelessWidget {
  final String title;
  final FaIconData icon;
  final bool selected;
  final VoidCallback onTap;

  const _FilterOption({
    required this.title,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return ListTile(
      onTap: onTap,
      contentPadding: EdgeInsets.zero,
      leading: Container(
        width: 42,
        height: 42,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: selected
              ? scheme.primary.withValues(alpha: 0.14)
              : scheme.surfaceContainerHighest,
        ),
        child: Center(
          child: FaIcon(
            icon,
            size: 16,
            color: selected ? scheme.primary : scheme.onSurfaceVariant,
          ),
        ),
      ),
      title: Text(
        title,
        style: const TextStyle(
          fontWeight: FontWeight.w600,
        ),
      ),
      trailing: selected
          ? Icon(
              Icons.check_circle_rounded,
              color: scheme.primary,
            )
          : null,
    );
  }
}