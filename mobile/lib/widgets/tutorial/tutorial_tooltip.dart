import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../theme/theme_service.dart';
import '../../l10n/app_localizations.dart';
import 'tutorial_step.dart';

class TutorialTooltip extends StatelessWidget {
  final String title;
  final String description;
  final TutorialArrowPosition arrowPosition;
  final String progressText;
  final VoidCallback onNext;
  final VoidCallback onSkip;
  final bool isLast;

  const TutorialTooltip({
    super.key,
    required this.title,
    required this.description,
    required this.arrowPosition,
    required this.progressText,
    required this.onNext,
    required this.onSkip,
    required this.isLast,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = ThemeService.instance.isDarkMode;
    final l10n = AppLocalizations.of(context)!;
    final bgColor = isDark ? kNeutral800 : Colors.white;
    final textColor = isDark ? Colors.white : kNeutral900;
    final subTextColor = isDark ? kNeutral300 : kNeutral600;
    final arrowColor = bgColor;

    // Position of the arrow relative to the bubble
    Widget arrow = const SizedBox.shrink();
    const double arrowSize = 12.0;

    switch (arrowPosition) {
      case TutorialArrowPosition.top:
        arrow = Positioned(
          top: 0,
          left: 0,
          right: 0,
          child: Align(
            alignment: Alignment.topCenter,
            child: Transform.translate(
              offset: const Offset(0, -arrowSize / 2),
              child: Transform.rotate(
                angle: 0.785398, // 45 degrees
                child: Container(
                  width: arrowSize,
                  height: arrowSize,
                  color: arrowColor,
                ),
              ),
            ),
          ),
        );
        break;
      case TutorialArrowPosition.bottom:
        arrow = Positioned(
          bottom: 0,
          left: 0,
          right: 0,
          child: Align(
            alignment: Alignment.bottomCenter,
            child: Transform.translate(
              offset: const Offset(0, arrowSize / 2),
              child: Transform.rotate(
                angle: 0.785398,
                child: Container(
                  width: arrowSize,
                  height: arrowSize,
                  color: arrowColor,
                ),
              ),
            ),
          ),
        );
        break;
      case TutorialArrowPosition.left:
        arrow = Positioned(
          left: 0,
          top: 0,
          bottom: 0,
          child: Align(
            alignment: Alignment.centerLeft,
            child: Transform.translate(
              offset: const Offset(-arrowSize / 2, 0),
              child: Transform.rotate(
                angle: 0.785398,
                child: Container(
                  width: arrowSize,
                  height: arrowSize,
                  color: arrowColor,
                ),
              ),
            ),
          ),
        );
        break;
      case TutorialArrowPosition.right:
        arrow = Positioned(
          right: 0,
          top: 0,
          bottom: 0,
          child: Align(
            alignment: Alignment.centerRight,
            child: Transform.translate(
              offset: const Offset(arrowSize / 2, 0),
              child: Transform.rotate(
                angle: 0.785398,
                child: Container(
                  width: arrowSize,
                  height: arrowSize,
                  color: arrowColor,
                ),
              ),
            ),
          ),
        );
        break;
    }

    return Stack(
      clipBehavior: Clip.none,
      children: [
        // Arrow
        arrow,
        // Card Body
        Container(
          width: 280,
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(isDark ? 0.4 : 0.15),
                blurRadius: 16,
                offset: const Offset(0, 8),
              ),
            ],
            border: Border.all(
              color: isDark ? kNeutral700 : kNeutral200,
              width: 1.0,
            ),
          ),
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      title,
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: textColor,
                        fontFamily: 'Inter',
                      ),
                    ),
                  ),
                  GestureDetector(
                    onTap: onSkip,
                    behavior: HitTestBehavior.opaque,
                    child: Padding(
                      padding: const EdgeInsets.only(left: 8.0, top: 4.0, bottom: 4.0),
                      child: Text(
                        l10n.tutorialSkip,
                        style: TextStyle(
                          fontSize: 12,
                          color: kNeutral500,
                          fontWeight: FontWeight.w600,
                          fontFamily: 'Inter',
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              // Body text
              Text(
                description,
                style: TextStyle(
                  fontSize: 13,
                  color: subTextColor,
                  fontWeight: FontWeight.w500,
                  height: 1.4,
                  fontFamily: 'Inter',
                ),
              ),
              const SizedBox(height: 16),
              // Footer
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    progressText,
                    style: TextStyle(
                      fontSize: 11,
                      color: kNeutral500,
                      fontWeight: FontWeight.w700,
                      fontFamily: 'Inter',
                    ),
                  ),
                  ElevatedButton(
                    onPressed: onNext,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: kWaTeal,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      minimumSize: const Size(0, 32),
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(100),
                      ),
                    ),
                    child: Text(
                      isLast ? l10n.tutorialFinish : l10n.tutorialNext,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        fontFamily: 'Inter',
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}
