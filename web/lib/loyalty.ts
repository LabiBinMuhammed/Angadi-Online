import { createClient as createAdminClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey)

export type LoyaltyData = {
  starsCount: number
  scratchCardsUnlocked: number
  totalCreditEarned: number
}

/**
 * Get or initialize user loyalty reward progress.
 */
export async function getUserLoyalty(userId: string): Promise<LoyaltyData> {
  try {
    const { data: reward } = await supabaseAdmin
      .from('user_rewards')
      .select('stars_count, scratch_cards_unlocked, total_credit_earned')
      .eq('user_id', userId)
      .maybeSingle()

    if (reward) {
      return {
        starsCount: reward.stars_count || 0,
        scratchCardsUnlocked: reward.scratch_cards_unlocked || 0,
        totalCreditEarned: Number(reward.total_credit_earned || 0),
      }
    }

    // Fallback: Check user_profiles or user_metadata
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('date_of_birth')
      .eq('user_id', userId)
      .maybeSingle()

    // Initialize user_rewards record
    await supabaseAdmin.from('user_rewards').insert({
      user_id: userId,
      stars_count: 0,
      scratch_cards_unlocked: 0,
      total_credit_earned: 0,
    })

    return { starsCount: 0, scratchCardsUnlocked: 0, totalCreditEarned: 0 }
  } catch (err) {
    console.error('Error fetching user loyalty:', err)
    return { starsCount: 0, scratchCardsUnlocked: 0, totalCreditEarned: 0 }
  }
}

/**
 * Award 1 Star if order is delivered and order amount >= ₹150.
 * Automatically unlocks 1 Scratch Card when 5 Stars are accumulated.
 */
export async function awardOrderStarIfEligible(orderId: string): Promise<{
  awarded: boolean
  newStarsCount: number
  unlockedScratchCard: boolean
  orderAmount: number
}> {
  try {
    // 1. Fetch order details
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('id, user_id, status, total_final_price, total_estimated_price')
      .eq('id', orderId)
      .maybeSingle()

    if (!order || !order.user_id) {
      return { awarded: false, newStarsCount: 0, unlockedScratchCard: false, orderAmount: 0 }
    }

    const orderAmount = Number(order.total_final_price ?? order.total_estimated_price ?? 0)

    // Check minimum threshold ₹150
    if (orderAmount < 150) {
      const currentLoyalty = await getUserLoyalty(order.user_id)
      return {
        awarded: false,
        newStarsCount: currentLoyalty.starsCount,
        unlockedScratchCard: currentLoyalty.scratchCardsUnlocked > 0,
        orderAmount,
      }
    }

    // 2. Check if star already logged for this order
    const { data: existingLog } = await supabaseAdmin
      .from('loyalty_star_logs')
      .select('id')
      .eq('order_id', orderId)
      .maybeSingle()

    if (existingLog) {
      const currentLoyalty = await getUserLoyalty(order.user_id)
      return {
        awarded: false,
        newStarsCount: currentLoyalty.starsCount,
        unlockedScratchCard: currentLoyalty.scratchCardsUnlocked > 0,
        orderAmount,
      }
    }

    // 3. Log the star award
    await supabaseAdmin.from('loyalty_star_logs').insert({
      user_id: order.user_id,
      order_id: orderId,
      order_amount: orderAmount,
      stars_awarded: 1,
    })

    // 4. Update user rewards
    const current = await getUserLoyalty(order.user_id)
    let newStars = current.starsCount + 1
    let unlockedCards = current.scratchCardsUnlocked

    if (newStars >= 5) {
      unlockedCards += 1
      // Keep stars counter at 5 until scratch card is claimed, or let it accumulate
    }

    await supabaseAdmin.from('user_rewards').upsert({
      user_id: order.user_id,
      stars_count: newStars,
      scratch_cards_unlocked: unlockedCards,
      total_credit_earned: current.totalCreditEarned,
      updated_at: new Date().toISOString(),
    })

    return {
      awarded: true,
      newStarsCount: newStars,
      unlockedScratchCard: unlockedCards > 0 || newStars >= 5,
      orderAmount,
    }
  } catch (err) {
    console.error('Error awarding order star:', err)
    return { awarded: false, newStarsCount: 0, unlockedScratchCard: false, orderAmount: 0 }
  }
}

/**
 * Claim Lucky Scratch Card Reward (Guaranteed ₹5 – ₹50 Angadi Credit).
 * Resets 5-star counter back to 0 after reward is claimed!
 */
export async function claimScratchCardReward(userId: string): Promise<{
  success: boolean
  rewardAmount: number
  remainingStars: number
  totalCreditEarned: number
  message?: string
}> {
  try {
    const current = await getUserLoyalty(userId)

    if (current.starsCount < 5 && current.scratchCardsUnlocked <= 0) {
      return {
        success: false,
        rewardAmount: 0,
        remainingStars: current.starsCount,
        totalCreditEarned: current.totalCreditEarned,
        message: 'You need 5 stars to unlock a Lucky Scratch Card!',
      }
    }

    // Generate random guaranteed reward between ₹5 and ₹50
    // Options: ₹5, ₹10, ₹15, ₹20, ₹25, ₹30, ₹40, ₹50
    const rewards = [5, 10, 15, 20, 25, 30, 40, 50]
    const rewardAmount = rewards[Math.floor(Math.random() * rewards.length)]

    // Reset star count by 5 and update rewards
    const remainingStars = Math.max(0, current.starsCount - 5)
    const remainingScratchCards = Math.max(0, (current.scratchCardsUnlocked || 1) - 1)
    const newTotalCredit = current.totalCreditEarned + rewardAmount

    await supabaseAdmin.from('user_rewards').upsert({
      user_id: userId,
      stars_count: remainingStars,
      scratch_cards_unlocked: remainingScratchCards,
      total_credit_earned: newTotalCredit,
      updated_at: new Date().toISOString(),
    })

    // Log claimed card
    await supabaseAdmin.from('claimed_scratch_cards').insert({
      user_id: userId,
      reward_amount: rewardAmount,
    })

    // Add reward credit to shop_user_credit wallet or user credit
    const { data: shops } = await supabaseAdmin.from('shops').select('id').limit(1)
    if (shops && shops.length > 0) {
      const defaultShopId = shops[0].id
      const { data: existingCredit } = await supabaseAdmin
        .from('shop_user_credit')
        .select('id, credit_limit, credit_balance')
        .eq('user_id', userId)
        .eq('shop_id', defaultShopId)
        .maybeSingle()

      if (existingCredit) {
        await supabaseAdmin
          .from('shop_user_credit')
          .update({
            credit_limit: (Number(existingCredit.credit_limit || 0) + rewardAmount),
            credit_balance: (Number(existingCredit.credit_balance || 0) + rewardAmount),
          })
          .eq('id', existingCredit.id)
      } else {
        await supabaseAdmin.from('shop_user_credit').insert({
          shop_id: defaultShopId,
          user_id: userId,
          is_active: true,
          credit_limit: rewardAmount,
          credit_balance: rewardAmount,
        })
      }
    }

    return {
      success: true,
      rewardAmount,
      remainingStars,
      totalCreditEarned: newTotalCredit,
    }
  } catch (err: any) {
    console.error('Error claiming scratch card reward:', err)
    return {
      success: false,
      rewardAmount: 0,
      remainingStars: 0,
      totalCreditEarned: 0,
      message: err.message || 'Failed to claim reward',
    }
  }
}
