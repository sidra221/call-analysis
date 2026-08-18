import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../shared/enums.dart';

/// Matches React manager theme (`frontend/src/themes/theme/manager.js`).
class AppTheme {
  // ── Brand (manager / default preset) ──────────────────────────────────────
  static const Color primary = Color(0xFF2196F3);
  static const Color primaryDark = Color(0xFF1E88E5);
  static const Color primaryLight = Color(0xFFE3F2FD);
  static const Color primary200 = Color(0xFF90CAF9);
  static const Color primary800 = Color(0xFF1565C0);

  static const Color secondary = Color(0xFF5E35B1);
  static const Color secondaryLight = Color(0xFFEDE7F6);
  static const Color secondaryDark = Color(0xFF4527A0);

  static const Color success = Color(0xFF00E676);
  static const Color successLight = Color(0xFFB9F6CA);
  static const Color successDark = Color(0xFF00C853);

  static const Color danger = Color(0xFFF44336);
  static const Color errorLight = Color(0xFFEF9A9A);
  static const Color errorDark = Color(0xFFC62828);

  static const Color warning = Color(0xFFFFE57F);
  static const Color warningLight = Color(0xFFFFF8E1);
  static const Color warningDark = Color(0xFFFFC107);

  /// High-priority accent (React `PRIORITY_HIGH_ORANGE`).
  static const Color orange = Color(0xFFFF9800);
  static const Color orangeMain = orange;
  static const Color orangeDark = Color(0xFFE65100);

  /// React palette has no separate info token — align with primary blue.
  static const Color info = primary;
  static const Color accent = warningDark;

  /// Sentiment palette — balanced visual weight (neutral amber, not pale yellow).
  static const Color sentimentPositive = success;
  static const Color sentimentNeutral = Color(0xFFFF9800);
  static const Color sentimentNegative = danger;

  // ── Light surfaces & text (manager.js) ───────────────────────────────────
  static const Color paper = Color(0xFFFFFFFF);
  static const Color grey50 = Color(0xFFF8FAFC);
  static const Color grey100 = Color(0xFFEEF2F6);
  static const Color grey200 = Color(0xFFE3E8EF);
  static const Color grey500 = Color(0xFF697586);
  static const Color grey700 = Color(0xFF364152);
  static const Color grey900 = Color(0xFF121926);

  static const Color backgroundPrimary = paper;
  static const Color backgroundSecondary = grey100;
  static const Color surface = paper;
  static const Color divider = grey200;
  static const Color textPrimary = grey700;
  static const Color textSecondary = grey500;

  // ── Dark surfaces & text (manager.js) ────────────────────────────────────
  static const Color darkPaper = Color(0xFF111936);
  static const Color darkBackground = Color(0xFF1A223F);
  static const Color darkLevel1 = Color(0xFF29314F);
  static const Color darkLevel2 = Color(0xFF212946);
  static const Color darkTextPrimary = Color(0xFFBDC8F0);
  static const Color darkTextSecondary = Color(0xFF8492C4);
  static const Color darkTextTitle = Color(0xFFD7DCEC);

  /// Notification accent colors (React NotificationSection).
  static const Color notificationFollowup = Color(0xFFED6C02);
  static const Color notificationReport = Color(0xFF9C27B0);

  static const double borderRadius = 8;
  static const double cardBorderRadius = 16; // Card override: borderRadius * 2
  static const double buttonHeight = 48;
  static const double buttonRadius = 12;

  static const double chipBackgroundOpacity = 0.12;
  static const double chipBorderOpacity = 0.25;

  static BoxDecoration chipDecoration(Color color, {double? radius}) =>
      BoxDecoration(
        color: color.withValues(alpha: chipBackgroundOpacity),
        borderRadius: BorderRadius.circular(radius ?? borderRadius),
        border: Border.all(
          color: color.withValues(alpha: chipBorderOpacity),
        ),
      );

  /// Critical uses [danger] when shown as its own tier (e.g. dashboard card).
  static Color priorityColor(PriorityLevel priority) {
    switch (priority) {
      case PriorityLevel.critical:
        return danger;
      case PriorityLevel.low:
        return success;
      case PriorityLevel.medium:
        return warningDark;
      case PriorityLevel.high:
        return orange;
    }
  }

