import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/supabase_client.dart';
import 'tutorial_controller.dart';
import 'tutorial_step.dart';
import 'tutorial_keys.dart';

class TutorialManager {
  static final TutorialManager instance = TutorialManager._internal();
  TutorialManager._internal();

  final TutorialController controller = TutorialController();
  final Set<String> _inMemoryCompleted = {};
  
  // Tutorial versioning
  static const int currentVersion = 1;

  Future<bool> hasSeenTutorial(String tutorialId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final key = 'tutorial_${tutorialId}_v$currentVersion';
      return prefs.getBool(key) ?? false;
    } catch (_) {
      return _inMemoryCompleted.contains(tutorialId);
    }
  }

  Future<void> markTutorialAsSeen(String tutorialId) async {
    _inMemoryCompleted.add(tutorialId);
    try {
      final prefs = await SharedPreferences.getInstance();
      final key = 'tutorial_${tutorialId}_v$currentVersion';
      await prefs.setBool(key, true);
    } catch (_) {}
  }

  // Order tutorial eligibility (becomes eligible upon first successful checkout completion)
  Future<bool> isOrdersTutorialEligible() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getBool('tutorial_orders_tutorial_eligible') ?? false;
    } catch (_) {
      return false;
    }
  }

  Future<void> setOrdersTutorialEligible(bool eligible) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('tutorial_orders_tutorial_eligible', eligible);
    } catch (_) {}
  }

  Future<void> clearAllTutorials() async {
    _inMemoryCompleted.clear();
    try {
      final prefs = await SharedPreferences.getInstance();
      final keys = prefs.getKeys();
      for (final key in keys) {
        if (key.startsWith('tutorial_')) {
          await prefs.remove(key);
        }
      }
    } catch (_) {}
  }

  Future<bool> _isExperiencedUser() async {
    try {
      final user = supabase.auth.currentUser;
      if (user != null) {
        final ordersRes = await supabase
            .from('orders')
            .select('id')
            .eq('user_id', user.id)
            .not('payment_type', 'is', null)
            .limit(1);
        final list = ordersRes as List;
        return list.isNotEmpty;
      }
    } catch (_) {}
    return false;
  }

  void start(BuildContext context, String tutorialId, List<TutorialStep> steps) async {
    // 1. Check local seen status
    if (await hasSeenTutorial(tutorialId)) {
      return;
    }

    // 2. Increment and check screen visit count (for initial screen visits)
    try {
      final prefs = await SharedPreferences.getInstance();
      final key = 'tutorial_${tutorialId}_visit_count';
      final visitCount = prefs.getInt(key) ?? 0;
      await prefs.setInt(key, visitCount + 1);
      if (visitCount >= 1) {
        await markTutorialAsSeen(tutorialId);
        return;
      }
    } catch (_) {}

    // 3. If logged in, check if they have any prior completed orders (experienced user)
    if (await _isExperiencedUser()) {
      await markTutorialAsSeen(tutorialId);
      return;
    }

    if (!context.mounted) return;
    
    controller.startTutorial(context, steps);
    await markTutorialAsSeen(tutorialId);
  }

  /// Triggered on FIRST SUCCESSFUL add-to-bag action
  void triggerBagTutorial(BuildContext context) async {
    const tutorialId = 'bag_tutorial';
    if (await hasSeenTutorial(tutorialId)) return;

    if (await _isExperiencedUser()) {
      await markTutorialAsSeen(tutorialId);
      return;
    }

    if (!context.mounted) return;

    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (!context.mounted) return;
      if (TutorialKeys.bagNavKey.currentContext == null) return;

      controller.startTutorial(
        context,
        [
          TutorialStep(
            targetKey: TutorialKeys.bagNavKey,
            title: (l10n) => l10n.bagTutorialTitle,
            description: (l10n) => l10n.bagTutorialDesc,
            arrowPosition: TutorialArrowPosition.bottom,
            shape: TutorialShape.circle,
          ),
        ],
      );
      await markTutorialAsSeen(tutorialId);
    });
  }

  /// Triggered when user enters Orders screen after first successful order
  void triggerOrdersTutorial(BuildContext context) async {
    const tutorialId = 'orders_tutorial';
    if (await hasSeenTutorial(tutorialId)) return;

    // Must be eligible from first completed order
    final eligible = await isOrdersTutorialEligible();
    if (!eligible) return;

    if (!context.mounted) return;

    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (!context.mounted) return;
      if (TutorialKeys.ordersNavKey.currentContext == null) return;

      controller.startTutorial(
        context,
        [
          TutorialStep(
            targetKey: TutorialKeys.ordersNavKey,
            title: (l10n) => l10n.ordersTutorialTitle,
            description: (l10n) => l10n.ordersTutorialDesc,
            arrowPosition: TutorialArrowPosition.bottom,
            shape: TutorialShape.circle,
          ),
        ],
      );
      await markTutorialAsSeen(tutorialId);
      await setOrdersTutorialEligible(false);
    });
  }

  /// Triggered on first meaningful visit to Profile screen
  void triggerProfileTutorial(BuildContext context) async {
    const tutorialId = 'profile_tutorial';
    if (await hasSeenTutorial(tutorialId)) return;

    if (await _isExperiencedUser()) {
      await markTutorialAsSeen(tutorialId);
      return;
    }

    if (!context.mounted) return;

    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (!context.mounted) return;
      if (TutorialKeys.profileNavKey.currentContext == null) return;

      controller.startTutorial(
        context,
        [
          TutorialStep(
            targetKey: TutorialKeys.profileNavKey,
            title: (l10n) => l10n.profileTutorialTitle,
            description: (l10n) => l10n.profileTutorialDesc,
            arrowPosition: TutorialArrowPosition.bottom,
            shape: TutorialShape.circle,
          ),
        ],
      );
      await markTutorialAsSeen(tutorialId);
    });
  }
}
