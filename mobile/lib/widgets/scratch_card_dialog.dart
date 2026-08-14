import 'package:flutter/material.dart';
import 'package:village_market/l10n/app_localizations.dart';
import 'package:village_market/services/loyalty_service.dart';

class ScratchCardDialog extends StatefulWidget {
  final VoidCallback onClaimed;

  const ScratchCardDialog({super.key, required this.onClaimed});

  @override
  State<ScratchCardDialog> createState() => _ScratchCardDialogState();
}

class _ScratchCardDialogState extends State<ScratchCardDialog> {
  final List<Offset> _points = [];
  bool _isClaiming = false;
  double? _claimedAmount;
  bool _isScratched = false;

  void _claimReward() async {
    if (_isClaiming || _claimedAmount != null) return;
    setState(() {
      _isClaiming = true;
    });

    final res = await LoyaltyService.claimScratchCardReward();
    if (mounted) {
      if (res['success'] == true) {
        setState(() {
          _claimedAmount = (res['rewardAmount'] as num).toDouble();
          _isScratched = true;
          _isClaiming = false;
        });
        widget.onClaimed();
      } else {
        setState(() {
          _isClaiming = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(res['message'] ?? 'Failed to claim reward')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
      backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: const LinearGradient(
                  colors: [Color(0xFFF59E0B), Color(0xFFD97706)],
                ),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFF59E0B).withValues(alpha: 0.4),
                    blurRadius: 16,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: const Icon(Icons.card_giftcard_rounded, size: 36, color: Colors.white),
            ),
            const SizedBox(height: 16),

            Text(
              _claimedAmount != null
                  ? (l10n?.loyaltyRewardClaimedTitle ?? '🎉 Congratulations!')
                  : (l10n?.loyaltyScratchDialogTitle ?? '🎟️ Lucky Scratch Card'),
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w800,
                color: isDark ? Colors.white : const Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 8),

            Text(
              _claimedAmount != null
                  ? (l10n?.loyaltyRewardClaimedSubtitle(_claimedAmount!.toStringAsFixed(0)) ??
                      '₹${_claimedAmount!.toStringAsFixed(0)} Angadi Credit added to your wallet!')
                  : (l10n?.loyaltyScratchDialogSubtitle ??
                      'Rub the metallic surface to reveal your guaranteed reward!'),
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
              ),
            ),
            const SizedBox(height: 24),

            // Scratch Card Canvas Box
            GestureDetector(
              onPanUpdate: (details) {
                if (_claimedAmount != null) return;
                setState(() {
                  _points.add(details.localPosition);
                });
                if (_points.length > 25 && !_isScratched) {
                  _claimReward();
                }
              },
              child: Container(
                width: 260,
                height: 140,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  color: const Color(0xFF0F172A),
                  border: Border.all(color: const Color(0xFFF59E0B), width: 2.5),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFFF59E0B).withValues(alpha: 0.3),
                      blurRadius: 16,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    // Revealed Reward Layer
                    Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text(
                          'YOU WON! 🎁',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFFFBBF24),
                            letterSpacing: 1,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _claimedAmount != null
                              ? '₹${_claimedAmount!.toStringAsFixed(0)}'
                              : '₹??',
                          style: const TextStyle(
                            fontSize: 38,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF4ADE80),
                          ),
                        ),
                        const Text(
                          'Angadi Credit Added',
                          style: TextStyle(fontSize: 11, color: Colors.white70),
                        ),
                      ],
                    ),

                    // Scratch Foil Layer
                    if (!_isScratched)
                      CustomPaint(
                        size: const Size(260, 140),
                        painter: _ScratchFoilPainter(points: _points),
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Action Button
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: _claimedAmount != null
                      ? const Color(0xFF22C55E)
                      : const Color(0xFFF59E0B),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                onPressed: _claimedAmount != null
                    ? () => Navigator.of(context).pop()
                    : _claimReward,
                child: _isClaiming
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                      )
                    : Text(
                        _claimedAmount != null
                            ? (l10n?.loyaltyCloseBtn ?? 'Close')
                            : (l10n?.loyaltyClaimRewardBtn ?? 'Claim Reward 🎁'),
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ScratchFoilPainter extends CustomPainter {
  final List<Offset> points;

  _ScratchFoilPainter({required this.points});

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    final rtree = RRect.fromRectAndRadius(rect, const Radius.circular(18));

    canvas.saveLayer(rect, Paint());

    // Metallic silver foil background
    final foilPaint = Paint()
      ..shader = const LinearGradient(
        colors: [Color(0xFFCBD5E1), Color(0xFF94A3B8), Color(0xFFE2E8F0)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ).createShader(rect);

    canvas.drawRRect(rtree, foilPaint);

    // Text on foil
    const textSpan = TextSpan(
      text: '✨ Scratch Here ✨',
      style: TextStyle(
        color: Color(0xFF475569),
        fontSize: 14,
        fontWeight: FontWeight.bold,
      ),
    );
    final textPainter = TextPainter(
      text: textSpan,
      textDirection: TextDirection.ltr,
    );
    textPainter.layout();
    textPainter.paint(
      canvas,
      Offset((size.width - textPainter.width) / 2, (size.height - textPainter.height) / 2),
    );

    // Eraser paint
    final clearPaint = Paint()
      ..blendMode = BlendMode.clear
      ..strokeWidth = 36.0
      ..strokeCap = StrokeCap.round;

    for (var point in points) {
      canvas.drawCircle(point, 22, clearPaint);
    }

    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _ScratchFoilPainter oldDelegate) => true;
}
