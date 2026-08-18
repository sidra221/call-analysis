import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../l10n/app_localizations.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/enums.dart';

/// Face cards only — each card opens the matching sentiment calls.
class SentimentChart extends StatelessWidget {
  final double positivePct;
  final double neutralPct;
  final double negativePct;
  final ValueChanged<Sentiment>? onSentimentTap;

  const SentimentChart({
    super.key,
    required this.positivePct,
    required this.neutralPct,
    required this.negativePct,
    this.onSentimentTap,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final segments = [
      _Segment(
        sentiment: Sentiment.positive,
        value: positivePct,
        color: AppTheme.sentimentPositive,
        label: l10n.sentimentPositive,
        icon: Icons.sentiment_satisfied_alt_rounded,
      ),
      _Segment(
        sentiment: Sentiment.neutral,
        value: neutralPct,
        color: AppTheme.sentimentNeutral,
        label: l10n.sentimentNeutral,
        icon: Icons.sentiment_neutral_rounded,
      ),
      _Segment(
        sentiment: Sentiment.negative,
        value: negativePct,
        color: AppTheme.sentimentNegative,
        label: l10n.sentimentNegative,
        icon: Icons.sentiment_dissatisfied_rounded,
      ),
    ];

    return Row(
      children: [
        for (var i = 0; i < segments.length; i++) ...[
          if (i > 0) const SizedBox(width: 10),
          Expanded(
            child: _SentimentTile(
              segment: segments[i],
              onTap: onSentimentTap == null
                  ? null
                  : () => onSentimentTap!(segments[i].sentiment),
            ),
          ),
        ],
      ],
    );
  }
}

class _Segment {
  final Sentiment sentiment;
  final double value;
  final Color color;
  final String label;
  final IconData icon;

  const _Segment({
    required this.sentiment,
    required this.value,
    required this.color,
    required this.label,
    required this.icon,
  });
}

class _SentimentTile extends StatelessWidget {
  final _Segment segment;
  final VoidCallback? onTap;

  const _SentimentTile({
    required this.segment,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final pct = segment.value.round();

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Ink(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
          decoration: AppTheme.chipDecoration(segment.color, radius: 14),
          child: Column(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: segment.color.withValues(alpha: 0.14),
                ),
                child: Icon(segment.icon, size: 20, color: segment.color),
              ),
              const SizedBox(height: 8),
              Text(
                '$pct%',
                style: GoogleFonts.roboto(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: scheme.onSurface,
                  height: 1,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                segment.label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
                style: GoogleFonts.roboto(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: scheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
