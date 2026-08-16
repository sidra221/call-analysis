import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/theme/app_theme.dart';

/// Page controls — matches app cards / filter toolbar styling.
class AppPaginationBar extends StatelessWidget {
  final int currentPage;
  final int totalPages;
  final int totalItems;
  final int pageSize;
  final ValueChanged<int> onPageChanged;
  final bool isLoading;

  const AppPaginationBar({
    super.key,
    required this.currentPage,
    required this.totalPages,
    required this.totalItems,
    required this.pageSize,
    required this.onPageChanged,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    if (totalItems == 0) return const SizedBox.shrink();

    final scheme = Theme.of(context).colorScheme;
    final safePages = totalPages < 1 ? 1 : totalPages;
    final page = currentPage.clamp(0, safePages - 1);
    final from = page * pageSize + 1;
    final to = ((page + 1) * pageSize).clamp(0, totalItems);
    final canGoBack = !isLoading && page > 0;
    final canGoForward = !isLoading && page < safePages - 1;

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 8),
      child: SafeArea(
        top: false,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          decoration: AppTheme.cardDecoration(scheme, radius: 16),
          child: Row(
            children: [
              _NavButton(
                icon: Icons.chevron_left_rounded,
                enabled: canGoBack,
                onPressed: canGoBack ? () => onPageChanged(page - 1) : null,
              ),
              Expanded(
                child: isLoading
                    ? const Center(
                        child: SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator.adaptive(
                            strokeWidth: 2,
                          ),
                        ),
                      )
                    : Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            '$from–$to of $totalItems',
                            style: GoogleFonts.roboto(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: scheme.onSurface,
                              letterSpacing: -0.2,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Page ${page + 1} of $safePages',
                            style: GoogleFonts.roboto(
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                              color: scheme.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
              ),
              _NavButton(
                icon: Icons.chevron_right_rounded,
                enabled: canGoForward,
                onPressed:
                    canGoForward ? () => onPageChanged(page + 1) : null,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavButton extends StatelessWidget {
  final IconData icon;
  final bool enabled;
  final VoidCallback? onPressed;

  const _NavButton({
    required this.icon,
    required this.enabled,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return SizedBox(
      width: 44,
      height: 44,
      child: IconButton(
        onPressed: onPressed,
        style: IconButton.styleFrom(
          backgroundColor: enabled
              ? scheme.primary.withValues(alpha: 0.1)
              : scheme.surfaceContainerHighest.withValues(alpha: 0.5),
          foregroundColor:
              enabled ? scheme.primary : scheme.onSurfaceVariant.withValues(alpha: 0.45),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          padding: EdgeInsets.zero,
        ),
        icon: Icon(icon, size: 22),
      ),
    );
  }
}

/// Slice a list for client-side pagination.
List<T> paginateList<T>(List<T> items, int page, int pageSize) {
  if (items.isEmpty) return const [];
  final start = page * pageSize;
  if (start >= items.length) return const [];
  final end = (start + pageSize).clamp(0, items.length);
  return items.sublist(start, end);
}

int totalPagesFor(int itemCount, int pageSize) {
  if (itemCount == 0) return 1;
  return (itemCount / pageSize).ceil();
}
