export type LoyaltyData = {
  starsCount: number
  scratchCardsUnlocked: number
  totalCreditEarned: number
}

export async function getUserLoyalty(userId: string): Promise<LoyaltyData> {
  return { starsCount: 0, scratchCardsUnlocked: 0, totalCreditEarned: 0 }
}

export async function awardOrderStarIfEligible(orderId: string) {
  return { awarded: false, newStarsCount: 0, unlockedScratchCard: false, orderAmount: 0 }
}

export async function claimScratchCardReward(userId: string) {
  return { success: false, rewardAmount: 0, remainingStars: 0, totalCreditEarned: 0 }
}
