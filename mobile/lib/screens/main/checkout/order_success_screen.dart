import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:village_market/l10n/app_localizations.dart';

class OrderSuccessScreen extends StatefulWidget {
  final String orderId;
  const OrderSuccessScreen({super.key, required this.orderId});

  @override
  State<OrderSuccessScreen> createState() => _OrderSuccessScreenState();
}

class _OrderSuccessScreenState extends State<OrderSuccessScreen>
    with TickerProviderStateMixin {
  late AnimationController _badgeController;
  late Animation<double> _scaleAnimation;

  late AnimationController _confettiController;
  final List<_Particle> _particles = [];

  @override
  void initState() {
    super.initState();

    // 1. Badge Scale Pulse Animation
    _badgeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);

    _scaleAnimation = Tween<double>(begin: 1.0, end: 1.08).animate(
      CurvedAnimation(parent: _badgeController, curve: Curves.easeInOut),
    );

    // 2. Confetti Particle Animation
    _confettiController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 4),
    )..repeat();

    final rand = Random();
    final colors = [
      const Color(0xFF22C55E),
      const Color(0xFF3B82F6),
      const Color(0xFFF59E0B),
      const Color(0xFFEC4899),
      const Color(0xFF8B5CF6),
    ];

    for (int i = 0; i < 45; i++) {
      _particles.add(
        _Particle(
          x: rand.nextDouble(),
          y: rand.nextDouble() * 0.6,
          size: rand.nextDouble() * 8 + 4,
          color: colors[rand.nextInt(colors.length)],
          speedY: rand.nextDouble() * 0.3 + 0.2,
          speedX: (rand.nextDouble() - 0.5) * 0.15,
          rotation: rand.nextDouble() * pi * 2,
        ),
      );
    }
  }

  @override
  void dispose() {
    _badgeController.dispose();
    _confettiController.dispose();
    super.dispose();
  }

  void _copyOrderId(BuildContext context) {
    Clipboard.setData(ClipboardData(text: widget.orderId));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Order ID copied to clipboard!'),
        duration: Duration(seconds: 2),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final shortId = widget.orderId.length > 8
        ? widget.orderId.substring(0, 8).toUpperCase()
        : widget.orderId.toUpperCase();

    return Scaffold(
      body: Stack(
        children: [
          // Background Celebration Confetti Painter
          AnimatedBuilder(
            animation: _confettiController,
            builder: (context, child) {
              return CustomPaint(
                size: Size.infinite,
                painter: _ConfettiPainter(
                  particles: _particles,
                  progress: _confettiController.value,
                ),
              );
            },
          ),

          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Glowing Animated Checkmark Badge
                    ScaleTransition(
                      scale: _scaleAnimation,
                      child: Container(
                        width: 100,
                        height: 100,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: const LinearGradient(
                            colors: [Color(0xFF22C55E), Color(0xFF16A34A)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF22C55E).withOpacity(0.4),
                              blurRadius: 28,
                              spreadRadius: 4,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.check_circle_rounded,
                          size: 64,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    const SizedBox(height: 28),

                    // Success Title
                    Text(
                      l10n.orderPlacedTitle,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w800,
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 10),

                    // Subtitle / Description
                    Text(
                      'Thank you for your order! The shop vendor has been notified and is preparing your delivery.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 14,
                        color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                        height: 1.45,
                      ),
                    ),
                    const SizedBox(height: 28),

                    // Order Details Card
                    Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
                        ),
                      ),
                      child: Column(
                        children: [
                          // Order ID Row
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Order ID',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                  color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                                ),
                              ),
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF22C55E).withOpacity(0.12),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      '#$shortId',
                                      style: const TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w700,
                                        color: Color(0xFF16A34A),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 4),
                                  IconButton(
                                    icon: const Icon(Icons.copy_rounded, size: 18),
                                    color: const Color(0xFF94A3B8),
                                    onPressed: () => _copyOrderId(context),
                                    tooltip: 'Copy Order ID',
                                    constraints: const BoxConstraints(),
                                    padding: const EdgeInsets.all(6),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 12),
                            child: Divider(height: 1, thickness: 1),
                          ),

                          // Estimated Delivery Time Row
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  const Icon(Icons.timer_outlined, size: 18, color: Color(0xFF3B82F6)),
                                  const SizedBox(width: 6),
                                  Text(
                                    'Est. Delivery:',
                                    style: TextStyle(
                                      fontSize: 13,
                                      color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                                    ),
                                  ),
                                ],
                              ),
                              const Text(
                                'Within 30–45 mins',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFF3B82F6),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 36),

                    // BUTTON 1: View Order Details
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF22C55E),
                          foregroundColor: Colors.white,
                          elevation: 2,
                          shadowColor: const Color(0xFF22C55E).withOpacity(0.4),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                        onPressed: () => context.go('/orders/${widget.orderId}'),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              l10n.viewMyOrdersButton,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(width: 8),
                            const Icon(Icons.arrow_forward_rounded, size: 20),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),

                    // BUTTON 2: Shop Again
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: isDark ? Colors.white : const Color(0xFF334155),
                          side: BorderSide(
                            color: isDark ? const Color(0xFF475569) : const Color(0xFFCBD5E1),
                            width: 1.5,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                        onPressed: () => context.go('/home'),
                        icon: const Icon(Icons.shopping_bag_outlined, size: 20),
                        label: Text(
                          l10n.continueShoppingButton,
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Particle {
  double x;
  double y;
  double size;
  Color color;
  double speedY;
  double speedX;
  double rotation;

  _Particle({
    required this.x,
    required this.y,
    required this.size,
    required this.color,
    required this.speedY,
    required this.speedX,
    required this.rotation,
  });
}

class _ConfettiPainter extends CustomPainter {
  final List<_Particle> particles;
  final double progress;

  _ConfettiPainter({required this.particles, required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    for (var p in particles) {
      final currentY = ((p.y + progress * p.speedY) % 1.0) * size.height;
      final currentX = ((p.x + sin(progress * pi * 2 + p.rotation) * p.speedX) % 1.0) * size.width;

      final paint = Paint()
        ..color = p.color.withOpacity(0.75)
        ..style = PaintingStyle.fill;

      canvas.save();
      canvas.translate(currentX, currentY);
      canvas.rotate(progress * pi * 4 + p.rotation);
      canvas.drawRect(
        Rect.fromCenter(center: Offset.zero, width: p.size, height: p.size * 0.6),
        paint,
      );
      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(covariant _ConfettiPainter oldDelegate) => true;
}
