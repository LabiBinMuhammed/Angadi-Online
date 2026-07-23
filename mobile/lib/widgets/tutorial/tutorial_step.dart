import 'package:flutter/material.dart';
import '../../l10n/app_localizations.dart';

enum TutorialArrowPosition { top, bottom, left, right }
enum TutorialShape { circle, rect }

class TutorialStep {
  final GlobalKey targetKey;
  final String Function(AppLocalizations) title;
  final String Function(AppLocalizations) description;
  final TutorialArrowPosition arrowPosition;
  final TutorialShape shape;
  final VoidCallback? onStepActive;

  const TutorialStep({
    required this.targetKey,
    required this.title,
    required this.description,
    required this.arrowPosition,
    this.shape = TutorialShape.rect,
    this.onStepActive,
  });
}
