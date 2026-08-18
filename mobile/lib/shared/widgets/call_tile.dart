import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';

import '../../l10n/app_localizations.dart';
import '../../shared/l10n/call_chip_labels.dart';
import '../../core/theme/app_theme.dart';
import '../../shared/enums.dart';
import '../../features/calls/domain/call.dart';
import '../../shared/widgets/ui.dart';

class CallTile extends StatelessWidget {
  final CallItem item;

  const CallTile({
    super.key,
    required this.item,
  });

  IconData _statusIcon(CallStatus status) {
    switch (status) {
      case CallStatus.completed:
        return Icons.check_circle;
      case CallStatus.inProgress:
        return Icons.phone_in_talk;
      default:
        return Icons.access_time;
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;
    final priorityColor = AppTheme.priorityColor(item.priority);
    final sentimentColor = AppTheme.sentimentColor(item.sentiment, scheme);
    final statusColor = AppTheme.statusColor(item.status);

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: AppCard(
        padding: EdgeInsets.zero,
        onTap: () => context.push('/calls/${item.id}'),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item.callerName.isNotEmpty
                              ? item.callerName
                              : l10n.noIssueRecorded,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.roboto(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: scheme.onSurface,
                            letterSpacing: -0.2,
                          ),
                        ),
                        const SizedBox(height: 5),
                        Row(
                          children: [
                            Icon(
                              Icons.phone,
                              size: 10,
                              color: scheme.onSurfaceVariant,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              l10n.callNumber(item.id),
                              style: GoogleFonts.roboto(
                                fontSize: 12,
                                color: scheme.onSurfaceVariant,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  MiniBadge(
                    label: item.status.localized(l10n),
                    color: statusColor,
                    icon: _statusIcon(item.status),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  CallTag(
                    label: item.priority.localizedFull(l10n),
                    color: priorityColor,
                  ),
                  const SizedBox(width: 8),
                  CallTag(
                    label: item.sentiment.localized(l10n),
                    color: sentimentColor,
                  ),
                  const Spacer(),
                  Row(
                    children: [
                      Icon(
                        Icons.access_time,
                        size: 11,
                        color: scheme.onSurfaceVariant,
                      ),
                      const SizedBox(width: 5),
                      Text(
                        '${item.durationMinutes} min',
                        style: GoogleFonts.roboto(
                          fontSize: 11,
                          color: scheme.onSurfaceVariant,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(
                    Icons.calendar_today,
                    size: 10,
                    color: scheme.onSurfaceVariant,
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      item.dateLabel,
                      style: GoogleFonts.roboto(
                        fontSize: 11,
                        color: scheme.onSurfaceVariant,
                      ),
                    ),
                  ),
                  Icon(
                    Icons.chevron_right,
                    size: 11,
                    color: scheme.onSurfaceVariant,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class CallTag extends StatelessWidget {
  final String label;
  final Color color;

  const CallTag({
    super.key,
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
      decoration: AppTheme.chipDecoration(color),
      child: Text(
        label,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: GoogleFonts.roboto(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          color: color,
        ),
      ),
    );
  }
}

class MiniBadge extends StatelessWidget {
  final String label;
  final Color color;
  final IconData icon;

  const MiniBadge({
    super.key,
    required this.label,
    required this.color,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 8,
        vertical: 6,
      ),
      decoration: AppTheme.chipDecoration(color),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 10,
            color: color,
          ),
          const SizedBox(width: 5),
          Text(
            label,
            style: GoogleFonts.roboto(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
