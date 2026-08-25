'use server'

import { createClient } from '@/lib/supabase/server'

export interface ReportKPIs {
  totalSales: number
  prevTotalSales: number
  salesChangePercent: number | null
  totalOrders: number
  prevTotalOrders: number
  ordersChangePercent: number | null
  itemsSold: number
  avgOrderValue: number
  paidAmount: number
  creditSales: number
  outstandingCredit: number
  cancellationRate: number
  cancelledOrdersCount: number
}

export interface SalesTrendPoint {
  date: string
  label: string
  sales: number
  orders: number
}

export interface StatusBreakdownItem {
  status: string
  count: number
  amount: number
}

export interface PaymentBreakdown {
  cod: { count: number; amount: number }
  credit: { count: number; amount: number }
}

export interface TopProductItem {
  itemId: string
  name: string
  categoryName: string
  imageUrl: string | null
  quantitySold: number
  ordersCount: number
  totalSales: number
  avgPrice: number
  isDynamic: boolean
}

export interface CategoryPerformanceItem {
  categoryId: string
  name: string
  totalSales: number
  ordersCount: number
  percentage: number
}

export interface DynamicPriceSummary {
  adjustedOrdersCount: number
  totalEstimated: number
  totalFinal: number
  difference: number
  differencePercent: number
  itemsCount: number
}

export interface DeliveryPerformanceSummary {
  deliveredCount: number
  morningCount: number
  eveningCount: number
  pendingDeliveriesCount: number
}

export interface ReportOrder {
  id: string
  orderNumber: string | number
  customerName: string
  customerPhone: string
  customerEmail: string
  date: string
  itemsCount: number
  itemsSummary: string
  total: number
  paymentType: 'cod' | 'credit'
  status: string
  deliveryDate: string | null
  deliverySlot: string | null
}

export interface ReportCustomer {
  userId: string
  name: string
  phone: string
  totalOrders: number
  totalPurchased: number
  creditOutstanding: number
  creditLimit: number | null
  isCreditEnabled: boolean
  isBlocked: boolean
  lastOrderDate: string | null
}

export interface VendorReportData {
  shopId: string
  shopName: string
  dateRange: {
    startDate: string
    endDate: string
    preset: string
  }
  kpis: ReportKPIs
  salesTrend: SalesTrendPoint[]
  statusBreakdown: StatusBreakdownItem[]
  paymentBreakdown: PaymentBreakdown
  topProducts: TopProductItem[]
  categoryPerformance: CategoryPerformanceItem[]
  dynamicPriceSummary: DynamicPriceSummary
  deliveryPerformance: DeliveryPerformanceSummary
  orders: ReportOrder[]
  customers: ReportCustomer[]
  creditLedger: {
    userId: string
    name: string
    phone: string
    creditLimit: number | null
    usedAmount: number
    availableCredit: number
    isBlocked: boolean
    isCreditEnabled: boolean
    lastUsedAt: string | null
  }[]
}

/**
 * Helper to verify vendor ownership of the shop
 */
async function verifyVendorAccess(shopId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: ownerRecord, error } = await supabase
    .from('shop_owners')
    .select('shop_id, shops(id, name)')
    .eq('user_id', user.id)
    .eq('shop_id', shopId)
    .maybeSingle()

  if (error || !ownerRecord) {
    throw new Error('Unauthorized: You do not have permission to view reports for this shop')
  }

  const shopName = (ownerRecord as any)?.shops?.name || 'Shop'
  return { userId: user.id, shopName }
}

/**
 * Main server action to calculate all report metrics server-side
 */
