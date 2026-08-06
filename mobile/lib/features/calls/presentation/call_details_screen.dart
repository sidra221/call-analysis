import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:intl/intl.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../shared/widgets/ui.dart';
import '../../../shared/enums.dart';
import '../../../core/theme/app_theme.dart';
import '../application/calls_controller.dart';
import '../domain/call.dart';
import '../../../l10n/app_localizations.dart';

class CallDetailsScreen extends ConsumerStatefulWidget {
  final String callId;

  const CallDetailsScreen({
    super.key,
    required this.callId,
  });

  @override
  ConsumerState<CallDetailsScreen> createState() =>
      _CallDetailsScreenState();
}

class _CallDetailsScreenState extends ConsumerState<CallDetailsScreen> {
  bool reviewed = false;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final async = ref.watch(callDetailsProvider(widget.callId));
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    return Scaffold(
      appBar: AppBar(
        title: Text(
          l10n.callDetails,
          style: GoogleFonts.plusJakartaSans(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: scheme.onSurface,
            letterSpacing: -0.5,
          ),
        ),
        centerTitle: true,
        leading: IconButton(
          icon: const FaIcon(FontAwesomeIcons.arrowLeft),
          onPressed: () => context.pop(),
        ),
      ),
      body: async.when(
        data: (details) => SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header with status dot
              _buildHeader(context, details, l10n, scheme),
              const SizedBox(height: 16),

              // Main Issue
              _buildSectionTitle(context, l10n.mainIssue),
              const SizedBox(height: 8),
              Text(
                details.mainIssue,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 15,
                  color: scheme.onSurface,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 16),

              // Summary Card
              _buildSummaryCard(context, details, l10n, scheme),
              const SizedBox(height: 16),

              // Analysis Section
              _buildAnalysisSection(context, details, l10n, scheme),
              const SizedBox(height: 16),

              // Keywords Section
              _buildKeywordsSection(context, details, l10n, scheme),
              const SizedBox(height: 16),

              // Transcript Section
              _buildTranscriptSection(context, details, l10n, scheme),
              const SizedBox(height: 16),

              // Audio Section
              _buildAudioSection(context, l10n, scheme),
              const SizedBox(height: 16),

              // Follow-up Section
              if (details.needsFollowUp)
                _buildFollowUpSection(context, details, l10n, scheme),
              const SizedBox(height: 16),

              // Actions Section
              _buildActionsSection(context, l10n, scheme),
              const SizedBox(height: 24),
            ],
          ),
        ),
        error: (e, _) => ErrorView(
          message: l10n.failedToLoadCallDetails,
          onRetry: () => ref.invalidate(callDetailsProvider(widget.callId)),
        ),
        loading: () => const Center(
          child: CircularProgressIndicator.adaptive(),
        ),
      ),
    );
  }

  // Header with dynamic status dot
  Widget _buildHeader(BuildContext context, CallDetails details, AppLocalizations l10n, ColorScheme scheme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            // Dynamic status dot
            Container(
              width: 10,
              height: 10,
              decoration: BoxDecoration(
                color: _getStatusColor(details.base.status),
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 8),
            // Call number
            Expanded(
              child: Text(
                'Call #${details.base.id}',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: scheme.onSurface,
                ),
              ),
            ),
            // Close button
            IconButton(
              icon: const FaIcon(FontAwesomeIcons.xmark, size: 20),
              onPressed: () => context.pop(),
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
            ),
          ],
        ),
        // Date and uploader info
        Padding(
          padding: const EdgeInsets.only(top: 8),
          child: Row(
            children: [
              Text(
                DateFormat.yMd().format(details.base.date),
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 13,
                  color: scheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '•',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 13,
                  color: scheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '${l10n.uploadedBy} ${details.base.agentName}',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 13,
                  color: scheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // Section title helper
  Widget _buildSectionTitle(BuildContext context, String title) {
    return Text(
      title,
      style: GoogleFonts.plusJakartaSans(
        fontSize: 16,
        fontWeight: FontWeight.w700,
        color: Theme.of(context).colorScheme.onSurface,
      ),
    );
  }

  // Summary card
  Widget _buildSummaryCard(BuildContext context, CallDetails details, AppLocalizations l10n, ColorScheme scheme) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: scheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: scheme.outline.withValues(alpha: 0.3),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            l10n.summary,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: scheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            details.summary,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 15,
              color: scheme.onSurface,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  // Analysis section with chips
  Widget _buildAnalysisSection(BuildContext context, CallDetails details, AppLocalizations l10n, ColorScheme scheme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle(context, l10n.analysis),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            _buildAnalysisChip(
              details.base.sentiment.label,
              _sentimentColor(details.base.sentiment),
            ),
            _buildAnalysisChip(
              '${details.base.priority.label} Priority',
              _priorityColor(details.base.priority),
            ),
            _buildAnalysisChip(
              '${l10n.confidence} 65%',
              AppTheme.warning,
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildAnalysisChip(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: color.withValues(alpha: 0.3),
          width: 1,
        ),
      ),
      child: Text(
        label,
        style: GoogleFonts.plusJakartaSans(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }

  // Keywords section
  Widget _buildKeywordsSection(BuildContext context, CallDetails details, AppLocalizations l10n, ColorScheme scheme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle(context, l10n.keywords),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: details.keywords.map((keyword) {
            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: AppTheme.primary.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: AppTheme.primary.withValues(alpha: 0.3),
                  width: 1,
                ),
              ),
              child: Text(
                keyword,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: AppTheme.primary,
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  // Transcript section
  Widget _buildTranscriptSection(BuildContext context, CallDetails details, AppLocalizations l10n, ColorScheme scheme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle(context, l10n.transcript),
        const SizedBox(height: 12),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: scheme.surfaceContainerHighest,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: scheme.outline.withValues(alpha: 0.3),
              width: 1,
            ),
          ),
          child: Text(
            details.transcript,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 14,
              color: scheme.onSurface,
              height: 1.6,
            ),
          ),
        ),
      ],
    );
  }

  // Audio section
  Widget _buildAudioSection(BuildContext context, AppLocalizations l10n, ColorScheme scheme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle(context, l10n.audio),
        const SizedBox(height: 12),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: scheme.surfaceContainerHighest,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: scheme.outline.withValues(alpha: 0.3),
              width: 1,
            ),
          ),
          child: Column(
            children: [
              Row(
                children: [
                  IconButton(
                    onPressed: () {},
                    icon: const FaIcon(FontAwesomeIcons.play, size: 20),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    '0:00',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 13,
                      color: scheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Container(
                      height: 4,
                      decoration: BoxDecoration(
                        color: scheme.outline.withValues(alpha: 0.3),
                        borderRadius: BorderRadius.circular(2),
                      ),
                      child: FractionallySizedBox(
                        alignment: Alignment.centerLeft,
                        widthFactor: 0.0,
                        child: Container(
                          decoration: BoxDecoration(
                            color: scheme.primary,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '0:14',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 13,
                      color: scheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(width: 12),
                  const FaIcon(
                    FontAwesomeIcons.volumeHigh,
                    size: 16,
                    color: AppTheme.textSecondary,
                  ),
                  const SizedBox(width: 8),
                  const FaIcon(
                    FontAwesomeIcons.ellipsisVertical,
                    size: 16,
                    color: AppTheme.textSecondary,
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  // Follow-up section
  Widget _buildFollowUpSection(BuildContext context, CallDetails details, AppLocalizations l10n, ColorScheme scheme) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.primary.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppTheme.primary.withValues(alpha: 0.3),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                l10n.followUp,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: scheme.onSurface,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppTheme.primary.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  l10n.needsFollowUp,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.primary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            l10n.reason,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: scheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Customer has specific product questions that need addressing.',
            style: GoogleFonts.plusJakartaSans(
              fontSize: 14,
              color: scheme.onSurface,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  // Actions section
  Widget _buildActionsSection(BuildContext context, AppLocalizations l10n, ColorScheme scheme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle(context, l10n.actions),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
          _buildActionButton(
  label: l10n.markReviewed,
  icon: FontAwesomeIcons.check,
  reviewed: reviewed,
  onPressed: reviewed
      ? null
      : () {
          setState(() {
            reviewed = true;
          });
        },
),
          ],
        ),
      ],
    );
  }

Widget _buildActionButton({
  required String label,
  required FaIconData icon,
  required VoidCallback? onPressed,
  required bool reviewed,
}) {
  return ElevatedButton.icon(
    onPressed: onPressed,
    icon: FaIcon(icon, size: 16),
    label: Text(label),
    style: ElevatedButton.styleFrom(
      backgroundColor:
          reviewed ? Colors.grey.shade400 : AppTheme.primary,
      foregroundColor: Colors.white,
      padding: const EdgeInsets.symmetric(
        horizontal: 16,
        vertical: 12,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
    ),
  );
}

  // Dynamic status color for the status dot
  Color _getStatusColor(CallStatus status) {
    switch (status) {
      case CallStatus.completed:
        return AppTheme.success;
      case CallStatus.inProgress:
        return AppTheme.info;
      case CallStatus.queued:
        return AppTheme.warning;
      case CallStatus.failed:
        return AppTheme.danger;
    }
  }

  // Sentiment color helper
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

  // Priority color helper
  Color _priorityColor(PriorityLevel priority) {
    switch (priority) {
      case PriorityLevel.high:
        return AppTheme.danger;
      case PriorityLevel.medium:
        return AppTheme.warning;
      case PriorityLevel.low:
        return AppTheme.info;
    }
  }
}
