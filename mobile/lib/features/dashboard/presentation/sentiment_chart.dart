import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../l10n/app_localizations.dart';
import '../../../core/theme/app_theme.dart';

/// Modern sentiment overview — stacked bar + stat tiles (replaces pie chart).
class SentimentChart extends StatefulWidget {
  final double positivePct;
  final double neutralPct;
  final double negativePct;

  const SentimentChart({
    super.key,
    required this.positivePct,
    required this.neutralPct,
    required this.negativePct,
  });

  @override
  State<SentimentChart> createState() => _SentimentChartState();
}

class _SentimentChartState extends State<SentimentChart>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );
    _animation = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOutCubic,
    );
    _controller.forward();
  }

  @override
  void didUpdateWidget(SentimentChart oldWidget) {
    super.didUpdateWidget(oldWidget);
    _controller.forward(from: 0);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  _SentimentInsight _insight(AppLocalizations l10n) {
    final p = widget.positivePct;
    final n = widget.neutralPct;
    final neg = widget.negativePct;

    if (p >= n && p >= neg) {
      return _SentimentInsight(
        label: l10n.sentimentPositive,
        color: AppTheme.sentimentPositive,
        icon: Icons.sentiment_satisfied_alt_rounded,
      );
    }
    if (neg >= n && neg >= p) {
      return _SentimentInsight(
        label: l10n.sentimentNegative,
        color: AppTheme.sentimentNegative,
        icon: Icons.sentiment_dissatisfied_rounded,
      );
    }
    return _SentimentInsight(
      label: l10n.sentimentNeutral,
      color: AppTheme.sentimentNeutral,
      icon: Icons.sentiment_neutral_rounded,
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;
    final insight = _insight(l10n);

    final segments = [
      _Segment(
        value: widget.positivePct,
        color: AppTheme.sentimentPositive,
        label: l10n.sentimentPositive,
        icon: Icons.sentiment_satisfied_alt_rounded,
      ),
      _Segment(
        value: widget.neutralPct,
        color: AppTheme.sentimentNeutral,
        label: l10n.sentimentNeutral,
        icon: Icons.sentiment_neutral_rounded,
      ),
      _Segment(
        value: widget.negativePct,
        color: AppTheme.sentimentNegative,
        label: l10n.sentimentNegative,
        icon: Icons.sentiment_dissatisfied_rounded,
      ),
    ];

    return AnimatedBuilder(
      animation: _animation,
      builder: (context, _) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        scheme.primary.withValues(alpha: 0.18),
                        scheme.primary.withValues(alpha: 0.06),
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(
                    Icons.insights_rounded,
                    size: 22,
                    color: scheme.primary,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        l10n.sentimentAnalysis,
                        style: GoogleFonts.roboto(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: scheme.onSurface,
                          letterSpacing: -0.3,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        l10n.sentimentDistribution,
                        style: GoogleFonts.roboto(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: scheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: insight.color.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: insight.color.withValues(alpha: 0.28),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(insight.icon, size: 16, color: insight.color),
                      const SizedBox(width: 4),
                      Text(
                        insight.label,
                        style: GoogleFonts.roboto(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: insight.color,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 22),
            _StackedSentimentBar(
              segments: segments,
              progress: _animation.value,
            ),
            const SizedBox(height: 18),
            Row(
              children: segments
                  .map(
                    (s) => Expanded(
                      child: Padding(
                        padding: EdgeInsets.only(
                          right: s == segments.last ? 0 : 8,
                        ),
                        child: _SentimentTile(
                          segment: s,
                          progress: _animation.value,
                        ),
                      ),
                    ),
                  )
                  .toList(),
            ),
          ],
        );
      },
    );
  }
}

class _SentimentInsight {
  final String label;
  final Color color;
  final IconData icon;

  const _SentimentInsight({
    required this.label,
    required this.color,
    required this.icon,
  });
}

class _Segment {
  final double value;
  final Color color;
  final String label;
  final IconData icon;

  const _Segment({
    required this.value,
    required this.color,
    required this.label,
    required this.icon,
  });
}

class _StackedSentimentBar extends StatelessWidget {
  final List<_Segment> segments;
  final double progress;

  const _StackedSentimentBar({
    required this.segments,
    required this.progress,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final active = segments.where((s) => s.value > 0).toList();
    if (active.isEmpty) {
      return Container(
        height: 14,
        decoration: BoxDecoration(
          color: scheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(999),
        ),
      );
    }

    final total = active.fold<double>(0, (sum, s) => sum + s.value);

    return ClipRRect(
      borderRadius: BorderRadius.circular(999),
      child: SizedBox(
        height: 14,
        child: Row(
          children: [
            for (var i = 0; i < active.length; i++) ...[
              if (i > 0) const SizedBox(width: 3),
              Expanded(
                flex: ((active[i].value / total) * 1000 * progress)
                    .round()
                    .clamp(1, 1000),
                child: Container(
                  color: active[i].color,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _SentimentTile extends StatelessWidget {
  final _Segment segment;
  final double progress;

  const _SentimentTile({
    required this.segment,
    required this.progress,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final pct = (segment.value * progress).round();

    return Container(
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
    );
  }
}
