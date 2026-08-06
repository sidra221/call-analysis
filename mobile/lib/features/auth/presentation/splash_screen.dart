import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../application/auth_controller.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _logoAnimation;
  late Animation<double> _textAnimation;

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    );

    _logoAnimation = CurvedAnimation(
  parent: _controller,
  curve: const Interval(
    0.0,
    0.55,
    curve: Curves.easeOutBack,
  ),
);

_textAnimation = CurvedAnimation(
  parent: _controller,
  curve: const Interval(
    0.45,
    0.85,
    curve: Curves.easeOut,
  ),
);
    _controller.reset();
    _controller.forward();

    _startApp();
  }

  Future<void> _startApp() async {
    await Future.delayed(const Duration(milliseconds: 2800));

    await ref.read(authControllerProvider.notifier).loadSession();

    final authed = ref.read(authControllerProvider).authenticated;

    if (!mounted) return;

    if (authed) {
      context.go('/home');
    } else {
      context.go('/login');
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
Widget build(BuildContext context) {
  return Scaffold(
    body: Container(
      width: double.infinity,
      height: double.infinity,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFFF8FAFC),
            Color(0xFFEFF6FF),
          ],
        ),
      ),
      child: Center(
        child: AnimatedBuilder(
          animation: _controller,
          builder: (context, child) {
            return Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Logo animation
                Opacity(
                  opacity: _logoAnimation.value,
                  child: Transform.scale(
                    scale: 0.65 + (_logoAnimation.value * 0.35),
                    child: Image.asset(
                      'assets/images/vocalys_logo.png',
                      width: 230,
                      fit: BoxFit.contain,
                    ),
                  ),
                ),

                const SizedBox(height: 24),

                // Text appears after logo
                Opacity(
                  opacity: _textAnimation.value,
                  child: Transform.translate(
                    offset: Offset(
                      0,
                      20 * (1 - _textAnimation.value),
                    ),
                    child: Text(
                      'VOICE INTELLIGENCE. REAL INSIGHT.',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 2.2,
                        color: const Color(0xFF1976D2),
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 36),

                Opacity(
                  opacity: _textAnimation.value,
                  child: const SizedBox(
                    width: 26,
                    height: 26,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.2,
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    ),
  );
}
}