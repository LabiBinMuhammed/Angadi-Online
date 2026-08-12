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
  late AnimationController _checkController;
  late Animation<double> _checkScale;

  late AnimationController _rippleController;
  late AnimationController _confettiBurstController;

  final List<_SingleBurstParticle> _particles = [];
  final Random _rand = Random();

  @override
  void initState() {
    super.initState();

    // 1. Elastic Checkmark Pop Animation
    _checkController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );

    _checkScale = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _checkController,
        curve: Curves.elasticOut,
      ),
    );

    // 2. Ripple Rings Pulsing Animation (runs for 3 seconds then stops to settle static)
    _rippleController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    );

    // 3. Single Celebration Burst Physics Controller (3.5s duration)
    _confettiBurstController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 3500),
    );

    _spawnCelebrationBurst();

    _checkController.forward();
    _rippleController.forward(from: 0.0);
    _confettiBurstController.forward(from: 0.0);
  }

  void _spawnCelebrationBurst() {
    _particles.clear();
    final colors = [
      const Color(0xFF22C55E), // Vivid Green
      const Color(0xFF3B82F6), // Bright Blue
      const Color(0xFFF59E0B), // Amber Gold
      const Color(0xFFEC4899), // Pink
      const Color(0xFF8B5CF6), // Purple
      const Color(0xFF10B981), // Emerald
    ];

    // Spawn 90 particles bursting upwards & outwards from checkmark center
    for (int i = 0; i < 90; i++) {
      final angle = _rand.nextDouble() * pi * 2;
      final speed = _rand.nextDouble() * 320 + 120;

      _particles.add(
        _SingleBurstParticle(
          startX: 0.5,
          startY: 0.3,
          vx: cos(angle) * speed,
          vy: sin(angle) * speed - 220, // Initial upward burst
          size: _rand.nextDouble() * 9 + 5,
          color: colors[_rand.nextInt(colors.length)],
          rotation: _rand.nextDouble() * pi * 2,
          rotationSpeed: (_rand.nextDouble() - 0.5) * 10,
          isCircle: _rand.nextBool(),
          drag: _rand.nextDouble() * 0.04 + 0.94,
          gravity: _rand.nextDouble() * 280 + 320,
        ),
      );
    }
  }

  @override
  void dispose() {
    _checkController.dispose();
    _rippleController.dispose();
    _confettiBurstController.dispose();
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
          // Single Celebration Confetti Burst Layer (Settles clean & static)
          AnimatedBuilder(
            animation: _confettiBurstController,
            builder: (context, child) {
              return CustomPaint(
                size: Size.infinite,
                painter: _SingleBurstConfettiPainter(
                  particles: _particles,
                  progress: _confettiBurstController.value,
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
                    // Animated Ripple & Elastic Checkmark Badge
                    Stack(
                      alignment: Alignment.center,
                      children: [
                        // Ripple Ring
                        AnimatedBuilder(
                          animation: _rippleController,
                          builder: (context, child) {
                            final value = _rippleController.value;
                            if (value >= 1.0) return const SizedBox.shrink();
                            return Container(
                              width: 100 + (value * 60),
                              height: 100 + (value * 60),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: const Color(0xFF22C55E).withOpacity((1 - value) * 0.4),
                                  width: 2.5,
                                ),
                              ),
                            );
                          },
                        ),

                        // Elastic Checkmark Badge (Tap to re-trigger celebration burst)
                        ScaleTransition(
                          scale: _checkScale,
                          child: GestureDetector(
                            onTap: () {
                              _spawnCelebrationBurst();
                              _rippleController.forward(from: 0.0);
                              _confettiBurstController.forward(from: 0.0);
                            },
                            child: Container(
                              width: 104,
                              height: 104,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                gradient: const LinearGradient(
                                  colors: [Color(0xFF22C55E), Color(0xFF16A34A)],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: const Color(0xFF22C55E).withOpacity(0.45),
                                    blurRadius: 30,
                                    spreadRadius: 4,
                                    offset: const Offset(0, 10),
                                  ),
                                ],
                              ),
                              child: const Icon(
                                Icons.check_circle_rounded,
                                size: 68,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 32),

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
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(22),
                        border: Border.all(
                          color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(isDark ? 0.2 : 0.04),
                            blurRadius: 16,
                            offset: const Offset(0, 6),
                          ),
                        ],
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
                                  fontSize: 14,
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
                                        fontSize: 14,
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
                          elevation: 3,
                          shadowColor: const Color(0xFF22C55E).withOpacity(0.45),
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

class _SingleBurstParticle {
  final double startX;
  final double startY;
  final double vx;
  final double vy;
  final double size;
  final Color color;
  final double rotation;
  final double rotationSpeed;
  final bool isCircle;
  final double drag;
  final double gravity;

  _SingleBurstParticle({
    required this.startX,
    required this.startY,
    required this.vx,
    required this.vy,
    required this.size,
    required this.color,
    required this.rotation,
    required this.rotationSpeed,
    required this.isCircle,
    required this.drag,
    required this.gravity,
  });
}

class _SingleBurstConfettiPainter extends CustomPainter {
  final List<_SingleBurstParticle> particles;
  final double progress;

  _SingleBurstConfettiPainter({required this.particles, required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    if (progress >= 1.0) return; // Clean static state after burst ends

    final dt = progress * 3.5; // Seconds elapsed

    for (var p in particles) {
      final currentVx = p.vx * pow(p.drag, dt * 60);
      final currentVy = (p.vy + p.gravity * dt) * pow(p.drag, dt * 60);

      final posX = (p.startX * size.width) + (currentVx * dt * 0.4);
      final posY = (p.startY * size.height) + (currentVy * dt * 0.4);

      // Fade out smoothly towards the end of 3.5s
      final opacity = (1.0 - (progress * 1.25)).clamp(0.0, 1.0);
      if (opacity <= 0 || posY > size.height + 60) continue;

      final paint = Paint()
        ..color = p.color.withOpacity(opacity)
        ..style = PaintingStyle.fill;

      canvas.save();
      canvas.translate(posX, posY);
      canvas.rotate(p.rotation + (p.rotationSpeed * dt));

      if (p.isCircle) {
        canvas.drawCircle(Offset.zero, p.size / 2, paint);
      } else {
        canvas.drawRect(
          Rect.fromCenter(center: Offset.zero, width: p.size, height: p.size * 0.65),
          paint,
        );
      }
      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(covariant _SingleBurstConfettiPainter oldDelegate) => true;
}
