import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../shared/l10n/call_chip_labels.dart';
import '../../../shared/widgets/ui.dart';
import '../../../core/api/api_client.dart';
import '../../../core/theme/app_theme.dart';
import '../application/calls_controller.dart';
import '../data/calls_repository.dart';
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
  bool? _reviewedOverride;
  bool _markingReviewed = false;
  final AudioPlayer _audioPlayer = AudioPlayer();
  Duration _position = Duration.zero;
  Duration _duration = Duration.zero;
  bool _isPlaying = false;
  String? _loadedUrl;

  @override
  void initState() {
    super.initState();
    _audioPlayer.onPositionChanged.listen((position) {
      if (mounted) setState(() => _position = position);
    });
    _audioPlayer.onDurationChanged.listen((duration) {
      if (mounted) setState(() => _duration = duration);
    });
    _audioPlayer.onPlayerStateChanged.listen((state) {
      if (mounted) {
        setState(() => _isPlaying = state == PlayerState.playing);
      }
    });
  }

  @override
  void dispose() {
    _audioPlayer.dispose();
    super.dispose();
  }

  String _formatDuration(Duration duration) {
    final minutes = duration.inMinutes.remainder(60).toString().padLeft(2, '0');
    final seconds = duration.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '$minutes:$seconds';
  }

  Future<void> _togglePlayback(String? url) async {
    if (url == null || url.isEmpty) return;

    if (_isPlaying) {
      await _audioPlayer.pause();
      return;
    }

    if (_loadedUrl != url) {
      await _audioPlayer.stop();
      setState(() {
        _position = Duration.zero;
        _duration = Duration.zero;
      });
      await _audioPlayer.play(UrlSource(url));
      _loadedUrl = url;
    } else {
      await _audioPlayer.resume();
    }
  }

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
          style: GoogleFonts.roboto(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: scheme.onSurface,
            letterSpacing: -0.5,
          ),
        ),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
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
                style: GoogleFonts.roboto(
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
              _buildAudioSection(context, details, l10n, scheme),
              const SizedBox(height: 16),

              // Follow-up Section
              if (details.needsFollowUp)
                _buildFollowUpSection(context, details, l10n, scheme),
              const SizedBox(height: 16),

              // Actions Section
              _buildActionsSection(context, details, l10n, scheme),
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
                color: AppTheme.statusColor(details.base.status),
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 8),
            // Call number
            Expanded(
              child: Text(
                'Call #${details.base.id}',
                style: GoogleFonts.roboto(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: scheme.onSurface,
                ),
              ),
            ),
            // Close button
            IconButton(
              icon: const Icon(Icons.close, size: 20),
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
                style: GoogleFonts.roboto(
                  fontSize: 13,
                  color: scheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '•',
                style: GoogleFonts.roboto(
                  fontSize: 13,
                  color: scheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '${l10n.uploadedBy} ${details.base.agentName}',
                style: GoogleFonts.roboto(
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
      style: GoogleFonts.roboto(
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
            style: GoogleFonts.roboto(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: scheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            details.summary,
            style: GoogleFonts.roboto(
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
              details.base.sentiment.localized(l10n),
              AppTheme.sentimentColor(details.base.sentiment, scheme),
            ),
            _buildAnalysisChip(
              details.base.priority.localizedFull(l10n),
              AppTheme.priorityColor(details.base.priority),
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
      decoration: AppTheme.chipDecoration(color),
      child: Text(
        label,
        style: GoogleFonts.roboto(
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
                style: GoogleFonts.roboto(
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
            style: GoogleFonts.roboto(
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
  Widget _buildAudioSection(
    BuildContext context,
    CallDetails details,
    AppLocalizations l10n,
    ColorScheme scheme,
  ) {
    final audioUrl = details.audioUrl;
    final hasAudio = audioUrl != null && audioUrl.isNotEmpty;
    final progress = _duration.inMilliseconds > 0
        ? (_position.inMilliseconds / _duration.inMilliseconds).clamp(0.0, 1.0)
        : 0.0;
    final totalLabel = _duration > Duration.zero
        ? _formatDuration(_duration)
        : _formatDuration(
            Duration(seconds: (details.base.durationMinutes * 60).clamp(0, 86400)),
          );

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
                    onPressed: hasAudio ? () => _togglePlayback(audioUrl) : null,
                    icon: Icon(
                      _isPlaying ? Icons.pause : Icons.play_arrow,
                      size: 20,
                    ),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    _formatDuration(_position),
                    style: GoogleFonts.roboto(
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
                        widthFactor: progress,
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
                    totalLabel,
                    style: GoogleFonts.roboto(
                      fontSize: 13,
                      color: scheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
              if (!hasAudio) ...[
                const SizedBox(height: 8),
                Text(
                  l10n.noAudioRecording,
                  style: GoogleFonts.roboto(
                    fontSize: 12,
                    color: scheme.onSurfaceVariant,
                  ),
                ),
              ],
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
                style: GoogleFonts.roboto(
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
                  style: GoogleFonts.roboto(
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
            style: GoogleFonts.roboto(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: scheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Customer has specific product questions that need addressing.',
            style: GoogleFonts.roboto(
              fontSize: 14,
              color: scheme.onSurface,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _markAsReviewed(CallDetails details) async {
    if (_markingReviewed) return;

    final previous = _reviewedOverride ?? details.isReviewed;
    setState(() {
      _markingReviewed = true;
      _reviewedOverride = true;
    });

    try {
      await ref.read(callsRepositoryProvider).markReviewed(widget.callId);
      if (mounted) {
        ref.invalidate(callDetailsProvider(widget.callId));
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _reviewedOverride = previous;
        });
        final l10n = AppLocalizations.of(context)!;
        final message = e is ApiException
            ? e.message
            : l10n.failedToMarkReviewed;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(message),
            behavior: SnackBarBehavior.floating,
            backgroundColor: AppTheme.danger,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _markingReviewed = false;
        });
      }
    }
  }

  // Actions section
  Widget _buildActionsSection(
    BuildContext context,
    CallDetails details,
    AppLocalizations l10n,
    ColorScheme scheme,
  ) {
    final reviewed = _reviewedOverride ?? details.isReviewed;

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
              icon: Icons.check,
              reviewed: reviewed,
              onPressed: reviewed || _markingReviewed
                  ? null
                  : () => _markAsReviewed(details),
            ),
          ],
        ),
      ],
    );
  }

Widget _buildActionButton({
  required String label,
  required IconData icon,
  required VoidCallback? onPressed,
  required bool reviewed,
}) {
  return ElevatedButton.icon(
    onPressed: onPressed,
    icon: Icon(icon, size: 16),
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

}