export async function getVendorReportDataAction(
  shopId: string,
  startDateStr: string,
  endDateStr: string,
  preset: string = 'this_month'
): Promise<VendorReportData> {
  const { shopName } = await verifyVendorAccess(shopId)
  const supabase = await createClient()

  // Format ISO timestamps for DB boundary queries
  const startIso = `${startDateStr}T00:00:00.000Z`
  const endIso = `${endDateStr}T23:59:59.999Z`

  const startMs = new Date(startIso).getTime()
  const endMs = new Date(endIso).getTime()
  const durationMs = endMs - startMs
  const prevStartIso = new Date(startMs - durationMs).toISOString()
  const prevEndIso = new Date(startMs - 1).toISOString()

  // Execute parallel queries
  const [
    currentOrdersRes,
    prevOrdersRes,
    creditRes,
    repaymentLogsRes
  ] = await Promise.all([
    // Current period orders with relations
    supabase
      .from('orders')
      .select(`
        id, order_number, user_id, shop_id, total_estimated_price, total_final_price, payment_type, status, delivery_date, delivery_slot, created_at, updated_at,
        users(id, name, phone, email),
        order_addresses(contact_name, contact_phone, address_line_1, address_line_2, landmark),
        order_items(
          *,
          items(id, name, category_id, categories(id, name)),
          item_variants(label, value, price, image_url)
        )
      `)
      .eq('shop_id', shopId)
      .gte('created_at', startIso)
      .lte('created_at', endIso)
      .order('created_at', { ascending: false }),

    // Previous period orders (for comparative growth trends)
    supabase
      .from('orders')
      .select('id, total_final_price, total_estimated_price, status')
      .eq('shop_id', shopId)
      .gte('created_at', prevStartIso)
      .lte('created_at', prevEndIso),

    // Live customer credit ledger for this shop
    supabase
      .from('shop_user_credit')
      .select('id, shop_id, user_id, is_credit_enabled, credit_limit, used_amount, is_blocked, last_credit_used_at, created_at, users(id, name, phone, email)')
      .eq('shop_id', shopId),

    // Repayment logs recorded during this period
    supabase
      .from('customer_repayment_logs')
      .select('id, shop_id, user_id, amount, notes, created_at, users(name, phone)')
      .eq('shop_id', shopId)
      .gte('created_at', startIso)
      .lte('created_at', endIso)
  ])

  if (currentOrdersRes.error) {
    throw new Error(`Failed to load order data: ${currentOrdersRes.error.message}`)
  }

  const rawOrders = currentOrdersRes.data || []
  const prevOrders = prevOrdersRes.data || []
  const rawCredits = creditRes.data || []
  const repaymentLogs = repaymentLogsRes.data || []

  // 1. Core KPIs Calculation
  const totalOrders = rawOrders.length
  const cancelledOrders = rawOrders.filter(o => o.status === 'cancelled')
  const nonCancelledOrders = rawOrders.filter(o => o.status !== 'cancelled')
  const completedOrders = rawOrders.filter(o => o.status === 'delivered')

  const totalSales = nonCancelledOrders.reduce((sum, o) => {
    const p = o.total_final_price ?? o.total_estimated_price ?? 0
    return sum + Number(p)
  }, 0)

  const prevNonCancelled = prevOrders.filter(o => o.status !== 'cancelled')
  const prevTotalOrders = prevOrders.length
  const prevTotalSales = prevNonCancelled.reduce((sum, o) => {
    const p = o.total_final_price ?? o.total_estimated_price ?? 0
    return sum + Number(p)
  }, 0)

  const salesChangePercent = prevTotalSales > 0 ? Number((((totalSales - prevTotalSales) / prevTotalSales) * 100).toFixed(1)) : null
  const ordersChangePercent = prevTotalOrders > 0 ? Number((((totalOrders - prevTotalOrders) / prevTotalOrders) * 100).toFixed(1)) : null

  // Items sold in non-cancelled orders
  let itemsSold = 0
  nonCancelledOrders.forEach(o => {
    (o.order_items || []).forEach(oi => {
      if (oi.status !== 'rejected') {
        const val = oi.actual_value ?? oi.requested_value ?? 1
        itemsSold += Number(val) > 0 ? Number(val) : 1
      }
    })
  })

  const avgOrderValue = nonCancelledOrders.length > 0 ? Number((totalSales / nonCancelledOrders.length).toFixed(2)) : 0

  // Paid: COD delivered orders + credit repayments received in period
  const codPaidAmount = completedOrders
    .filter(o => o.payment_type === 'cod' || !o.payment_type)
    .reduce((sum, o) => sum + Number(o.total_final_price ?? o.total_estimated_price ?? 0), 0)
  const repaymentsPaidAmount = repaymentLogs.reduce((sum, r) => sum + Number(r.amount || 0), 0)
  const paidAmount = codPaidAmount + repaymentsPaidAmount

  // Credit Sales in period
  const creditSales = nonCancelledOrders
    .filter(o => o.payment_type === 'credit')
    .reduce((sum, o) => sum + Number(o.total_final_price ?? o.total_estimated_price ?? 0), 0)

  // Current Live Outstanding Balance
  const outstandingCredit = rawCredits.reduce((sum, c) => sum + Number(c.used_amount || 0), 0)

  const cancellationRate = totalOrders > 0 ? Number(((cancelledOrders.length / totalOrders) * 100).toFixed(1)) : 0

  const kpis: ReportKPIs = {
    totalSales: Number(totalSales.toFixed(2)),
    prevTotalSales: Number(prevTotalSales.toFixed(2)),
    salesChangePercent,
    totalOrders,
    prevTotalOrders,
    ordersChangePercent,
    itemsSold: Number(itemsSold.toFixed(2)),
    avgOrderValue,
    paidAmount: Number(paidAmount.toFixed(2)),
    creditSales: Number(creditSales.toFixed(2)),
    outstandingCredit: Number(outstandingCredit.toFixed(2)),
    cancellationRate,
    cancelledOrdersCount: cancelledOrders.length
  }

  // 2. Sales Trend Timeline
  const trendMap = new Map<string, { date: string; label: string; sales: number; orders: number }>()

  // Prepopulate dates between startDate and endDate
  const curDate = new Date(startDateStr)
  const stopDate = new Date(endDateStr)
  while (curDate <= stopDate) {
    const y = curDate.getFullYear()
    const m = String(curDate.getMonth() + 1).padStart(2, '0')
    const d = String(curDate.getDate()).padStart(2, '0')
    const dKey = `${y}-${m}-${d}`
    const label = curDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    trendMap.set(dKey, { date: dKey, label, sales: 0, orders: 0 })
    curDate.setDate(curDate.getDate() + 1)
  }

  rawOrders.forEach(o => {
    if (!o.created_at) return
    const dKey = o.created_at.split('T')[0]
    const existing = trendMap.get(dKey)
    if (existing) {
      existing.orders += 1
      if (o.status !== 'cancelled') {
        existing.sales += Number(o.total_final_price ?? o.total_estimated_price ?? 0)
      }
    }
  })

  const salesTrend: SalesTrendPoint[] = Array.from(trendMap.values()).map(p => ({
    ...p,
    sales: Number(p.sales.toFixed(2))
  }))

  // 3. Status Breakdown
  const statusCounts: Record<string, { count: number; amount: number }> = {
    pending: { count: 0, amount: 0 },
    delivering: { count: 0, amount: 0 },
    packing: { count: 0, amount: 0 },
    delivered: { count: 0, amount: 0 },
    cancelled: { count: 0, amount: 0 }
  }

  rawOrders.forEach(o => {
    const s = o.status || 'pending'
    const amt = Number(o.total_final_price ?? o.total_estimated_price ?? 0)
    if (statusCounts[s]) {
      statusCounts[s].count += 1
      statusCounts[s].amount += amt
    } else {
      statusCounts[s] = { count: 1, amount: amt }
    }
  })

  const statusBreakdown: StatusBreakdownItem[] = Object.entries(statusCounts).map(([status, val]) => ({
    status,
    count: val.count,
    amount: Number(val.amount.toFixed(2))
  }))

  // 4. Payment Breakdown (COD vs Credit)
  const paymentBreakdown: PaymentBreakdown = {
    cod: { count: 0, amount: 0 },
    credit: { count: 0, amount: 0 }
  }

  nonCancelledOrders.forEach(o => {
    const amt = Number(o.total_final_price ?? o.total_estimated_price ?? 0)
    if (o.payment_type === 'credit') {
      paymentBreakdown.credit.count += 1
      paymentBreakdown.credit.amount += amt
    } else {
      paymentBreakdown.cod.count += 1
      paymentBreakdown.cod.amount += amt
    }
  })

  // 5. Top Products & Categories Aggregations
  const productMap = new Map<string, TopProductItem>()
  const categoryMap = new Map<string, { categoryId: string; name: string; totalSales: number; ordersCount: Set<string> }>()

  let dynamicEstSum = 0
  let dynamicFinalSum = 0
  let dynamicItemsCount = 0
  const dynamicOrdersSet = new Set<string>()

  nonCancelledOrders.forEach(o => {
    const oItems = o.order_items || []
    oItems.forEach(oi => {
      if (oi.status === 'rejected') return

      const itemId = oi.item_id
      const itemObj = (Array.isArray(oi.items) ? oi.items[0] : oi.items) as any
      const catObj = (Array.isArray(itemObj?.categories) ? itemObj?.categories[0] : itemObj?.categories) as any
      const itemName = itemObj?.name || 'Product Item'
      const catName = catObj?.name || 'General'
      const catId = itemObj?.category_id || 'uncategorized'
      const vType = oi.variant_type?.toLowerCase()
      const isDynamic = vType === 'dynamic' || vType === 'portion'

      // Check primary image
      let imgUrl: string | null = null
      if (Array.isArray(itemObj?.item_images) && itemObj.item_images.length > 0) {
        const primary = itemObj.item_images.find((img: any) => img.is_primary)
        imgUrl = primary?.image_url || itemObj.item_images[0].image_url
      }
      if (!imgUrl && oi.item_variants) {
        const v = Array.isArray(oi.item_variants) ? oi.item_variants[0] : oi.item_variants
        imgUrl = v?.image_url || null
      }

      const val = Number(oi.actual_value ?? oi.requested_value ?? 1)
      const sales = Number(oi.final_price ?? oi.estimated_price ?? 0)

      // Product Aggregation
      if (!productMap.has(itemId)) {
        productMap.set(itemId, {
          itemId,
          name: itemName,
          categoryName: catName,
          imageUrl: imgUrl,
          quantitySold: 0,
          ordersCount: 0,
          totalSales: 0,
          avgPrice: 0,
          isDynamic
        })
      }
      const pObj = productMap.get(itemId)!
      pObj.quantitySold += val > 0 ? val : 1
      pObj.ordersCount += 1
      pObj.totalSales += sales

      // Category Aggregation
      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, {
          categoryId: catId,
          name: catName,
          totalSales: 0,
          ordersCount: new Set<string>()
        })
      }
      const cObj = categoryMap.get(catId)!
      cObj.totalSales += sales
      cObj.ordersCount.add(o.id)

      // Dynamic Price Adjustments Tracking
      if (isDynamic) {
        dynamicItemsCount += 1
        dynamicOrdersSet.add(o.id)
        dynamicEstSum += Number(oi.estimated_price || 0)
        dynamicFinalSum += Number(oi.final_price || 0)
      }
    })
  })

  const topProducts: TopProductItem[] = Array.from(productMap.values()).map(p => ({
    ...p,
    quantitySold: Number(p.quantitySold.toFixed(2)),
    totalSales: Number(p.totalSales.toFixed(2)),
    avgPrice: p.quantitySold > 0 ? Number((p.totalSales / p.quantitySold).toFixed(2)) : 0
  })).sort((a, b) => b.totalSales - a.totalSales)

  const categoryPerformance: CategoryPerformanceItem[] = Array.from(categoryMap.values()).map(c => ({
    categoryId: c.categoryId,
    name: c.name,
    totalSales: Number(c.totalSales.toFixed(2)),
    ordersCount: c.ordersCount.size,
    percentage: totalSales > 0 ? Number(((c.totalSales / totalSales) * 100).toFixed(1)) : 0
  })).sort((a, b) => b.totalSales - a.totalSales)

  // 6. Dynamic Price Summary
  const dynamicDiff = dynamicFinalSum - dynamicEstSum
  const dynamicDiffPercent = dynamicEstSum > 0 ? Number(((dynamicDiff / dynamicEstSum) * 100).toFixed(1)) : 0

  const dynamicPriceSummary: DynamicPriceSummary = {
    adjustedOrdersCount: dynamicOrdersSet.size,
    totalEstimated: Number(dynamicEstSum.toFixed(2)),
    totalFinal: Number(dynamicFinalSum.toFixed(2)),
    difference: Number(dynamicDiff.toFixed(2)),
    differencePercent: dynamicDiffPercent,
    itemsCount: dynamicItemsCount
  }

  // 7. Delivery Performance
  const morningCount = rawOrders.filter(o => o.delivery_slot?.toLowerCase() === 'morning').length
  const eveningCount = rawOrders.filter(o => o.delivery_slot?.toLowerCase() === 'evening').length
  const pendingDeliveriesCount = rawOrders.filter(o => o.status === 'delivering' || o.status === 'pending').length

  const deliveryPerformance: DeliveryPerformanceSummary = {
    deliveredCount: completedOrders.length,
    morningCount,
    eveningCount,
    pendingDeliveriesCount
  }

  // 8. Orders Table List
  const formattedOrders: ReportOrder[] = rawOrders.map(o => {
    const items = o.order_items || []
    const summary = items.map(oi => {
      const iObj = (Array.isArray(oi.items) ? oi.items[0] : oi.items) as any
      const name = iObj?.name || 'Item'
      const qty = oi.actual_value ?? oi.requested_value ?? 1
      return `${qty}x ${name}`
    }).slice(0, 3).join(', ') + (items.length > 3 ? ` +${items.length - 3} more` : '')

    const userObj = (Array.isArray(o.users) ? o.users[0] : o.users) as any
    const addrObj = (Array.isArray(o.order_addresses) ? o.order_addresses[0] : o.order_addresses) as any

    return {
      id: o.id,
      orderNumber: o.order_number ?? o.id.slice(0, 8).toUpperCase(),
      customerName: userObj?.name || addrObj?.contact_name || 'Customer',
      customerPhone: userObj?.phone || addrObj?.contact_phone || '—',
      customerEmail: userObj?.email || '—',
      date: o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—',
      itemsCount: items.length,
      itemsSummary: summary || 'No items',
      total: Number(o.total_final_price ?? o.total_estimated_price ?? 0),
      paymentType: (o.payment_type as 'cod' | 'credit') || 'cod',
      status: o.status || 'pending',
      deliveryDate: o.delivery_date || null,
      deliverySlot: o.delivery_slot || null
    }
  })

  // 9. Customers & Credit Ledger Summary
  const customerMap = new Map<string, ReportCustomer>()

  // Initialize from credit accounts
  rawCredits.forEach(c => {
    if (!c.user_id) return
    const uObj = (Array.isArray(c.users) ? c.users[0] : c.users) as any
    customerMap.set(c.user_id, {
      userId: c.user_id,
      name: uObj?.name || 'Credit Customer',
      phone: uObj?.phone || '—',
      totalOrders: 0,
      totalPurchased: 0,
      creditOutstanding: Number(c.used_amount || 0),
      creditLimit: c.credit_limit != null ? Number(c.credit_limit) : null,
      isCreditEnabled: !!c.is_credit_enabled,
      isBlocked: !!c.is_blocked,
      lastOrderDate: null
    })
  })

  // Incorporate actual order activities
  rawOrders.forEach(o => {
    if (!o.user_id) return
    const uid = o.user_id
    const userObj = (Array.isArray(o.users) ? o.users[0] : o.users) as any
    const addrObj = (Array.isArray(o.order_addresses) ? o.order_addresses[0] : o.order_addresses) as any

    if (!customerMap.has(uid)) {
      customerMap.set(uid, {
        userId: uid,
        name: userObj?.name || addrObj?.contact_name || 'Customer',
        phone: userObj?.phone || addrObj?.contact_phone || '—',
        totalOrders: 0,
        totalPurchased: 0,
        creditOutstanding: 0,
        creditLimit: null,
        isCreditEnabled: false,
        isBlocked: false,
        lastOrderDate: null
      })
    }

    const cObj = customerMap.get(uid)!
    cObj.totalOrders += 1
    if (o.status !== 'cancelled') {
      cObj.totalPurchased += Number(o.total_final_price ?? o.total_estimated_price ?? 0)
    }
    if (!cObj.lastOrderDate && o.created_at) {
      cObj.lastOrderDate = new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    }
  })

  const customers: ReportCustomer[] = Array.from(customerMap.values()).map(c => ({
    ...c,
    totalPurchased: Number(c.totalPurchased.toFixed(2)),
    creditOutstanding: Number(c.creditOutstanding.toFixed(2))
  })).sort((a, b) => b.totalPurchased - a.totalPurchased)

  const creditLedger = rawCredits.map(c => {
    const used = Number(c.used_amount || 0)
    const limit = c.credit_limit != null ? Number(c.credit_limit) : null
    const avail = limit != null ? Math.max(0, limit - used) : 999999
    const uObj = (Array.isArray(c.users) ? c.users[0] : c.users) as any
    return {
      userId: c.user_id,
      name: uObj?.name || 'Customer',
      phone: uObj?.phone || '—',
      creditLimit: limit,
      usedAmount: used,
      availableCredit: avail,
      isBlocked: !!c.is_blocked,
      isCreditEnabled: !!c.is_credit_enabled,
      lastUsedAt: c.last_credit_used_at ? new Date(c.last_credit_used_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null
    }
  }).sort((a, b) => b.usedAmount - a.usedAmount)

  return {
    shopId,
    shopName,
    dateRange: {
      startDate: startDateStr,
      endDate: endDateStr,
      preset
    },
    kpis,
    salesTrend,
    statusBreakdown,
    paymentBreakdown,
    topProducts,
    categoryPerformance,
    dynamicPriceSummary,
    deliveryPerformance,
    orders: formattedOrders,
    customers,
    creditLedger
  }
}
