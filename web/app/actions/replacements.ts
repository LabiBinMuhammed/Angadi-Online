'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ReplacementRequestReason, ReplacementRequestStatus } from '@/types'

/**
 * Helper to verify that the logged-in user is a vendor of the specified shop.
 */
async function verifyVendorAccess(shopId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Check if they own the shop
  const { data: ownerRecord, error } = await supabase
    .from('shop_owners')
    .select('shop_id')
    .eq('user_id', user.id)
    .eq('shop_id', shopId)
    .maybeSingle()

  if (error || !ownerRecord) {
    throw new Error('Unauthorized: You do not own this shop')
  }

  return user.id
}

/**
 * Helper to verify if the user is an admin.
 */
async function verifyAdminAccess() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (error || profile?.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required')
  }

  return user.id
}

/**
 * Customer Action: Create a replacement request for an order.
 */
export async function createReplacementRequestAction(
  orderId: string,
  reason: ReplacementRequestReason,
  description: string,
  customerImages: string[],
  items: { orderItemId: string; quantity: number }[]
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  if (!items || items.length === 0) {
    return { error: 'Please select at least one item for replacement.' }
  }

  try {
    // 1. Fetch order details to get shopId
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('shop_id, user_id, status')
      .eq('id', orderId)
      .single()

    if (orderErr || !order) {
      return { error: 'Order not found.' }
    }

    if (order.user_id !== user.id) {
      return { error: 'Unauthorized.' }
    }

    // 2. Insert replacement request
    const { data: request, error: requestErr } = await supabase
      .from('replacement_requests')
      .insert({
        order_id: orderId,
        user_id: user.id,
        shop_id: order.shop_id,
        reason,
        description: description || null,
        status: 'Pending',
        customer_images: customerImages || []
      })
      .select()
      .single()

    if (requestErr) {
      return { error: requestErr.message }
    }

    // 3. Insert replacement items
    const replacementItemsData = items.map(item => ({
      replacement_request_id: request.id,
      order_item_id: item.orderItemId,
      quantity: item.quantity
    }))

    const { error: itemsErr } = await supabase
      .from('replacement_items')
      .insert(replacementItemsData)

    if (itemsErr) {
      // Rollback request insertion
      await supabase.from('replacement_requests').delete().eq('id', request.id)
      return { error: itemsErr.message }
    }

    revalidatePath(`/[locale]/orders/${orderId}`, 'page')
    return { success: true, requestId: request.id }
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred' }
  }
}

/**
 * Customer Action: Cancel a pending replacement request.
 */
export async function cancelReplacementRequestAction(requestId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const { data: request, error: fetchErr } = await supabase
      .from('replacement_requests')
      .select('user_id, status, order_id')
      .eq('id', requestId)
      .single()

    if (fetchErr || !request) return { error: 'Request not found.' }
    if (request.user_id !== user.id) return { error: 'Unauthorized.' }
    if (request.status !== 'Pending') return { error: 'Only pending requests can be cancelled.' }

    const { error: updateErr } = await supabase
      .from('replacement_requests')
      .update({ status: 'Cancelled' })
      .eq('id', requestId)

    if (updateErr) return { error: updateErr.message }

    revalidatePath(`/[locale]/orders/${request.order_id}`, 'page')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred' }
  }
}

/**
 * Shop/Vendor Action: Update status of a replacement request (Approved, Rejected, Completed) and add seller notes.
 */
export async function updateReplacementStatusAction(
  shopId: string,
  requestId: string,
  status: ReplacementRequestStatus,
  generalNotes?: string,
  sellerNotesMap?: Record<string, string> // Map of replacement_item_id -> notes
) {
  try {
    await verifyVendorAccess(shopId)
    const supabase = await createClient()

    // 1. Fetch request details to verify shop_id
    const { data: request, error: fetchErr } = await supabase
      .from('replacement_requests')
      .select('shop_id, order_id')
      .eq('id', requestId)
      .single()

    if (fetchErr || !request) return { error: 'Request not found.' }
    if (request.shop_id !== shopId) return { error: 'Unauthorized.' }

    // 2. Update status and notes of the replacement request
    const { error: updateErr } = await supabase
      .from('replacement_requests')
      .update({ status, notes: generalNotes || null })
      .eq('id', requestId)

    if (updateErr) return { error: updateErr.message }

    // 3. Update seller notes for items if provided
    if (sellerNotesMap && Object.keys(sellerNotesMap).length > 0) {
      for (const [itemId, notes] of Object.entries(sellerNotesMap)) {
        await supabase
          .from('replacement_items')
          .update({ seller_notes: notes })
          .eq('id', itemId)
      }
    }

    revalidatePath('/[locale]/(vendor)/vendor/dashboard', 'page')
    revalidatePath('/[locale]/(vendor)/vendor/replacements', 'page')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred' }
  }
}

