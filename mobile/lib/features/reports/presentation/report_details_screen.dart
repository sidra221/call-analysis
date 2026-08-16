import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/theme_provider.dart';
import '../../../shared/enums.dart';
import '../../../shared/widgets/ui.dart';
import '../../../l10n/app_localizations.dart';
import '../application/reports_providers.dart';
import '../domain/report.dart';
import 'report_download_button.dart';

class ReportDetailsScreen extends ConsumerStatefulWidget {
  final String reportId;

  const ReportDetailsScreen({
    super.key,
    required this.reportId,
  });

  @override
  ConsumerState<ReportDetailsScreen> createState() => _ReportDetailsScreenState();
}

class _ReportDetailsScreenState extends ConsumerState<ReportDetailsScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 250),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOut),
    );

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.05),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOut),
    );

    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final themeMode = ref.watch(themeProvider);
    final isDark = themeMode == ThemeMode.dark ||
        (themeMode == ThemeMode.system &&
            MediaQuery.of(context).platformBrightness == Brightness.dark);

    final scheme = Theme.of(context).colorScheme;

    final scaffoldBg = isDark ? AppTheme.darkBackground : AppTheme.paper;
    final cardBg = scheme.surface;
    final cardBorder = scheme.outline;
    final textPrimaryColor = scheme.onSurface;
    final textSecondaryColor = scheme.onSurfaceVariant;
    final textMutedColor = scheme.onSurfaceVariant;
    final dividerColor = scheme.outline;
    final notesCardBg = isDark
        ? AppTheme.primary.withValues(alpha: 0.08)
        : AppTheme.primaryLight;
    final rankChipBg = isDark
        ? AppTheme.primary.withValues(alpha: 0.15)
        : AppTheme.primaryLight;
    final countChipBg = isDark
        ? AppTheme.danger.withValues(alpha: 0.15)
        : AppTheme.errorLight.withValues(alpha: 0.35);
    final countChipText = AppTheme.danger;
    final disabledBtnBg = isDark ? AppTheme.darkLevel2 : AppTheme.grey100;
    final cancelBtnBorder = scheme.outline;

    return Scaffold(
      backgroundColor: scaffoldBg,
      appBar: AppBar(
        title: Text(
          l10n.reportDetails,
          style: GoogleFonts.roboto(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: textPrimaryColor,
            letterSpacing: -0.5,
          ),
        ),
        centerTitle: true,
        leading: IconButton(
          icon: Icon(
            Icons.arrow_back,
            size: 18,
            color: textPrimaryColor,
          ),
          onPressed: () => context.pop(),
        ),
        backgroundColor: scaffoldBg,
        elevation: 0,
      ),
      body: SafeArea(
        child: ref.watch(reportDetailsProvider(widget.reportId)).when(
          data: (report) => SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
            child: FadeTransition(
              opacity: _fadeAnimation,
              child: SlideTransition(
                position: _slideAnimation,
                child: _buildReportContent(
                  l10n: l10n,
                  report: report,
                  isDark: isDark,
                  scaffoldBg: scaffoldBg,
                  cardBg: cardBg,
                  cardBorder: cardBorder,
                  textPrimaryColor: textPrimaryColor,
                  textSecondaryColor: textSecondaryColor,
                  textMutedColor: textMutedColor,
                  dividerColor: dividerColor,
                  notesCardBg: notesCardBg,
                  rankChipBg: rankChipBg,
                  countChipBg: countChipBg,
                  countChipText: countChipText,
                  disabledBtnBg: disabledBtnBg,
                  cancelBtnBorder: cancelBtnBorder,
                ),
              ),
            ),
          ),
          loading: () => const Center(
            child: CircularProgressIndicator.adaptive(),
          ),
          error: (e, _) => ErrorView(
            message: l10n.failedToLoadReportDetails,
            onRetry: () => ref.invalidate(reportDetailsProvider(widget.reportId)),
          ),
        ),
      ),
    );
  }

  Widget _buildReportContent({
    required AppLocalizations l10n,
    required Report report,
    required bool isDark,
    required Color scaffoldBg,
    required Color cardBg,
    required Color cardBorder,
    required Color textPrimaryColor,
    required Color textSecondaryColor,
    required Color textMutedColor,
    required Color dividerColor,
    required Color notesCardBg,
    required Color rankChipBg,
    required Color countChipBg,
    required Color countChipText,
    required Color disabledBtnBg,
    required Color cancelBtnBorder,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          decoration: BoxDecoration(
            color: cardBg,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(
              color: cardBorder,
              width: 1,
            ),
            boxShadow: isDark
                ? null
                : [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.05),
                      blurRadius: 20,
                      offset: const Offset(0, 4),
                    ),
                  ],
          ),
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (report.managerNotes.trim().isNotEmpty)
                _buildManagerNotesCard(
                  l10n: l10n,
                  report: report,
                  notesCardBg: notesCardBg,
                  textPrimaryColor: textPrimaryColor,
                  textSecondaryColor: textSecondaryColor,
                  textMutedColor: textMutedColor,
                ),
              if (report.managerNotes.trim().isNotEmpty)
                const SizedBox(height: 28),
              _buildLegendSection(
                title: l10n.summaryIssuesSolutions,
                scaffoldBg: scaffoldBg,
                cardBg: cardBg,
                cardBorder: cardBorder,
                textPrimaryColor: textPrimaryColor,
                child: _buildTextBullets(l10n, report.summary, textSecondaryColor),
              ),
              const SizedBox(height: 28),
              _buildLegendSection(
                title: l10n.positives,
                scaffoldBg: scaffoldBg,
                cardBg: cardBg,
                cardBorder: cardBorder,
                textPrimaryColor: textPrimaryColor,
                child: _buildTextBullets(l10n, report.positives, textSecondaryColor),
              ),
              const SizedBox(height: 28),
              _buildLegendSection(
                title: l10n.recommendations,
                scaffoldBg: scaffoldBg,
                cardBg: cardBg,
                cardBorder: cardBorder,
                textPrimaryColor: textPrimaryColor,
                child: _buildTextBullets(
                  l10n,
                  report.recommendations,
                  textSecondaryColor,
                ),
              ),
              const SizedBox(height: 28),
              Divider(
                color: dividerColor,
                thickness: 1,
                height: 32,
              ),
              const SizedBox(height: 16),
              _buildOverallSentiment(
                l10n: l10n,
                sentiment: report.overallSentiment,
                textPrimaryColor: textPrimaryColor,
              ),
              const SizedBox(height: 28),
              _buildTopIssuesSection(
                l10n: l10n,
                issues: report.topIssues,
                textPrimaryColor: textPrimaryColor,
                dividerColor: dividerColor,
                rankChipBg: rankChipBg,
                countChipBg: countChipBg,
                countChipText: countChipText,
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        _buildFooterButtons(
          l10n: l10n,
          report: report,
          isDark: isDark,
          cardBg: cardBg,
          cancelBtnBorder: cancelBtnBorder,
          disabledBtnBg: disabledBtnBg,
          textMutedColor: textMutedColor,
        ),
      ],
    );
  }

  List<String> _textToBullets(AppLocalizations l10n, String text) {
    final lines = text
        .split('\n')
        .map((line) => line.trim())
        .where((line) => line.isNotEmpty)
        .toList();
    if (lines.isEmpty) return [l10n.noDataAvailable];
    return lines;
  }

  Widget _buildTextBullets(
    AppLocalizations l10n,
    String text,
    Color textSecondaryColor,
  ) {
    final bullets = _textToBullets(l10n, text);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (var i = 0; i < bullets.length; i++) ...[
          if (i > 0) const SizedBox(height: 12),
          _buildBulletItem(bullets[i], textSecondaryColor),
        ],
      ],
    );
  }

  Widget _buildManagerNotesCard({
    required AppLocalizations l10n,
    required Report report,
    required Color notesCardBg,
    required Color textPrimaryColor,
    required Color textSecondaryColor,
    required Color textMutedColor,
  }) {
    final dateLabel = DateFormat.yMMMd().format(report.date);
    return Container(
      decoration: BoxDecoration(
        color: notesCardBg,
        borderRadius: BorderRadius.circular(18),
      ),
      padding: const EdgeInsets.all(20),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppTheme.primary.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: const Center(
              child: Icon(
                Icons.info_outline,
                color: AppTheme.primary,
                size: 20,
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l10n.managerNotes,
                  style: GoogleFonts.roboto(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: textPrimaryColor,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  report.managerNotes,
                  style: GoogleFonts.roboto(
                    fontSize: 14,
                    fontWeight: FontWeight.w400,
                    color: textSecondaryColor,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  l10n.reportByAuthor(report.createdByUsername, dateLabel),
                  style: GoogleFonts.roboto(
                    fontSize: 12,
                    fontWeight: FontWeight.w400,
                    color: textMutedColor,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLegendSection({
    required String title,
    required Widget child,
    required Color scaffoldBg,
    required Color cardBg,
    required Color cardBorder,
    required Color textPrimaryColor,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          margin: const EdgeInsets.only(left: 16),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            color: cardBg,
          ),
          child: Text(
            title,
            style: GoogleFonts.roboto(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: textPrimaryColor,
            ),
          ),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: cardBg,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: cardBorder,
              width: 1,
            ),
          ),
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
          child: child,
        ),
      ],
    );
  }

  Widget _buildBulletItem(String text, Color textSecondaryColor) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          margin: const EdgeInsets.only(top: 6),
          width: 6,
          height: 6,
          decoration: const BoxDecoration(
            color: AppTheme.primary,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            text,
            style: GoogleFonts.roboto(
              fontSize: 14,
              fontWeight: FontWeight.w400,
              color: textSecondaryColor,
              height: 1.6,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildOverallSentiment({
    required AppLocalizations l10n,
    required String sentiment,
    required Color textPrimaryColor,
  }) {
    final scheme = Theme.of(context).colorScheme;
    final sentimentValue = switch (sentiment.toLowerCase()) {
      'positive' => Sentiment.positive,
      'negative' => Sentiment.negative,
      _ => Sentiment.neutral,
    };
    final chipColor = AppTheme.sentimentColor(sentimentValue, scheme);
    final icon = switch (sentimentValue) {
      Sentiment.positive => Icons.sentiment_satisfied_outlined,
      Sentiment.negative => Icons.sentiment_dissatisfied_outlined,
      Sentiment.neutral => Icons.sentiment_neutral_outlined,
    };
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          l10n.overallSentiment,
          style: GoogleFonts.roboto(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            color: textPrimaryColor,
          ),
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
          decoration: AppTheme.chipDecoration(chipColor, radius: 20),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                size: 14,
                color: chipColor,
              ),
              const SizedBox(width: 8),
              Text(
                sentiment,
                style: GoogleFonts.roboto(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: chipColor,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildTopIssuesSection({
    required AppLocalizations l10n,
    required List<ReportIssue> issues,
    required Color textPrimaryColor,
    required Color dividerColor,
    required Color rankChipBg,
    required Color countChipBg,
    required Color countChipText,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              l10n.topIssues,
              style: GoogleFonts.roboto(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: textPrimaryColor,
              ),
            ),
            Text(
              '${issues.length}',
              style: GoogleFonts.roboto(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: textPrimaryColor,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (issues.isEmpty)
          Text(
            l10n.noIssuesData,
            style: GoogleFonts.roboto(
              fontSize: 14,
              color: textPrimaryColor.withValues(alpha: 0.7),
            ),
          )
        else
          ...issues.asMap().entries.expand((entry) {
            final index = entry.key;
            final issue = entry.value;
            return [
              if (index > 0) ...[
                const SizedBox(height: 12),
                Divider(
                  color: dividerColor,
                  thickness: 1,
                  height: 1,
                ),
                const SizedBox(height: 12),
              ],
              _buildTopIssueRow(
                rank: index + 1,
                title: issue.title,
                count: issue.count,
                textPrimaryColor: textPrimaryColor,
                rankChipBg: rankChipBg,
                countChipBg: countChipBg,
                countChipText: countChipText,
              ),
            ];
          }),
      ],
    );
  }

  Widget _buildTopIssueRow({
    required int rank,
    required String title,
    required int count,
    required Color textPrimaryColor,
    required Color rankChipBg,
    required Color countChipBg,
    required Color countChipText,
  }) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color: rankChipBg,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            '#$rank',
            style: GoogleFonts.roboto(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppTheme.primary,
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            title,
            style: GoogleFonts.roboto(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: textPrimaryColor,
            ),
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: countChipBg,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            '$count',
            style: GoogleFonts.roboto(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: countChipText,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildFooterButtons({
    required AppLocalizations l10n,
    required Report report,
    required bool isDark,
    required Color cardBg,
    required Color cancelBtnBorder,
    required Color disabledBtnBg,
    required Color textMutedColor,
  }) {
    final hasNotes = report.managerNotes.trim().isNotEmpty;

    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () {
                  if (context.canPop()) {
                    context.pop();
                  }
                },
                style: OutlinedButton.styleFrom(
                  backgroundColor: cardBg,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  side: BorderSide(
                    color: cancelBtnBorder,
                    width: 1,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Text(
                  l10n.cancel,
                  style: GoogleFonts.roboto(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: textMutedColor,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton(
                onPressed: hasNotes
                    ? null
                    : () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(l10n.reviewed),
                            behavior: SnackBarBehavior.floating,
                          ),
                        );
                      },
                style: ElevatedButton.styleFrom(
                  backgroundColor: hasNotes ? disabledBtnBg : AppTheme.primary,
                  disabledBackgroundColor: disabledBtnBg,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.check,
                      size: 16,
                      color: hasNotes ? textMutedColor : Colors.white,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      l10n.reviewed,
                      style: GoogleFonts.roboto(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: hasNotes ? textMutedColor : Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: OutlinedButton(
                onPressed: () => _showNotesDialog(l10n, report),
                style: OutlinedButton.styleFrom(
                  backgroundColor: cardBg,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  side: const BorderSide(
                    color: AppTheme.secondary,
                    width: 1,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Text(
                  l10n.addNotes,
                  style: GoogleFonts.roboto(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.secondary,
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        ReportDownloadButton(report: report),
      ],
    );
  }

  void _showNotesDialog(AppLocalizations l10n, Report report) {
    final controller = TextEditingController(text: report.managerNotes);
    showDialog<void>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(l10n.addNotes),
        content: TextField(
          controller: controller,
          maxLines: 4,
          decoration: InputDecoration(
            hintText: l10n.addNotes,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: Text(MaterialLocalizations.of(dialogContext).cancelButtonLabel),
          ),
          FilledButton(
            onPressed: () {
              Navigator.pop(dialogContext);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(l10n.addNotes),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            },
            child: Text(MaterialLocalizations.of(dialogContext).okButtonLabel),
          ),
        ],
      ),
    );
  }
}