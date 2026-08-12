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
  late AnimationController _confettiLoopController;

  final List<_ConfettiPiece> _pieces = [];
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

    // 2. Ripple Rings Pulsing Animation
    _rippleController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2200),
    )..repeat();

    // 3. Continuous Cascading Confetti Animation Loop
    _confettiLoopController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 6),
    )..repeat();

    _generateConfettiPieces();

    _checkController.forward();
  }

  void _generateConfettiPieces() {
    _pieces.clear();
    final colors = [
      const Color(0xFF22C55E), // Vivid Green
      const Color(0xFF3B82F6), // Bright Blue
      const Color(0xFFF59E0B), // Amber Gold
      const Color(0xFFEC4899), // Pink
      const Color(0xFF8B5CF6), // Purple
      const Color(0xFF10B981), // Emerald
      const Color(0xFFEF4444), // Red
    ];

    for (int i = 0; i < 75; i++) {
      _pieces.add(
        _ConfettiPiece(
          x: _rand.nextDouble(),
          y: _rand.nextDouble() * 1.2 - 0.2, // Spread vertically
          fallSpeed: _rand.nextDouble() * 1.2 + 0.8,
          swayAmp: _rand.nextDouble() * 0.08 + 0.02,
          swayFreq: _rand.nextDouble() * 1.5 + 0.5,
          phase: _rand.nextDouble() * pi * 2,
          size: _rand.nextDouble() * 10 + 6,
          color: colors[_rand.nextInt(colors.length)],
          rotationSpeed: (_rand.nextDouble() - 0.5) * 8,
          isCircle: _rand.nextBool(),
        ),
      );
    }
  }

  @override
  void dispose() {
    _checkController.dispose();
    _rippleController.dispose();
    _confettiLoopController.dispose();
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
          // Background Continuous Confetti Animation Layer
          AnimatedBuilder(
            animation: _confettiLoopController,
            builder: (context, child) {
              return CustomPaint(
                size: Size.infinite,
                painter: _ContinuousConfettiPainter(
                  pieces: _pieces,
                  progress: _confettiLoopController.value,
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
                        // Ripple Ring 1
                        AnimatedBuilder(
                          animation: _rippleController,
                          builder: (context, child) {
                            final value = _rippleController.value;
                            return Container(
                              width: 100 + (value * 65),
                              height: 100 + (value * 65),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: const Color(0xFF22C55E).withOpacity((1 - value) * 0.45),
                                  width: 2.5,
                                ),
                              ),
                            );
                          },
                        ),

                        // Ripple Ring 2 (Offset Phase)
                        AnimatedBuilder(
                          animation: _rippleController,
                          builder: (context, child) {
                            final value = (_rippleController.value + 0.5) % 1.0;
                            return Container(
                              width: 100 + (value * 65),
                              height: 100 + (value * 65),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: const Color(0xFF22C55E).withOpacity((1 - value) * 0.3),
                                  width: 2.0,
                                ),
                              ),
                            );
                          },
                        ),

                        // Elastic Checkmark Badge
                        ScaleTransition(
                          scale: _checkScale,
                          child: GestureDetector(
                            onTap: () {
                              setState(() {
                                _generateConfettiPieces();
                              });
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

class _ConfettiPiece {
  final double x;
  final double y;
  final double fallSpeed;
  final double swayAmp;
  final double swayFreq;
  final double phase;
  final double size;
  final Color color;
  final double rotationSpeed;
  final bool isCircle;

  _ConfettiPiece({
    required this.x,
    required this.y,
    required this.fallSpeed,
    required this.swayAmp,
    required this.swayFreq,
    required this.phase,
    required this.size,
    required this.color,
    required this.rotationSpeed,
    required this.isCircle,
  });
}

class _ContinuousConfettiPainter extends CustomPainter {
  final List<_ConfettiPiece> pieces;
  final double progress;

  _ContinuousConfettiPainter({required this.pieces, required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    for (var p in pieces) {
      // Calculate normalized cascading position
      final rawY = p.y + (progress * p.fallSpeed);
      final normalizedY = (rawY % 1.4) - 0.2; // Loop vertically from -0.2 to 1.2
      final posY = normalizedY * size.height;

      // Swaying horizontal motion
      final sway = sin((progress * pi * 2 * p.swayFreq) + p.phase) * p.swayAmp;
      final posX = (p.x + sway) * size.width;

      final paint = Paint()
        ..color = p.color.withOpacity(0.85)
        ..style = PaintingStyle.fill;

      canvas.save();
      canvas.translate(posX, posY);
      canvas.rotate((progress * pi * 2 * p.rotationSpeed) + p.phase);

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
  bool shouldRepaint(covariant _ContinuousConfettiPainter oldDelegate) => true;
}
