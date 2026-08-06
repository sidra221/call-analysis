import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:flutter_staggered_animations/flutter_staggered_animations.dart';
import 'package:intl/intl.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../shared/widgets/ui.dart';
import '../../../core/theme/app_theme.dart';
import '../domain/log_item.dart';
import '../application/logs_providers.dart';

class LogsScreen extends ConsumerStatefulWidget {
  const LogsScreen({super.key});

  @override
  ConsumerState<LogsScreen> createState() => _LogsScreenState();
}

class _LogsScreenState extends ConsumerState<LogsScreen> {
  final TextEditingController _searchController = TextEditingController();

  String _searchQuery = '';
  LogType? _selectedType;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final logsAsync = ref.watch(logsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Activity Logs'),
        centerTitle: true,
        leading: IconButton(
          icon: const FaIcon(FontAwesomeIcons.arrowLeft),
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
        child: logsAsync.when(
          data: (logs) {
            final filteredLogs = logs.where((log) {
              final query = _searchQuery.toLowerCase();

              final matchesSearch = query.isEmpty ||
                  log.title.toLowerCase().contains(query) ||
                  log.description.toLowerCase().contains(query) ||
                  (log.extra?.toLowerCase().contains(query) ?? false);

              final matchesType =
                  _selectedType == null || log.type == _selectedType;

              return matchesSearch && matchesType;
            }).toList();

            return Column(
              children: [
                _buildTopSection(context),

                Expanded(
                  child: filteredLogs.isEmpty
                      ? const EmptyView(
                          message: 'No logs found',
                          subtitle: 'Try changing your search or filters',
                        )
                      : AnimationLimiter(
                          child: SingleChildScrollView(
                            padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
                            child: Column(
                              children: [
                                for (int i = 0; i < filteredLogs.length; i++)
                                  AnimationConfiguration.staggeredList(
                                    position: i,
                                    duration: const Duration(milliseconds: 375),
                                    child: SlideAnimation(
                                      verticalOffset: 50,
                                      child: FadeInAnimation(
                                        child: TimelineLogCard(
                                          log: filteredLogs[i],
                                          isLast: i == filteredLogs.length - 1,
                                        ),
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ),
                ),
              ],
            );
          },
          error: (e, _) => ErrorView(
            message: 'Failed to load logs',
            onRetry: () => ref.invalidate(logsProvider),
          ),
          loading: () => const Center(
            child: CircularProgressIndicator.adaptive(),
          ),
        ),
      ),
    );
  }

  Widget _buildTopSection(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _searchController,
              onChanged: (value) {
                setState(() {
                  _searchQuery = value;
                });
              },
              decoration: InputDecoration(
                hintText: 'Search logs...',
                hintStyle: GoogleFonts.plusJakartaSans(
                  fontSize: 14,
                  color: scheme.onSurfaceVariant,
                ),
                prefixIcon: const Icon(Icons.search_rounded),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear_rounded),
                        onPressed: () {
                          _searchController.clear();
                          setState(() {
                            _searchQuery = '';
                          });
                        },
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
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 14,
                ),
              ),
            ),
          ),
          const SizedBox(width: 10),
          _FilterButton(
            isActive: _selectedType != null,
            onPressed: () => _showFilters(context),
          ),
        ],
      ),
    );
  }

  void _showFilters(BuildContext context) {
    showModalBottomSheet(
      context: context,
      showDragHandle: true,
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Filter Logs',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
              ),
              const SizedBox(height: 18),
              _FilterOption(
                title: 'All Logs',
                icon: FontAwesomeIcons.layerGroup,
                selected: _selectedType == null,
                onTap: () {
                  setState(() {
                    _selectedType = null;
                  });
                  Navigator.pop(context);
                },
              ),
              _FilterOption(
                title: 'Activity',
                icon: FontAwesomeIcons.bolt,
                selected: _selectedType == LogType.activity,
                onTap: () {
                  setState(() {
                    _selectedType = LogType.activity;
                  });
                  Navigator.pop(context);
                },
              ),
              _FilterOption(
                title: 'System',
                icon: FontAwesomeIcons.gear,
                selected: _selectedType == LogType.system,
                onTap: () {
                  setState(() {
                    _selectedType = LogType.system;
                  });
                  Navigator.pop(context);
                },
              ),
              _FilterOption(
                title: 'User Actions',
                icon: FontAwesomeIcons.user,
                selected: _selectedType == LogType.userAction,
                onTap: () {
                  setState(() {
                    _selectedType = LogType.userAction;
                  });
                  Navigator.pop(context);
                },
              ),
            ],
          ),
        );
      },
    );
  }
}

