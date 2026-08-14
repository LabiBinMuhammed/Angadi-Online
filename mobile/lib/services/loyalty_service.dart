class LoyaltyData {
  final int starsCount;
  final int scratchCardsUnlocked;
  final double totalCreditEarned;

  LoyaltyData({
    required this.starsCount,
    required this.scratchCardsUnlocked,
    required this.totalCreditEarned,
  });
}

class LoyaltyService {
  static Future<LoyaltyData> getUserLoyalty() async {
    return LoyaltyData(starsCount: 0, scratchCardsUnlocked: 0, totalCreditEarned: 0.0);
  }

  static Future<Map<String, dynamic>> awardOrderStarIfEligible(String orderId) async {
    return {'awarded': false, 'starsCount': 0};
  }

  static Future<Map<String, dynamic>> claimScratchCardReward() async {
    return {'success': false, 'rewardAmount': 0.0};
  }
}
