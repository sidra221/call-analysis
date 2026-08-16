import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_staggered_animations/flutter_staggered_animations.dart';
import 'package:intl/intl.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../shared/widgets/ui.dart';
import '../../../shared/widgets/app_filters.dart';
import '../../../shared/widgets/app_pagination.dart';
import '../../../l10n/app_localizations.dart';
import '../domain/log_item.dart';
import '../domain/log_constants.dart';
import '../application/logs_controller.dart';

class LogsScreen extends ConsumerStatefulWidget {
  const LogsScreen({super.key});

  @override
  ConsumerState<LogsScreen> createState() => _LogsScreenState();
}

class _LogsScreenState extends ConsumerState<LogsScreen> {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();
  Timer? _searchDebounce;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(logsControllerProvider.notifier).init();
    });
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _searchController.dispose();
    _searchFocusNode.dispose();
    super.dispose();
  }

  int _activeFilterCount(LogsFilter filter) {
    var count = 0;
    if (filter.action != 'all') count++;
    if (filter.username.isNotEmpty) count++;
    if (filter.date.isNotEmpty) count++;
    return count;
  }

  void _applySearch(String value) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 400), () {
      final filter = ref.read(logsControllerProvider).filter;
      ref.read(logsControllerProvider.notifier).applyFilter(
            filter.copyWith(search: value.trim()),
          );
    });
  }

  List<String> _searchSuggestions(List<String> userOptions, String query) {
    final q = query.trim().toLowerCase();
    if (q.isEmpty) return const [];

    final usernames = <String>{};
    final others = <String>{};

    for (final username in userOptions) {
      if (username.toLowerCase().contains(q)) {
        usernames.add(username);
      }
    }
    for (final option in logActionOptions) {
      if (option.label.toLowerCase().contains(q)) {
        others.add(option.label);
      }
    }

    return [...usernames, ...others].take(8).toList();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final logsState = ref.watch(logsControllerProvider);
    final logs = logsState.items;
    final filter = logsState.filter;
    final hasFilters =
        filter.search.isNotEmpty || _activeFilterCount(filter) > 0;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.logs),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
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
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSearchRow(context, logsState),
            if (hasFilters) _buildActiveFilters(context, logsState),
            Expanded(
              child: logsState.isLoading && logs.isEmpty
                  ? const Center(child: CircularProgressIndicator.adaptive())
                  : logsState.error != null && logs.isEmpty
                      ? ErrorView(
                          message: l10n.failedToLoadLogs,
                          onRetry: () => ref
                              .read(logsControllerProvider.notifier)
                              .refresh(),
                        )
                      : logs.isEmpty
                          ? EmptyView(
                              message: l10n.noLogsFound,
                              subtitle: hasFilters
                                  ? l10n.tryChangingSearchOrFilters
                                  : null,
                            )
                          : RefreshIndicator.adaptive(
                              onRefresh: () => ref
                                  .read(logsControllerProvider.notifier)
                                  .refresh(),
                              child: AnimationLimiter(
                                child: ListView.builder(
                                  physics: const AlwaysScrollableScrollPhysics(),
                                  padding:
                                      const EdgeInsets.fromLTRB(20, 8, 20, 16),
                                  itemCount: logs.length,
                                  itemBuilder: (context, index) {
                                    return AnimationConfiguration.staggeredList(
                                      position: index,
                                      duration:
                                          const Duration(milliseconds: 375),
                                      child: SlideAnimation(
                                        verticalOffset: 40,
                                        child: FadeInAnimation(
                                          child: _LogTimelineEntry(
                                            log: logs[index],
                                            isLast: index == logs.length - 1,
                                          ),
                                        ),
                                      ),
                                    );
                                  },
                                ),
                              ),
                            ),
            ),
            if (logs.isNotEmpty)
              AppPaginationBar(
                currentPage: logsState.page - 1,
                totalPages: totalPagesFor(logsState.totalCount, 20),
                totalItems: logsState.totalCount,
                pageSize: 20,
                isLoading: logsState.isLoading,
                onPageChanged: (page) => ref
                    .read(logsControllerProvider.notifier)
                    .goToPage(page + 1),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchRow(BuildContext context, LogsState logsState) {
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;
    final filter = logsState.filter;
    final userOptions = logsState.userOptions;

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
      child: AppFilterToolbar(
        activeFilterCount: _activeFilterCount(filter),
        onOpenFilters: () => _showFilters(context, logsState),
        showReset: _activeFilterCount(filter) > 0 || filter.search.isNotEmpty,
        onResetFilters: () {
          _searchController.clear();
          ref
              .read(logsControllerProvider.notifier)
              .applyFilter(const LogsFilter());
        },
        searchField: RawAutocomplete<String>(
          textEditingController: _searchController,
          focusNode: _searchFocusNode,
          optionsBuilder: (value) {
            final text = value.text.trim();
            if (text.isEmpty) return const Iterable<String>.empty();
            return _searchSuggestions(userOptions, text);
          },
          onSelected: (selection) {
            _searchController.text = selection;
            _applySearch(selection);
          },
          fieldViewBuilder: (context, controller, focusNode, onFieldSubmitted) {
            return TextField(
              controller: controller,
              focusNode: focusNode,
              onChanged: _applySearch,
              decoration: InputDecoration(
                hintText: l10n.searchLogs,
                hintStyle: GoogleFonts.roboto(
                  fontSize: 14,
                  color: scheme.onSurfaceVariant,
                ),
                prefixIcon: const Icon(Icons.search_rounded),
                suffixIcon: filter.search.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear_rounded),
                        onPressed: () {
                          _searchController.clear();
                          _applySearch('');
                        },
                      )
                    : null,
                filled: true,
                fillColor:
                    scheme.surfaceContainerHighest.withValues(alpha: 0.45),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 14,
                ),
              ),
            );
          },
          optionsViewBuilder: (context, onSelected, options) {
            if (options.isEmpty) return const SizedBox.shrink();
            return Align(
              alignment: Alignment.topLeft,
              child: Material(
                elevation: 4,
                borderRadius: BorderRadius.circular(12),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxHeight: 220),
                  child: ListView.builder(
                    padding: EdgeInsets.zero,
                    shrinkWrap: true,
                    itemCount: options.length,
                    itemBuilder: (context, index) {
                      final option = options.elementAt(index);
                      final isUser = userOptions.contains(option);
                      return ListTile(
                        dense: true,
                        leading: Icon(
                          isUser ? Icons.person_outline : Icons.search,
                          size: 18,
                        ),
                        title: Text(
                          option,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        onTap: () => onSelected(option),
                      );
                    },
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildActiveFilters(BuildContext context, LogsState logsState) {
    final scheme = Theme.of(context).colorScheme;
    final filter = logsState.filter;
    final resultCount = logsState.totalCount;

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        crossAxisAlignment: WrapCrossAlignment.center,
        children: [
          if (filter.search.isNotEmpty)
            InputChip(
              label: Text('Search: ${filter.search}'),
              onDeleted: () {
                _searchController.clear();
                ref.read(logsControllerProvider.notifier).applyFilter(
                      filter.copyWith(search: ''),
                    );
              },
            ),
          if (filter.action != 'all')
            InputChip(
              label: Text(
                'Action: ${logActionOptions.firstWhere((o) => o.value == filter.action, orElse: () => const LogActionOption(value: '', label: '')).label}',
              ),
              onDeleted: () => ref
                  .read(logsControllerProvider.notifier)
                  .applyFilter(filter.copyWith(action: 'all')),
            ),
          if (filter.username.isNotEmpty)
            InputChip(
              label: Text('User: ${filter.username}'),
              onDeleted: () => ref
                  .read(logsControllerProvider.notifier)
                  .applyFilter(filter.copyWith(username: '')),
            ),
          if (filter.date.isNotEmpty)
            InputChip(
              label: Text('Date: ${filter.date}'),
              onDeleted: () => ref
                  .read(logsControllerProvider.notifier)
                  .applyFilter(filter.copyWith(date: '')),
            ),
          Text(
            '$resultCount result${resultCount == 1 ? '' : 's'}',
            style: GoogleFonts.roboto(
              fontSize: 12,
              color: scheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }

  void _showFilters(BuildContext context, LogsState logsState) {
    final filter = logsState.filter;
    showModalBottomSheet(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (sheetContext) {
        return _LogsFilterSheet(
          initialAction: filter.action,
          initialUsername: filter.username,
          initialDate: filter.date,
          userOptions: logsState.userOptions,
          onApply: (action, username, date) {
            ref.read(logsControllerProvider.notifier).applyFilter(
                  filter.copyWith(
                    action: action,
                    username: username,
                    date: date,
                  ),
                );
          },
        );
      },
    );
  }
}

/// Owns its controllers — avoids "used after dispose" when sheet closes.
class _LogsFilterSheet extends StatefulWidget {
  final String initialAction;
  final String initialUsername;
  final String initialDate;
  final List<String> userOptions;
  final void Function(String action, String username, String date) onApply;

  const _LogsFilterSheet({
    required this.initialAction,
    required this.initialUsername,
    required this.initialDate,
    required this.userOptions,
    required this.onApply,
  });

  @override
  State<_LogsFilterSheet> createState() => _LogsFilterSheetState();
}

class _LogsFilterSheetState extends State<_LogsFilterSheet> {
  late String _action;
  late String _username;
  late final TextEditingController _dateController;

  @override
  void initState() {
    super.initState();
    _action = widget.initialAction;
    _username = widget.initialUsername;
    _dateController = TextEditingController(text: widget.initialDate);
  }

  @override
  void dispose() {
    _dateController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: SingleChildScrollView(
        child: AppFilterSheet(
          title: 'Filter Logs',
          onApply: () => widget.onApply(
            _action,
            _username.trim(),
            _dateController.text.trim(),
          ),
          children: [
            DropdownButtonFormField<String>(
              value: _action,
              decoration: const InputDecoration(
                labelText: 'Action',
                border: OutlineInputBorder(),
              ),
              items: logActionOptions
                  .map(
                    (option) => DropdownMenuItem(
                      value: option.value,
                      child: Text(option.label),
                    ),
                  )
                  .toList(),
              onChanged: (value) {
                if (value != null) setState(() => _action = value);
              },
            ),
            const SizedBox(height: 14),
            AppUsernameAutocomplete(
              initialValue: widget.initialUsername,
              options: widget.userOptions,
              onChanged: (value) => _username = value,
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _dateController,
              decoration: const InputDecoration(
                labelText: 'Date',
                border: OutlineInputBorder(),
              ),
              readOnly: true,
              onTap: () async {
                final current = _dateController.text;
                final picked = await showDatePicker(
                  context: context,
                  initialDate: current.isNotEmpty
                      ? DateTime.tryParse(current) ?? DateTime.now()
                      : DateTime.now(),
                  firstDate: DateTime(2020),
                  lastDate: DateTime.now().add(const Duration(days: 365)),
                );
                if (picked != null) {
                  setState(() {
                    _dateController.text =
                        DateFormat('yyyy-MM-dd').format(picked);
                  });
                }
              },
            ),
          ],
        ),
      ),
    );
  }
}

/// Timeline row — line connects between circles like React `Logs.jsx`.
class _LogTimelineEntry extends StatelessWidget {
  final LogItem log;
  final bool isLast;

  const _LogTimelineEntry({
    required this.log,
    required this.isLast,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final actionColor = logActionColor(log.action, scheme);
    final icon = logActionIcon(log.action);
    const avatarSize = 46.0;
    const lineLeft = 22.0; // center of 46px avatar minus 1px line width

    return Padding(
      padding: EdgeInsets.only(bottom: isLast ? 0 : 35),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          if (!isLast)
            Positioned(
              left: lineLeft,
              top: avatarSize + 4,
              bottom: -35,
              width: 2,
              child: ColoredBox(
                color: scheme.outline.withValues(alpha: 0.35),
              ),
            ),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: avatarSize,
                height: avatarSize,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: actionColor.withValues(alpha: 0.12),
                ),
                child: Icon(icon, size: 18, color: actionColor),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      log.username,
                      style: GoogleFonts.roboto(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: scheme.onSurface,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${logActionLabel(log.action)}: ${log.description}',
                      style: GoogleFonts.roboto(
                        fontSize: 14,
                        color: scheme.onSurfaceVariant,
                        height: 1.5,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _LogMetaChip(
                          icon: Icons.access_time_rounded,
                          label:
                              DateFormat.yMd().add_jms().format(log.timestamp),
                          outlined: true,
                          color: scheme.onSurfaceVariant,
                          scheme: scheme,
                        ),
                        _LogMetaChip(
                          label: logActionTag(log.action),
                          color: actionColor,
                          scheme: scheme,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _LogMetaChip extends StatelessWidget {
  final IconData? icon;
  final String label;
  final Color color;
  final ColorScheme scheme;
  final bool outlined;

  const _LogMetaChip({
    this.icon,
    required this.label,
    required this.color,
    required this.scheme,
    this.outlined = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: outlined ? Colors.transparent : color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: outlined
              ? scheme.outline.withValues(alpha: 0.5)
              : color.withValues(alpha: 0.2),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 14, color: color),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: GoogleFonts.roboto(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