/**
 * Shop Settings Action: Save replacement settings for a shop.
 */
export async function updateShopReplacementSettingsAction(
  shopId: string,
  replacementEnabled: boolean,
  returnWindowHours: number,
  replacementPolicy: string
) {
  try {
    await verifyVendorAccess(shopId)
    const supabase = await createClient()

    const { error } = await supabase
      .from('shops')
      .update({
        replacement_enabled: replacementEnabled,
        return_window_hours: returnWindowHours,
        replacement_policy: replacementPolicy || null
      })
      .eq('id', shopId)

    if (error) return { error: error.message }

    revalidatePath(`/[locale]/(vendor)/vendor/shop/${shopId}`, 'page')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred' }
  }
}

/**
 * Admin Action: Fetch replacement requests with filters.
 */
export async function getAdminReplacementRequestsAction(filters: {
  shopId?: string
  status?: string
  reason?: string
  dateFrom?: string
  dateTo?: string
}) {
  try {
    await verifyAdminAccess()
    const supabase = await createClient()

    let query = supabase
      .from('replacement_requests')
      .select('*, shops(name), users(name, phone)')
      .order('created_at', { ascending: false })

    if (filters.shopId) {
      query = query.eq('shop_id', filters.shopId)
    }
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.reason) {
      query = query.eq('reason', filters.reason)
    }
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom)
    }
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo)
    }

    const { data, error } = await query
    if (error) return { error: error.message }

    return { data }
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred' }
  }
}

/**
 * Admin Action: Fetch replacement analytics.
 */
export async function getAdminReplacementAnalyticsAction() {
  try {
    await verifyAdminAccess()
    const supabase = await createClient()

    // 1. Fetch all requests for calculation
    const { data: requests, error } = await supabase
      .from('replacement_requests')
      .select('id, status, reason, created_at, updated_at, order_id')

    if (error) return { error: error.message }

    const total = requests.length
    if (total === 0) {
      return {
        data: {
          totalRequests: 0,
          approvedPercent: 0,
          rejectedPercent: 0,
          avgResolutionTimeHours: 0,
          mostCommonReasons: [],
          replacementCost: 0
        }
      }
    }

    const approvedCount = requests.filter(r => r.status === 'Approved' || r.status === 'Completed').length
    const rejectedCount = requests.filter(r => r.status === 'Rejected').length

    // Resolution Time (from Pending to Approved/Rejected/Completed)
    let totalResolutionTimeMs = 0
    let resolvedCount = 0
    requests.forEach(r => {
      if (['Approved', 'Rejected', 'Completed'].includes(r.status)) {
        const start = new Date(r.created_at).getTime()
        const end = new Date(r.updated_at).getTime()
        totalResolutionTimeMs += (end - start)
        resolvedCount++
      }
    })

    const avgResolutionTimeHours = resolvedCount > 0 
      ? Math.round((totalResolutionTimeMs / (1000 * 60 * 60)) / resolvedCount * 10) / 10
      : 0

    // Common Reasons
    const reasonCounts: Record<string, number> = {}
    requests.forEach(r => {
      reasonCounts[r.reason] = (reasonCounts[r.reason] || 0) + 1
    })
    const mostCommonReasons = Object.entries(reasonCounts)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)

    // Replacement Cost: sum of final_price of the replacement items (assuming approved/completed requests)
    const approvedRequestIds = requests
      .filter(r => ['Approved', 'Completed'].includes(r.status))
      .map(r => r.id)

    let replacementCost = 0
    if (approvedRequestIds.length > 0) {
      const { data: items } = await supabase
        .from('replacement_items')
        .select('quantity, order_items(final_price, requested_value, actual_value)')
        .in('replacement_request_id', approvedRequestIds)

      if (items) {
        items.forEach((item: any) => {
          const orderedQty = item.order_items?.actual_value || item.order_items?.requested_value || 1
          const itemPrice = item.order_items ? (item.order_items.final_price / orderedQty) : 0
          replacementCost += item.quantity * itemPrice
        })
      }
    }

    return {
      data: {
        totalRequests: total,
        approvedPercent: Math.round((approvedCount / total) * 100),
        rejectedPercent: Math.round((rejectedCount / total) * 100),
        avgResolutionTimeHours,
        mostCommonReasons,
        replacementCost: Math.round(replacementCost)
      }
    }
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred' }
  }
}
