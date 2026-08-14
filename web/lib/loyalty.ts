import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createAdminClient(supabaseUrl, supabaseServiceKey)
}

export type LoyaltyData = {
  starsCount: number
  scratchCardsUnlocked: number
  totalCreditEarned: number
}

/**
 * Helper to fetch loyalty state from auth user_metadata (fail-safe fallback)
 */
async function getAuthMetadataLoyalty(userId: string): Promise<{
  stars_count: number
  scratch_cards_unlocked: number
  total_credit_earned: number
  processed_orders: string[]
} | null> {
  try {
    const supabaseAdmin = getAdminClient()
    const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (user && user.user_metadata?.loyalty) {
      return {
        stars_count: Number(user.user_metadata.loyalty.stars_count || 0),
        scratch_cards_unlocked: Number(user.user_metadata.loyalty.scratch_cards_unlocked || 0),
        total_credit_earned: Number(user.user_metadata.loyalty.total_credit_earned || 0),
        processed_orders: Array.isArray(user.user_metadata.loyalty.processed_orders)
          ? user.user_metadata.loyalty.processed_orders
          : []
      }
    }
  } catch (e) {
    console.error('Error reading auth user_metadata loyalty:', e)
  }
  return null
}

/**
 * Helper to save loyalty state to auth user_metadata (fail-safe persistence)
 */
async function saveAuthMetadataLoyalty(userId: string, loyaltyData: {
  stars_count: number
  scratch_cards_unlocked: number
  total_credit_earned: number
  processed_orders: string[]
}) {
  try {
    const supabaseAdmin = getAdminClient()
    const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (user) {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...user.user_metadata,
          loyalty: loyaltyData
        }
      })
    }
  } catch (e) {
    console.error('Error saving auth user_metadata loyalty:', e)
  }
}

/**
 * Get or initialize user loyalty reward progress.
 */
export async function getUserLoyalty(userId: string): Promise<LoyaltyData> {
  try {
    const supabaseAdmin = getAdminClient()
    // 1. Try reading from auth user_metadata first (always available)
    const meta = await getAuthMetadataLoyalty(userId)

    // 2. Try reading from user_rewards table if available
    let tableReward = null
    try {
      const { data } = await supabaseAdmin
        .from('user_rewards')
        .select('stars_count, scratch_cards_unlocked, total_credit_earned')
        .eq('user_id', userId)
        .maybeSingle()
      tableReward = data
    } catch (e) {}

    const starsCount = tableReward?.stars_count ?? meta?.stars_count ?? 0
    const scratchCardsUnlocked = tableReward?.scratch_cards_unlocked ?? meta?.scratch_cards_unlocked ?? 0
    const totalCreditEarned = Number(tableReward?.total_credit_earned ?? meta?.total_credit_earned ?? 0)

    return {
      starsCount,
      scratchCardsUnlocked,
      totalCreditEarned
    }
  } catch (err) {
    console.error('Error fetching user loyalty:', err)
    return { starsCount: 0, scratchCardsUnlocked: 0, totalCreditEarned: 0 }
  }
}

/**
 * Award 1 Star if order is delivered.
 * Automatically unlocks 1 Scratch Card when 5 Stars are accumulated.
 */
