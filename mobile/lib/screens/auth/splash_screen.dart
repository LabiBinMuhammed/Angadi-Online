import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/supabase_client.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnim;
  late Animation<double> _scaleAnim;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200));
    _fadeAnim  = CurvedAnimation(parent: _controller, curve: Curves.easeIn);
    _scaleAnim = Tween<double>(begin: .7, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.elasticOut),
    );
    _controller.forward();
    _checkSession();
  }

  Future<void> _checkSession() async {
    await Future.delayed(const Duration(milliseconds: 1800));
    if (!mounted) return;
    final session = Supabase.instance.client.auth.currentSession;
    if (session != null) {
      // Check for token expiry
      if (session.expiresAt != null &&
          DateTime.fromMillisecondsSinceEpoch(session.expiresAt! * 1000).isBefore(DateTime.now())) {
        await supabase.auth.signOut();
        if (mounted) context.go('/login');
      } else {
        context.go('/home');
      }
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
      backgroundColor: const Color(0xFF075E54), // WhatsApp teal
      body: Center(
        child: FadeTransition(
          opacity: _fadeAnim,
          child: ScaleTransition(
            scale: _scaleAnim,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 100, height: 100,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(28),
                    boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 24, offset: Offset(0, 8))],
                  ),
                  child: const Center(child: Text('🛒', style: TextStyle(fontSize: 52))),
                ),
                const SizedBox(height: 24),
                const Text(
                  'Angadi',
                  style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: Colors.white, letterSpacing: .5),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Your local marketplace',
                  style: TextStyle(fontSize: 14, color: Colors.white70),
                ),
                const SizedBox(height: 48),
                const SizedBox(
                  width: 28, height: 28,
                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
