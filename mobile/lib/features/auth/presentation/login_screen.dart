import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/theme_provider.dart';
import 'package:go_router/go_router.dart';
import '../../../l10n/app_localizations.dart';
import '../application/auth_controller.dart';

// ألوان اللايت مود بس (نفس الديزاين يلي حبيته)
class _LightColors {
  static const primary = Color(0xFF2196F3);
  static const background = Color(0xFFE3F2FD);
  static const card = Colors.white;
  static const border = Color(0xFFCBD5E1);
  static const textPrimary = Color(0xFF364152);
  static const textSecondary = Color(0xFF697586);
}

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();

  final TextEditingController usernameController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();

  bool isLoading = false;
  bool obscurePassword = true;
Future<void> login() async {
  if (!_formKey.currentState!.validate()) return;

  setState(() => isLoading = true);

  final success = await ref
      .read(authControllerProvider.notifier)
      .login(
        usernameController.text.trim(),
        passwordController.text,
      );

  setState(() => isLoading = false);

  if (success && mounted) {
    context.goNamed('home');
  } else if (mounted) {
    final l10n = AppLocalizations.of(context)!;
    final errorMessage =
        ref.read(authControllerProvider).error ?? l10n.loginFailed;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(errorMessage),
      ),
    );
  }
}
  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final themeMode = ref.watch(themeProvider);
    final isDark = themeMode == ThemeMode.dark ||
        (themeMode == ThemeMode.system &&
            MediaQuery.of(context).platformBrightness == Brightness.dark);

    // اختيار الألوان حسب الوضع
    final backgroundColor = isDark ? AppTheme.darkBackground : _LightColors.background;
    final cardColor = isDark ? AppTheme.darkPaper : _LightColors.card;
    final borderColor = isDark ? AppTheme.darkLevel1 : _LightColors.border;
    final primaryColor = isDark ? AppTheme.primary : _LightColors.primary;
    final titleColor = isDark ? AppTheme.darkTextTitle : _LightColors.primary;
    final textPrimaryColor = isDark ? AppTheme.darkTextPrimary : _LightColors.textPrimary;
    final textSecondaryColor = isDark ? AppTheme.darkTextSecondary : _LightColors.textSecondary;
    final shadowColor = isDark ? Colors.black.withValues(alpha: 0.4) : primaryColor.withValues(alpha: 0.15);
    final fieldFillColor = isDark ? AppTheme.darkLevel2 : Colors.white;

    return Scaffold(
      backgroundColor: backgroundColor,
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
          child: Form(
            key: _formKey,
            child: Container(
              width: 410,
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: cardColor,
                borderRadius: BorderRadius.circular(24),
                border: isDark ? Border.all(color: borderColor, width: 1) : null,
                boxShadow: [
                  BoxShadow(
                    color: shadowColor,
                    blurRadius: 32,
                    offset: const Offset(0, 16),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    l10n.login,
                    style: TextStyle(
                      fontSize: 26,
                      color: primaryColor,
                      fontWeight: FontWeight.bold,
                    ),
                  ),

                  const SizedBox(height: 8),

                  Text(
                    l10n.enterCredentials,
                    style: TextStyle(
                      fontSize: 14,
                      color: textSecondaryColor,
                    ),
                  ),

                  const SizedBox(height: 28),

                  // Username
                  TextFormField(
                    controller: usernameController,
                    keyboardType: TextInputType.text,
                    style: TextStyle(color: textPrimaryColor),
                    decoration: InputDecoration(
                      filled: true,
                      fillColor: fieldFillColor,
                      hintText: l10n.username,
                      hintStyle: TextStyle(color: textSecondaryColor.withValues(alpha: 0.7)),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: BorderSide(color: borderColor),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: BorderSide(color: borderColor),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: BorderSide(color: primaryColor, width: 1.5),
                      ),
                      contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
                    ),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return l10n.usernameRequired;
                      }
                      return null;
                    },
                  ),

                  const SizedBox(height: 16),

                  // Password
                  TextFormField(
                    controller: passwordController,
                    obscureText: obscurePassword,
                    style: TextStyle(color: textPrimaryColor),
                    decoration: InputDecoration(
                      filled: true,
                      fillColor: fieldFillColor,
                      hintText: l10n.password,
                      hintStyle: TextStyle(color: textSecondaryColor.withValues(alpha: 0.7)),
                      suffixIcon: IconButton(
                        icon: Icon(
                          obscurePassword
                              ? Icons.visibility_off_outlined
                              : Icons.visibility_outlined,
                          color: textSecondaryColor,
                        ),
                        onPressed: () {
                          setState(() {
                            obscurePassword = !obscurePassword;
                          });
                        },
                      ),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: BorderSide(color: borderColor),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: BorderSide(color: borderColor),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: BorderSide(color: primaryColor, width: 1.5),
                      ),
                      contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return l10n.passwordRequiredField;
                      }
                      if (value.length < 6) {
                        return l10n.passwordMinLength;
                      }
                      return null;
                    },
                  ),

                  const SizedBox(height: 24),

                  // Login Button
                  SizedBox(
                    width: double.infinity,
                    height: 55,
                    child: ElevatedButton(
                      onPressed: isLoading ? null : login,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: primaryColor,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: AnimatedSwitcher(
                        duration: const Duration(milliseconds: 200),
                        child: isLoading
                            ? const SizedBox(
                                key: ValueKey('loading'),
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2.5,
                                  color: Colors.white,
                                ),
                              )
                            : Text(
                                l10n.login,
                                key: const ValueKey('label'),
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Register link
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        l10n.noAccount,
                        style: TextStyle(
                          fontSize: 14,
                          color: textPrimaryColor,
                        ),
                      ),
                      GestureDetector(
                        onTap: () {
                          // Navigator.pushNamed(context, '/register');
                        },
                        child: Text(
                          l10n.register,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: primaryColor,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}