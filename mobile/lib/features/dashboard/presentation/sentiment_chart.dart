import 'dart:math';
import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:auto_size_text/auto_size_text.dart';
import '../../../core/theme/app_theme.dart';

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
  late AnimationController _animationController;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );
    _animation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOutCubic),
    );
    _animationController.forward();
  }

  @override
  void didUpdateWidget(SentimentChart oldWidget) {
    super.didUpdateWidget(oldWidget);
    _animationController.forward(from: 0);
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: scheme.primary.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const FaIcon(
                FontAwesomeIcons.chartPie,
                size: 20,
                color: AppTheme.primary,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Sentiment Analysis',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Distribution of analyzed customer calls.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: scheme.outline,
                        ),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        LayoutBuilder(
          builder: (context, constraints) {
            final chartSize = min(constraints.maxWidth * 0.7, 280.0);
            return Center(
              child: SizedBox(
                height: chartSize,
                width: chartSize,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    AnimatedBuilder(
                      animation: _animation,
                      builder: (context, child) {
                        return PieChart(
                          PieChartData(
                            startDegreeOffset: -90,
                            sectionsSpace: 6,
                            centerSpaceRadius: chartSize * 0.35,
                            sections: [
                              PieChartSectionData(
                                value: widget.positivePct * _animation.value,
                                color: AppTheme.success,
                                radius: chartSize * 0.22,
                                showTitle: false,
                                borderSide: BorderSide.none,
                              ),
                              PieChartSectionData(
                                value: widget.neutralPct * _animation.value,
                                color: AppTheme.warning,
                                radius: chartSize * 0.22,
                                showTitle: false,
                                borderSide: BorderSide.none,
                              ),
                              PieChartSectionData(
                                value: widget.negativePct * _animation.value,
                                color: AppTheme.danger,
                                radius: chartSize * 0.22,
                                showTitle: false,
                                borderSide: BorderSide.none,
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        AutoSizeText(
                          '${widget.positivePct.toStringAsFixed(0)}%',
                          style: TextStyle(
                            fontSize: chartSize * 0.15,
                            fontWeight: FontWeight.w900,
                            color: AppTheme.success,
                          ),
                          maxLines: 1,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Positive',
                          style: TextStyle(
                            fontSize: chartSize * 0.06,
                            color: scheme.outline,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        ),
        const SizedBox(height: 24),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            _LegendItem(
              color: AppTheme.success,
              label: 'Positive',
              percentage: widget.positivePct,
            ),
            _LegendItem(
              color: AppTheme.warning,
              label: 'Neutral',
              percentage: widget.neutralPct,
            ),
            _LegendItem(
              color: AppTheme.danger,
              label: 'Negative',
              percentage: widget.negativePct,
            ),
          ],
        ),
      ],
    );
  }
}

class _LegendItem extends StatelessWidget {
  final Color color;
  final String label;
  final double percentage;

  const _LegendItem({
    required this.color,
    required this.label,
    required this.percentage,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 14,
          height: 14,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(7),
          ),
        ),
        const SizedBox(width: 8),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
            ),
            Text(
              '${percentage.toStringAsFixed(0)}%',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: scheme.outline,
                  ),
            ),
          ],
        ),
      ],
    );
  }
}