  static Color statusColor(CallStatus status) {
    switch (status) {
      case CallStatus.completed:
        return success;
      case CallStatus.failed:
        return danger;
      case CallStatus.inProgress:
        return primary;
      case CallStatus.queued:
        return warningDark;
    }
  }

  static Color sentimentColor(Sentiment sentiment, ColorScheme scheme) {
    switch (sentiment) {
      case Sentiment.positive:
        return sentimentPositive;
      case Sentiment.negative:
        return sentimentNegative;
      case Sentiment.neutral:
        return sentimentNeutral;
    }
  }

  static List<BoxShadow> cardShadow(ColorScheme scheme) => [
        BoxShadow(
          color: grey900.withValues(alpha: 0.06),
          blurRadius: 6,
          offset: const Offset(0, 2),
        ),
      ];

  /// Unified card surface — border + soft shadow for all cards.
  static BoxDecoration cardDecoration(
    ColorScheme scheme, {
    Color? color,
    double? radius,
  }) =>
      BoxDecoration(
        color: color ?? scheme.surface,
        borderRadius: BorderRadius.circular(radius ?? cardBorderRadius),
        border: Border.all(color: scheme.outline, width: 1),
        boxShadow: cardShadow(scheme),
      );

  static TextTheme _textTheme(Brightness brightness) {
    final base = ThemeData(brightness: brightness).textTheme;
    return GoogleFonts.robotoTextTheme(base).apply(
      bodyColor: brightness == Brightness.light ? textPrimary : darkTextPrimary,
      displayColor:
          brightness == Brightness.light ? grey900 : darkTextTitle,
    );
  }

  static ColorScheme _lightScheme = const ColorScheme(
    brightness: Brightness.light,
    primary: primary,
    onPrimary: Colors.white,
    primaryContainer: primaryLight,
    onPrimaryContainer: primary800,
    secondary: secondary,
    onSecondary: Colors.white,
    secondaryContainer: secondaryLight,
    onSecondaryContainer: secondaryDark,
    tertiary: warningDark,
    onTertiary: grey700,
    tertiaryContainer: warningLight,
    onTertiaryContainer: grey700,
    error: danger,
    onError: Colors.white,
    errorContainer: errorLight,
    onErrorContainer: errorDark,
    surface: paper,
    onSurface: textPrimary,
    onSurfaceVariant: textSecondary,
    outline: grey200,
    outlineVariant: grey100,
    shadow: grey900,
    scrim: Colors.black,
    inverseSurface: grey900,
    onInverseSurface: paper,
    inversePrimary: primary200,
    surfaceTint: primary,
  );

  static ColorScheme _darkScheme = const ColorScheme(
    brightness: Brightness.dark,
    primary: primary,
    onPrimary: Colors.white,
    primaryContainer: primary800,
    onPrimaryContainer: primaryLight,
    secondary: Color(0xFF7C4DFF),
    onSecondary: Colors.white,
    secondaryContainer: Color(0xFFD1C4E9),
    onSecondaryContainer: Color(0xFF651FFF),
    tertiary: warningDark,
    onTertiary: grey700,
    tertiaryContainer: warningLight,
    onTertiaryContainer: grey700,
    error: danger,
    onError: Colors.white,
    errorContainer: errorLight,
    onErrorContainer: errorDark,
    surface: darkPaper,
    onSurface: darkTextPrimary,
    onSurfaceVariant: darkTextSecondary,
    outline: darkLevel1,
    outlineVariant: darkLevel2,
    shadow: Colors.black,
    scrim: Colors.black,
    inverseSurface: darkTextPrimary,
    onInverseSurface: darkPaper,
    inversePrimary: primaryDark,
    surfaceTint: primary,
  );

  static ThemeData get light => _buildTheme(_lightScheme, Brightness.light);

  static ThemeData get dark => _buildTheme(_darkScheme, Brightness.dark);

