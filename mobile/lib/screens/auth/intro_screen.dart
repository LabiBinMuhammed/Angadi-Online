import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../l10n/app_localizations.dart';
import '../../theme/theme_service.dart';

class IntroScreen extends StatelessWidget {
  const IntroScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = ThemeService.instance.isDarkMode;
    final l10n = AppLocalizations.of(context);
    final size = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F172A) : Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Column(
            children: [
              const Spacer(),

              // Custom Graphic / Illustration Area
              Container(
                height: size.height * 0.35,
                width: double.infinity,
                alignment: Alignment.center,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    // Background Glow Circle
                    Container(
                      width: 220,
                      height: 220,
                      decoration: const BoxDecoration(
                        color: Color(0xFFE8F5E9),
                        shape: BoxShape.circle,
                      ),
                    ),

                    // Phone Device Mockup Card
                    Positioned(
                      right: size.width * 0.1,
                      child: Container(
                        width: 130,
                        height: 200,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: const Color(0xFFE0E0E0), width: 3),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.08),
                              blurRadius: 20,
                              offset: const Offset(0, 10),
                            ),
                          ],
                        ),
                        child: Column(
                          children: [
                            const SizedBox(height: 10),
                            Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2))),
                            const SizedBox(height: 12),
                            Expanded(
                              child: GridView.count(
                                crossAxisCount: 2,
                                padding: const EdgeInsets.symmetric(horizontal: 10),
                                mainAxisSpacing: 8,
                                crossAxisSpacing: 8,
                                physics: const NeverScrollableScrollPhysics(),
                                children: List.generate(4, (index) {
                                  return Container(
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF4F4F4),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Icon(
                                      index == 0 ? Icons.local_grocery_store : index == 1 ? Icons.apple : index == 2 ? Icons.eco : Icons.shopping_basket,
                                      size: 20,
                                      color: const Color(0xFF2E5B28),
                                    ),
                                  );
                                }),
                              ),
                            ),
                            Container(
                              margin: const EdgeInsets.all(10),
                              height: 26,
                              decoration: BoxDecoration(
                                color: const Color(0xFF2E5B28),
                                borderRadius: BorderRadius.circular(13),
                              ),
                              alignment: Alignment.center,
                              child: const Text('PAY', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                            ),
                          ],
                        ),
                      ),
                    ),

                    // Delivery Guy Avatar & Grocery Bag
                    Positioned(
                      left: size.width * 0.08,
                      child: Container(
                        width: 140,
                        height: 210,
                        decoration: BoxDecoration(
                          color: const Color(0xFF2E5B28),
                          borderRadius: BorderRadius.circular(24),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF2E5B28).withOpacity(0.3),
                              blurRadius: 16,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const CircleAvatar(
                              radius: 36,
                              backgroundColor: Color(0xFFFFCC80),
                              child: Icon(Icons.person, size: 48, color: Color(0xFF2E5B28)),
                            ),
                            const SizedBox(height: 12),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: const Color(0xFF1B4315),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.shopping_bag, size: 16, color: Colors.white),
                                  SizedBox(width: 4),
                                  Text('Fresh', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const Spacer(),

              // Title and Subtitle
              Text(
                l10n?.joinUsOrSignIn ?? 'Join Us Or Sign In',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  color: isDark ? Colors.white : const Color(0xFF1A1A1A),
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 12),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Text(
                  'Explore local shops, fresh groceries, and fast delivery at your fingertips.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 14,
                    color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF71717A),
                    height: 1.5,
                  ),
                ),
              ),

              const Spacer(),

              // Dual Pill Action Buttons
              Row(
                children: [
                  Expanded(
                    child: SizedBox(
                      height: 52,
                      child: ElevatedButton(
                        onPressed: () => context.push('/signup'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF2E5B28),
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: const StadiumBorder(),
                        ),
                        child: const Text(
                          'Sign Up',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: SizedBox(
                      height: 52,
                      child: ElevatedButton(
                        onPressed: () => context.push('/login'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: isDark ? const Color(0xFF334155) : const Color(0xFFF1F5F9),
                          foregroundColor: isDark ? Colors.white : const Color(0xFF1E293B),
                          elevation: 0,
                          shape: const StadiumBorder(),
                        ),
                        child: const Text(
                          'Sign In',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}