class TimelineLogCard extends StatelessWidget {
  final LogItem log;
  final bool isLast;

  const TimelineLogCard({
    super.key,
    required this.log,
    required this.isLast,
  });

  @override
  Widget build(BuildContext context) {
    final color = _logColor(log.type);
    final icon = _logIcon(log.type);
    final scheme = Theme.of(context).colorScheme;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Timeline column
        SizedBox(
          width: 40,
          child: Column(
            children: [
              // Circular node
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: color.withValues(alpha: 0.15),
                  border: Border.all(
                    color: color.withValues(alpha: 0.4),
                    width: 2,
                  ),
                ),
                child: Center(
                  child: FaIcon(
                    icon,
                    size: 16,
                    color: color,
                  ),
                ),
              ),
              // Connecting line
              if (!isLast)
                Expanded(
                  child: Container(
                    width: 2,
                    margin: const EdgeInsets.symmetric(vertical: 4),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          color.withValues(alpha: 0.3),
                          color.withValues(alpha: 0.1),
                        ],
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),

        const SizedBox(width: 16),

        // Activity card
        Expanded(
          child: Container(
            margin: const EdgeInsets.only(bottom: 24),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: scheme.surface,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: scheme.shadow.withValues(alpha: 0.08),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
              border: Border.all(
                color: scheme.outline.withValues(alpha: 0.08),
                width: 1,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header with user name and action tag
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        log.title,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: scheme.onSurface,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    _ActionTag(
                      label: _logTypeLabel(log.type),
                      color: color,
                    ),
                  ],
                ),

                const SizedBox(height: 8),

                // Description
                Text(
                  log.description,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 14,
                    color: scheme.onSurfaceVariant,
                    height: 1.5,
                  ),
                ),

                if (log.extra != null) ...[
                  const SizedBox(height: 6),
                  Text(
                    log.extra!,
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 13,
                      color: scheme.outline,
                    ),
                  ),
                ],

                const SizedBox(height: 12),

                // Timestamp pill
                _TimestampPill(
                  timestamp: log.timestamp,
                  scheme: scheme,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  FaIconData _logIcon(LogType type) {
    switch (type) {
      case LogType.activity:
        return FontAwesomeIcons.bolt;
      case LogType.system:
        return FontAwesomeIcons.gear;
      case LogType.userAction:
        return FontAwesomeIcons.user;
    }
  }

  Color _logColor(LogType type) {
    switch (type) {
      case LogType.activity:
        return AppTheme.primary;
      case LogType.system:
        return AppTheme.info;
      case LogType.userAction:
        return AppTheme.success;
    }
  }

  String _logTypeLabel(LogType type) {
    switch (type) {
      case LogType.activity:
        return 'Activity';
      case LogType.system:
        return 'System';
      case LogType.userAction:
        return 'User Action';
    }
  }
}

class _TimestampPill extends StatelessWidget {
  final DateTime timestamp;
  final ColorScheme scheme;

  const _TimestampPill({
    required this.timestamp,
    required this.scheme,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 10,
        vertical: 6,
      ),
      decoration: BoxDecoration(
        color: scheme.surfaceContainerHighest.withValues(alpha: 0.6),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.access_time_rounded,
            size: 14,
            color: scheme.outline,
          ),
          const SizedBox(width: 5),
          Text(
            DateFormat.MMMd().add_jm().format(timestamp),
            style: GoogleFonts.plusJakartaSans(
              fontSize: 12,
              color: scheme.outline,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _ActionTag extends StatelessWidget {
  final String label;
  final Color color;

  const _ActionTag({
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 9,
        vertical: 5,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: GoogleFonts.plusJakartaSans(
          fontSize: 11,
          color: color,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

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