  static ThemeData _buildTheme(ColorScheme scheme, Brightness brightness) {
    final isLight = brightness == Brightness.light;
    final scaffoldBg = isLight ? paper : darkBackground;

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: scheme,
      scaffoldBackgroundColor: scaffoldBg,
      visualDensity: VisualDensity.adaptivePlatformDensity,
      textTheme: _textTheme(brightness),
      appBarTheme: AppBarTheme(
        centerTitle: true,
        elevation: 0,
        scrolledUnderElevation: 0,
        backgroundColor: scaffoldBg,
        surfaceTintColor: Colors.transparent,
        foregroundColor: scheme.onSurface,
        titleTextStyle: GoogleFonts.roboto(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: scheme.onSurface,
        ),
        iconTheme: IconThemeData(color: scheme.onSurface),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        margin: const EdgeInsets.symmetric(vertical: 6, horizontal: 8),
        color: scheme.surface,
        shadowColor: grey900.withValues(alpha: 0.24),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(cardBorderRadius),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 0,
          shadowColor: Colors.transparent,
          minimumSize: const Size(64, buttonHeight),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          backgroundColor: primary,
          foregroundColor: Colors.white,
          disabledBackgroundColor: isLight ? grey200 : darkLevel1,
          disabledForegroundColor: isLight ? grey500 : darkTextSecondary,
          overlayColor: Colors.white.withValues(alpha: 0.16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(buttonRadius),
          ),
          textStyle: GoogleFonts.roboto(
            fontWeight: FontWeight.w600,
            fontSize: 14,
          ),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          elevation: 0,
          minimumSize: const Size(64, buttonHeight),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          backgroundColor: primary,
          foregroundColor: Colors.white,
          disabledBackgroundColor: isLight ? grey200 : darkLevel1,
          disabledForegroundColor: isLight ? grey500 : darkTextSecondary,
          overlayColor: Colors.white.withValues(alpha: 0.16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(buttonRadius),
          ),
          textStyle: GoogleFonts.roboto(
            fontWeight: FontWeight.w600,
            fontSize: 14,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(64, buttonHeight),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          foregroundColor: primary,
          overlayColor: primary.withValues(alpha: 0.12),
          side: const BorderSide(color: primary, width: 1.4),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(buttonRadius),
          ),
          textStyle: GoogleFonts.roboto(
            fontWeight: FontWeight.w600,
            fontSize: 14,
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primary,
          overlayColor: primary.withValues(alpha: 0.12),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(buttonRadius),
          ),
          textStyle: GoogleFonts.roboto(
            fontWeight: FontWeight.w600,
            fontSize: 14,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: isLight ? grey100 : darkLevel2,
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(borderRadius),
          borderSide: BorderSide(color: scheme.outline),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(borderRadius),
          borderSide: BorderSide(color: scheme.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(borderRadius),
          borderSide: BorderSide(color: scheme.error),
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: isLight ? primaryLight : darkLevel2,
        selectedColor: primary.withValues(alpha: 0.15),
        labelStyle: GoogleFonts.roboto(
          fontSize: 13,
          fontWeight: FontWeight.w500,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(borderRadius),
        ),
        side: BorderSide.none,
      ),
      navigationBarTheme: NavigationBarThemeData(
        height: 64,
        elevation: 0,
        backgroundColor: scheme.surface,
        surfaceTintColor: Colors.transparent,
        indicatorColor: primary.withValues(alpha: 0.12),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          final selected = states.contains(WidgetState.selected);
          return GoogleFonts.roboto(
            fontSize: 12,
            fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
            color: selected ? primary : scheme.onSurfaceVariant,
          );
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          final selected = states.contains(WidgetState.selected);
          return IconThemeData(
            color: selected ? primary : scheme.onSurfaceVariant,
            size: 22,
          );
        }),
      ),
      dividerTheme: DividerThemeData(
        color: scheme.outline,
        thickness: 1,
        space: 1,
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(borderRadius),
        ),
      ),
      dialogTheme: DialogThemeData(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(cardBorderRadius),
        ),
      ),
      bottomSheetTheme: BottomSheetThemeData(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(
            top: Radius.circular(cardBorderRadius),
          ),
        ),
      ),
    );
  }
}
