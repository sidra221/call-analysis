import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/theme_provider.dart';

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
    final themeMode = ref.watch(themeProvider);
    final isDark = themeMode == ThemeMode.dark ||
        (themeMode == ThemeMode.system &&
            MediaQuery.of(context).platformBrightness == Brightness.dark);

    // ألوان تتبدل حسب الوضع
    final scaffoldBg = isDark ? AppTheme.backgroundPrimary : const Color(0xFFFAFAFA);
    final cardBg = isDark ? AppTheme.surface : Colors.white;
    final cardBorder = isDark ? AppTheme.divider : const Color(0xFFE8E8E8);
    final textPrimaryColor = isDark ? AppTheme.textPrimary : const Color(0xFF1A1A1A);
    final textSecondaryColor = isDark ? AppTheme.textSecondary : const Color(0xFF4A4A4A);
    final textMutedColor = isDark ? AppTheme.textSecondary : const Color(0xFF999999);
    final dividerColor = isDark ? AppTheme.divider : const Color(0xFFECECEC);
    final notesCardBg = isDark ? AppTheme.primary.withValues(alpha: 0.08) : const Color(0xFFF0F7FF);
    final neutralChipBg = isDark ? AppTheme.backgroundSecondary : const Color(0xFFF5F5F5);
    final neutralChipText = isDark ? AppTheme.textSecondary : const Color(0xFF666666);
    final rankChipBg = isDark ? AppTheme.primary.withValues(alpha: 0.15) : const Color(0xFFE3F2FD);
    final countChipBg = isDark ? AppTheme.danger.withValues(alpha: 0.15) : const Color(0xFFFCE4EC);
    final countChipText = isDark ? AppTheme.danger : const Color(0xFFE91E63);
    final disabledBtnBg = isDark ? AppTheme.backgroundSecondary : const Color(0xFFF5F5F5);
    final cancelBtnBorder = isDark ? AppTheme.divider : const Color(0xFFE0E0E0);

    return Scaffold(
      backgroundColor: scaffoldBg,
      appBar: AppBar(
        title: Text(
          'Report Details',
          style: GoogleFonts.plusJakartaSans(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: textPrimaryColor,
            letterSpacing: -0.5,
          ),
        ),
        centerTitle: true,
        leading: IconButton(
          icon: FaIcon(
            FontAwesomeIcons.arrowLeft,
            size: 18,
            color: textPrimaryColor,
          ),
          onPressed: () => context.pop(),
        ),
        backgroundColor: scaffoldBg,
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: SlideTransition(
              position: _slideAnimation,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Main container
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
                        // Manager Notes Card
                        _buildManagerNotesCard(
                          notesCardBg: notesCardBg,
                          textPrimaryColor: textPrimaryColor,
                          textSecondaryColor: textSecondaryColor,
                          textMutedColor: textMutedColor,
                        ),
                        const SizedBox(height: 28),

                        // Summary Section
                        _buildLegendSection(
                          title: 'Summary (Issues & Solutions)',
                          scaffoldBg: scaffoldBg,
                          cardBg: cardBg,
                          cardBorder: cardBorder,
                          textPrimaryColor: textPrimaryColor,
                          child: _buildSummaryContent(textSecondaryColor),
                        ),
                        const SizedBox(height: 28),

                        // Positives Section
                        _buildLegendSection(
                          title: 'Positives',
                          scaffoldBg: scaffoldBg,
                          cardBg: cardBg,
                          cardBorder: cardBorder,
                          textPrimaryColor: textPrimaryColor,
                          child: _buildPositivesContent(textSecondaryColor),
                        ),
                        const SizedBox(height: 28),

                        // Recommendations Section
                        _buildLegendSection(
                          title: 'Recommendations',
                          scaffoldBg: scaffoldBg,
                          cardBg: cardBg,
                          cardBorder: cardBorder,
                          textPrimaryColor: textPrimaryColor,
                          child: _buildRecommendationsContent(textSecondaryColor),
                        ),
                        const SizedBox(height: 28),

                        Divider(
                          color: dividerColor,
                          thickness: 1,
                          height: 32,
                        ),
                        const SizedBox(height: 16),

                        // Overall Sentiment
                        _buildOverallSentiment(
                          textPrimaryColor: textPrimaryColor,
                          neutralChipBg: neutralChipBg,
                          neutralChipText: neutralChipText,
                        ),
                        const SizedBox(height: 28),

                        // Top Issues Section
                        _buildTopIssuesSection(
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

                  // Footer Buttons
                  _buildFooterButtons(
                    isDark: isDark,
                    cardBg: cardBg,
                    cancelBtnBorder: cancelBtnBorder,
                    disabledBtnBg: disabledBtnBg,
                    textMutedColor: textMutedColor,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildManagerNotesCard({
    required Color notesCardBg,
    required Color textPrimaryColor,
    required Color textSecondaryColor,
    required Color textMutedColor,
  }) {
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
                  'Manager Notes',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: textPrimaryColor,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'thank you',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 14,
                    fontWeight: FontWeight.w400,
                    color: textSecondaryColor,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'By sedra • 2026-06-16',
                  style: GoogleFonts.plusJakartaSans(
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
            style: GoogleFonts.plusJakartaSans(
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

  Widget _buildSummaryContent(Color textSecondaryColor) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildBulletItem(
          'Product Information Inquiry (x3): Enhance product documentation accessibility for agents and customers by updating FAQs and training agents to quickly provide or direct customers to precise product details.',
          textSecondaryColor,
        ),
        const SizedBox(height: 12),
        _buildBulletItem(
          'Sales and Purchase Order Inquiry (x1): Implement standardized pricing and discount guidelines accessible to agents, and streamline communication protocols for bulk order processing and delivery estimates.',
          textSecondaryColor,
        ),
      ],
    );
  }

  Widget _buildPositivesContent(Color textSecondaryColor) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildBulletItem(
          'Agents successfully identify customer needs and respond with relevant information in sales inquiries.',
          textSecondaryColor,
        ),
        const SizedBox(height: 12),
        _buildBulletItem(
          'Clear, polite communication observed in purchase order discussions.',
          textSecondaryColor,
        ),
        const SizedBox(height: 12),
        _buildBulletItem(
          'Consistent recognition of product inquiry topics indicates agent awareness of common customer questions.',
          textSecondaryColor,
        ),
      ],
    );
  }

  Widget _buildRecommendationsContent(Color textSecondaryColor) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildBulletItem(
          'Develop comprehensive training modules focused on product knowledge and sales process efficiency.',
          textSecondaryColor,
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
            style: GoogleFonts.plusJakartaSans(
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
    required Color textPrimaryColor,
    required Color neutralChipBg,
    required Color neutralChipText,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Overall Sentiment',
          style: GoogleFonts.plusJakartaSans(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            color: textPrimaryColor,
          ),
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
          decoration: BoxDecoration(
            color: neutralChipBg,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              FaIcon(
                FontAwesomeIcons.faceMeh,
                size: 14,
                color: neutralChipText,
              ),
              const SizedBox(width: 8),
              Text(
                'neutral',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: neutralChipText,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildTopIssuesSection({
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
              'Top Issues',
              style: GoogleFonts.plusJakartaSans(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: textPrimaryColor,
              ),
            ),
            Text(
              '2',
              style: GoogleFonts.plusJakartaSans(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: textPrimaryColor,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        _buildTopIssueRow(
          rank: 1,
          title: 'Product Information Inquiry',
          count: 3,
          textPrimaryColor: textPrimaryColor,
          rankChipBg: rankChipBg,
          countChipBg: countChipBg,
          countChipText: countChipText,
        ),
        const SizedBox(height: 12),
        Divider(
          color: dividerColor,
          thickness: 1,
          height: 1,
        ),
        const SizedBox(height: 12),
        _buildTopIssueRow(
          rank: 2,
          title: 'Sales and Purchase Order Inquiry',
          count: 1,
          textPrimaryColor: textPrimaryColor,
          rankChipBg: rankChipBg,
          countChipBg: countChipBg,
          countChipText: countChipText,
        ),
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
            style: GoogleFonts.plusJakartaSans(
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
            style: GoogleFonts.plusJakartaSans(
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
            style: GoogleFonts.plusJakartaSans(
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
    required bool isDark,
    required Color cardBg,
    required Color cancelBtnBorder,
    required Color disabledBtnBg,
    required Color textMutedColor,
  }) {
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
                  'Cancel',
                  style: GoogleFonts.plusJakartaSans(
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
                onPressed: null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: disabledBtnBg,
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
                      color: textMutedColor,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'Reviewed',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: textMutedColor,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: OutlinedButton(
                onPressed: () {},
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
                  'Add Notes',
                  style: GoogleFonts.plusJakartaSans(
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
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () {},
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.success,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const FaIcon(
                  FontAwesomeIcons.filePdf,
                  size: 16,
                  color: Colors.white,
                ),
                const SizedBox(width: 8),
                Text(
                  'Download PDF',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}