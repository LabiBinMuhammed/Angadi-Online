import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/supabase_client.dart';
import 'tutorial_controller.dart';
import 'tutorial_step.dart';

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

  void start(BuildContext context, String tutorialId, List<TutorialStep> steps) async {
    // 1. Check local seen status
    if (await hasSeenTutorial(tutorialId)) {
      return;
    }

    // 2. Increment and check screen visit count (skip if visited multiple times)
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

    // 3. If logged in, check if they have any orders in the DB (existing user on a new device)
    try {
      final user = supabase.auth.currentUser;
      if (user != null) {
        final ordersRes = await supabase
            .from('orders')
            .select('id')
            .eq('user_id', user.id)
            .limit(1);
        final list = ordersRes as List;
        if (list.isNotEmpty) {
          await markTutorialAsSeen(tutorialId);
          return;
        }
      }
    } catch (_) {}

    if (!context.mounted) return;
    
    controller.startTutorial(context, steps);
    await markTutorialAsSeen(tutorialId);
  }
}
