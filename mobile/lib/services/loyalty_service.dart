import 'dart:math';
import 'package:supabase_flutter/supabase_flutter.dart';

class LoyaltyData {
  final int starsCount;
  final int scratchCardsUnlocked;
  final double totalCreditEarned;

  LoyaltyData({
    required this.starsCount,
    required this.scratchCardsUnlocked,
    required this.totalCreditEarned,
  });

  factory LoyaltyData.fromJson(Map<String, dynamic> json) {
    return LoyaltyData(
      starsCount: (json['stars_count'] as num?)?.toInt() ?? 0,
      scratchCardsUnlocked: (json['scratch_cards_unlocked'] as num?)?.toInt() ?? 0,
      totalCreditEarned: (json['total_credit_earned'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class LoyaltyService {
  static final SupabaseClient _supabase = Supabase.instance.client;

  /// Get current user loyalty status
  static Future<LoyaltyData> getUserLoyalty() async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) {
        return LoyaltyData(starsCount: 0, scratchCardsUnlocked: 0, totalCreditEarned: 0.0);
      }

      final res = await _supabase
          .from('user_rewards')
          .select('stars_count, scratch_cards_unlocked, total_credit_earned')
          .eq('user_id', user.id)
          .maybeSingle();

      if (res != null) {
        return LoyaltyData.fromJson(res);
      }

      // Initialize default row if missing
      await _supabase.from('user_rewards').insert({
        'user_id': user.id,
        'stars_count': 0,
        'scratch_cards_unlocked': 0,
        'total_credit_earned': 0.0,
      });

      return LoyaltyData(starsCount: 0, scratchCardsUnlocked: 0, totalCreditEarned: 0.0);
    } catch (e) {
      print('Error fetching loyalty data: $e');
      return LoyaltyData(starsCount: 0, scratchCardsUnlocked: 0, totalCreditEarned: 0.0);
    }
  }

  /// Award 1 Star if order is delivered and order amount >= ₹150
  static Future<Map<String, dynamic>> awardOrderStarIfEligible(String orderId) async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) return {'awarded': false, 'starsCount': 0};

      final orderRes = await _supabase
          .from('orders')
          .select('id, user_id, status, total_final_price, total_estimated_price')
          .eq('id', orderId)
          .maybeSingle();

      if (orderRes == null) return {'awarded': false, 'starsCount': 0};

      final amount = ((orderRes['total_final_price'] ?? orderRes['total_estimated_price'] ?? 0) as num).toDouble();
      if (amount < 150.0) {
        final current = await getUserLoyalty();
        return {'awarded': false, 'starsCount': current.starsCount, 'orderAmount': amount};
      }

      // Check if star already logged
      final existingLog = await _supabase
          .from('loyalty_star_logs')
          .select('id')
          .eq('order_id', orderId)
          .maybeSingle();

      if (existingLog != null) {
        final current = await getUserLoyalty();
        return {'awarded': false, 'starsCount': current.starsCount, 'orderAmount': amount};
      }

      // Log star award
      await _supabase.from('loyalty_star_logs').insert({
        'user_id': user.id,
        'order_id': orderId,
        'order_amount': amount,
        'stars_awarded': 1,
      });

      // Update user rewards
      final current = await getUserLoyalty();
      int newStars = current.starsCount + 1;
      int unlockedCards = current.scratchCardsUnlocked;
      if (newStars >= 5) {
        unlockedCards += 1;
      }

      await _supabase.from('user_rewards').upsert({
        'user_id': user.id,
        'stars_count': newStars,
        'scratch_cards_unlocked': unlockedCards,
        'total_credit_earned': current.totalCreditEarned,
        'updated_at': DateTime.now().toIso8601String(),
      });

      return {
        'awarded': true,
        'starsCount': newStars,
        'unlockedScratchCard': unlockedCards > 0 || newStars >= 5,
        'orderAmount': amount,
      };
    } catch (e) {
      print('Error awarding loyalty star: $e');
      return {'awarded': false, 'starsCount': 0};
    }
  }

  /// Claim Lucky Scratch Card Reward (Guaranteed ₹5 – ₹50 Angadi Credit)
  /// Resets star counter back to 0!
  static Future<Map<String, dynamic>> claimScratchCardReward() async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) {
        return {'success': false, 'message': 'Not logged in'};
      }

      final current = await getUserLoyalty();
      if (current.starsCount < 5 && current.scratchCardsUnlocked <= 0) {
        return {'success': false, 'message': '5 stars required'};
      }

      final rewards = [5, 10, 15, 20, 25, 30, 40, 50];
      final rand = Random();
      final rewardAmount = rewards[rand.nextInt(rewards.length)].toDouble();

      final remainingStars = max(0, current.starsCount - 5);
      final remainingCards = max(0, current.scratchCardsUnlocked - 1);
      final newTotalCredit = current.totalCreditEarned + rewardAmount;

      await _supabase.from('user_rewards').upsert({
        'user_id': user.id,
        'stars_count': remainingStars,
        'scratch_cards_unlocked': remainingCards,
        'total_credit_earned': newTotalCredit,
        'updated_at': DateTime.now().toIso8601String(),
      });

      // Log claimed scratch card
      await _supabase.from('claimed_scratch_cards').insert({
        'user_id': user.id,
        'reward_amount': rewardAmount,
      });

      // Add credit balance to shop_user_credit
      final shopsRes = await _supabase.from('shops').select('id').limit(1);
      if (shopsRes.isNotEmpty) {
        final defaultShopId = shopsRes[0]['id'];
        final creditRes = await _supabase
            .from('shop_user_credit')
            .select('id, credit_limit, credit_balance')
            .eq('user_id', user.id)
            .eq('shop_id', defaultShopId)
            .maybeSingle();

        if (creditRes != null) {
          final oldBal = ((creditRes['credit_balance'] ?? 0) as num).toDouble();
          final oldLim = ((creditRes['credit_limit'] ?? 0) as num).toDouble();
          await _supabase.from('shop_user_credit').update({
            'credit_balance': oldBal + rewardAmount,
            'credit_limit': oldLim + rewardAmount,
          }).eq('id', creditRes['id']);
        } else {
          await _supabase.from('shop_user_credit').insert({
            'shop_id': defaultShopId,
            'user_id': user.id,
            'is_active': true,
            'credit_limit': rewardAmount,
            'credit_balance': rewardAmount,
          });
        }
      }

      return {
        'success': true,
        'rewardAmount': rewardAmount,
        'remainingStars': remainingStars,
        'totalCreditEarned': newTotalCredit,
      };
    } catch (e) {
      print('Error claiming scratch card: $e');
      return {'success': false, 'message': e.toString()};
    }
  }
}