export async function awardOrderStarIfEligible(orderId: string): Promise<{
  awarded: boolean
  newStarsCount: number
  unlockedScratchCard: boolean
  orderAmount: number
}> {
  try {
    const supabaseAdmin = getAdminClient()

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

    // 2. Fetch user metadata loyalty state
    const meta = (await getAuthMetadataLoyalty(order.user_id)) || {
      stars_count: 0,
      scratch_cards_unlocked: 0,
      total_credit_earned: 0,
      processed_orders: []
    }

    // 3. Check if star already logged for this order (in metadata or DB table)
    let isLogged = meta.processed_orders.includes(orderId)

    if (!isLogged) {
      try {
        const { data: existingLog } = await supabaseAdmin
          .from('loyalty_star_logs')
          .select('id')
          .eq('order_id', orderId)
          .maybeSingle()
        if (existingLog) isLogged = true
      } catch (e) {}
    }

    if (isLogged) {
      const currentLoyalty = await getUserLoyalty(order.user_id)
      return {
        awarded: false,
        newStarsCount: currentLoyalty.starsCount,
        unlockedScratchCard: currentLoyalty.scratchCardsUnlocked > 0 || currentLoyalty.starsCount >= 5,
        orderAmount,
      }
    }

    // 4. Calculate updated stars and scratch cards
    const currentStars = meta.stars_count || 0
    const newStars = currentStars + 1
    let unlockedCards = meta.scratch_cards_unlocked || 0

    if (newStars >= 5) {
      unlockedCards += 1
    }

    const updatedProcessedOrders = [...meta.processed_orders, orderId]

    const newLoyaltyState = {
      stars_count: newStars,
      scratch_cards_unlocked: unlockedCards,
      total_credit_earned: meta.total_credit_earned || 0,
      processed_orders: updatedProcessedOrders
    }

    // 5. Persist to Auth user_metadata (fail-safe)
    await saveAuthMetadataLoyalty(order.user_id, newLoyaltyState)

    // 6. Persist to DB tables if existing
    try {
      await supabaseAdmin.from('loyalty_star_logs').insert({
        user_id: order.user_id,
        order_id: orderId,
        order_amount: orderAmount,
        stars_awarded: 1,
      })

      await supabaseAdmin.from('user_rewards').upsert({
        user_id: order.user_id,
        stars_count: newStars,
        scratch_cards_unlocked: unlockedCards,
        total_credit_earned: meta.total_credit_earned || 0,
        updated_at: new Date().toISOString(),
      })
    } catch (e) {}

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
 * Claim Lucky Scratch Card Reward (Guaranteed ₹2 – ₹15 Angadi Credit).
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
    const supabaseAdmin = getAdminClient()

    const meta = (await getAuthMetadataLoyalty(userId)) || {
      stars_count: 0,
      scratch_cards_unlocked: 0,
      total_credit_earned: 0,
      processed_orders: []
    }

    if (meta.stars_count < 5 && meta.scratch_cards_unlocked <= 0) {
      return {
        success: false,
        rewardAmount: 0,
        remainingStars: meta.stars_count,
        totalCreditEarned: meta.total_credit_earned,
        message: 'You need 5 stars to unlock a Lucky Scratch Card!',
      }
    }

    // Generate weighted reward based on probability tiers:
    // ₹3 -> Most common reward (38%)
    // ₹2–₹5 -> Most customers receive these (78% total)
    // ₹7–₹10 -> Occasional pleasant surprise (16% total)
    // ₹12–₹15 -> Rare exciting rewards (6% total)
    const generateRewardAmount = (): number => {
      const rand = Math.random() * 100
      if (rand < 1.5) return 15
      if (rand < 3.0) return 14
      if (rand < 4.5) return 13
      if (rand < 6.0) return 12

      if (rand < 10.0) return 10
      if (rand < 14.0) return 9
      if (rand < 18.0) return 8
      if (rand < 22.0) return 7

      if (rand < 60.0) return 3 // ₹3 is most common!
      if (rand < 73.0) return 4
      if (rand < 86.0) return 5
      return 2
    }

    const rewardAmount = generateRewardAmount()

    // Reset star count by 5 and update rewards
    const remainingStars = Math.max(0, meta.stars_count - 5)
    const remainingScratchCards = Math.max(0, (meta.scratch_cards_unlocked || 1) - 1)
    const newTotalCredit = meta.total_credit_earned + rewardAmount

    const newLoyaltyState = {
      stars_count: remainingStars,
      scratch_cards_unlocked: remainingScratchCards,
      total_credit_earned: newTotalCredit,
      processed_orders: meta.processed_orders
    }

    // Save to Auth user_metadata
    await saveAuthMetadataLoyalty(userId, newLoyaltyState)

    // Save to user_rewards DB table if available
    try {
      await supabaseAdmin.from('user_rewards').upsert({
        user_id: userId,
        stars_count: remainingStars,
        scratch_cards_unlocked: remainingScratchCards,
        total_credit_earned: newTotalCredit,
        updated_at: new Date().toISOString(),
      })

      await supabaseAdmin.from('claimed_scratch_cards').insert({
        user_id: userId,
        reward_amount: rewardAmount,
      })
    } catch (e) {}

    // Add reward credit to shop_user_credit wallet or user credit
    try {
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
    } catch (e) {}

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
