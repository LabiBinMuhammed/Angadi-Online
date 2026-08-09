import 'package:flutter/material.dart';
import 'tutorial_step.dart';

class TutorialOverlayPainter extends CustomPainter {
  final Rect targetRect;
  final TutorialShape shape;
  final double animationValue; // For subtle pulsating border
  final Color shadowColor;

  TutorialOverlayPainter({
    required this.targetRect,
    required this.shape,
    required this.animationValue,
    this.shadowColor = const Color(0x99000000),
  });

  @override
  void paint(Canvas canvas, Size size) {
    // Save layer to support BlendMode.dstOut
    canvas.saveLayer(Rect.fromLTWH(0, 0, size.width, size.height), Paint());

    // 1. Draw full dark backdrop
    final backdropPaint = Paint()..color = shadowColor;
    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), backdropPaint);

    // 2. Draw cutout using dstOut BlendMode
    final cutoutPaint = Paint()
      ..blendMode = BlendMode.dstOut
      ..color = Colors.white;

    final RRect rrect = RRect.fromRectAndRadius(
      targetRect.inflate(6.0),
      const Radius.circular(8.0),
    );

    if (shape == TutorialShape.circle) {
      final radius = (targetRect.width > targetRect.height ? targetRect.width : targetRect.height) / 2 + 6.0;
      canvas.drawCircle(targetRect.center, radius, cutoutPaint);
    } else {
      canvas.drawRRect(rrect, cutoutPaint);
    }

    canvas.restore();

    // 3. Draw pulsating highlight border (subtle scale animation)
    final highlightPaint = Paint()
      ..color = Colors.blue.withValues(alpha: 0.8 - (0.4 * animationValue))
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0 + (2.0 * animationValue);

    final double pulseOffset = 4.0 + (4.0 * animationValue);
    if (shape == TutorialShape.circle) {
      final radius = (targetRect.width > targetRect.height ? targetRect.width : targetRect.height) / 2 + pulseOffset;
      canvas.drawCircle(targetRect.center, radius, highlightPaint);
    } else {
      final pulseRRect = RRect.fromRectAndRadius(
        targetRect.inflate(pulseOffset),
        Radius.circular(8.0 + pulseOffset),
      );
      canvas.drawRRect(pulseRRect, highlightPaint);
    }
  }

  @override
  bool shouldRepaint(covariant TutorialOverlayPainter oldDelegate) {
    return oldDelegate.targetRect != targetRect ||
        oldDelegate.shape != shape ||
        oldDelegate.animationValue != animationValue ||
        oldDelegate.shadowColor != shadowColor;
  }
}
