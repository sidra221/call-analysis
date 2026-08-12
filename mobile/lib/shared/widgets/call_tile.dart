import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';

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

  Color _priorityColor(PriorityLevel priority) {
    switch (priority) {
      case PriorityLevel.low:
        return AppTheme.info;
      case PriorityLevel.medium:
        return AppTheme.warning;
      case PriorityLevel.high:
        return AppTheme.danger;
    }
  }

  Color _sentimentColor(Sentiment sentiment) {
    switch (sentiment) {
      case Sentiment.positive:
        return AppTheme.success;
      case Sentiment.neutral:
        return AppTheme.warning;
      case Sentiment.negative:
        return AppTheme.danger;
    }
  }

  Color _statusColor(CallStatus status) {
    switch (status) {
      case CallStatus.completed:
        return AppTheme.success;
      case CallStatus.inProgress:
        return AppTheme.info;
      default:
        return AppTheme.warning;
    }
  }

  FaIconData _statusIcon(CallStatus status) {
    switch (status) {
      case CallStatus.completed:
        return FontAwesomeIcons.circleCheck;
      case CallStatus.inProgress:
        return FontAwesomeIcons.phoneVolume;
      default:
        return FontAwesomeIcons.clock;
    }
  }

  @override
  Widget build(BuildContext context) {
    final priorityColor = _priorityColor(item.priority);
    final sentimentColor = _sentimentColor(item.sentiment);
    final statusColor = _statusColor(item.status);

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
                  // Caller icon
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: AppTheme.primary.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(15),
                      border: Border.all(
                        color: AppTheme.primary.withValues(alpha: 0.18),
                      ),
                    ),
                    child: const Center(
                      child: FaIcon(
                        FontAwesomeIcons.user,
                        size: 18,
                        color: AppTheme.primary,
                      ),
                    ),
                  ),

                  const SizedBox(width: 12),

                  // Caller info
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item.callerName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.textPrimary,
                            letterSpacing: -0.2,
                          ),
                        ),
                        const SizedBox(height: 5),
                        Row(
                          children: [
                            const FaIcon(
                              FontAwesomeIcons.phone,
                              size: 10,
                              color: AppTheme.textSecondary,
                            ),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                item.callerNumber,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 12,
                                  color: AppTheme.textSecondary,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(width: 8),

                  // Status
                  MiniBadge(
                    label: item.status.name,
                    color: statusColor,
                    icon: _statusIcon(item.status),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              
              // Bottom info
              Row(
                children: [
                  CallTag(
                    label: item.priority.label,
                    color: priorityColor,
                  ),
                  const SizedBox(width: 8),
                  CallTag(
                    label: item.sentiment.label,
                    color: sentimentColor,
                  ),
                  const Spacer(),
                  Row(
                    children: [
                      const FaIcon(
                        FontAwesomeIcons.clock,
                        size: 11,
                        color: AppTheme.textSecondary,
                      ),
                      const SizedBox(width: 5),
                      Text(
                        '${item.durationMinutes} min',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 11,
                          color: AppTheme.textSecondary,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ],
              ),

              const SizedBox(height: 8),

              // Date and arrow
              Row(
                children: [
                  const FaIcon(
                    FontAwesomeIcons.calendar,
                    size: 10,
                    color: AppTheme.textSecondary,
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      item.dateLabel,
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 11,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ),
                  const FaIcon(
                    FontAwesomeIcons.chevronRight,
                    size: 11,
                    color: AppTheme.textSecondary,
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
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: color.withValues(alpha: 0.20),
        ),
      ),
      child: Text(
        label,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: GoogleFonts.plusJakartaSans(
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
  final FaIconData icon;

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
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(9),
        border: Border.all(
          color: color.withValues(alpha: 0.20),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          FaIcon(
            icon,
            size: 10,
            color: color,
          ),
          const SizedBox(width: 5),
          Text(
            label,
            style: GoogleFonts.plusJakartaSans(
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
