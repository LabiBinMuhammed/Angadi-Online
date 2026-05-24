import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Order } from '@/types'
import { ArrowLeft, Package, Clock, Truck, CheckCircle2, XCircle } from 'lucide-react'

export const metadata: Metadata = { title: 'My Orders' }

const STATUS_MAP: Record<string, { bg: string; color: string; label: string; Icon: any }> = {
  pending:    { bg: '#fff8e6', color: '#f59e0b', label: 'Pending',    Icon: Clock },
  packing:    { bg: '#e0f2fe', color: '#0ea5e9', label: 'Packing',    Icon: Package },
  delivering: { bg: '#e0f2fe', color: '#0ea5e9', label: 'On the way', Icon: Truck },
  delivered:  { bg: '#dcfce7', color: '#22c55e', label: 'Delivered',  Icon: CheckCircle2 },
  cancelled:  { bg: '#fee2e2', color: '#ef4444', label: 'Cancelled',  Icon: XCircle },
}

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, created_at, total_final_price, shop_id, shops(name)')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const orderList = ((orders ?? []) as unknown) as (Order & { shops: { name: string } | null })[]

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        body { background: #fafafa; }
        .page-container { width: 100%; max-width: 600px; margin: 0 auto; padding: 24px 24px 100px; }
        .header { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; }
        .back-btn { width: 44px; height: 44px; border-radius: 50%; background: #fff; border: 1px solid #eaeaea; display: flex; align-items: center; justify-content: center; color: #1a1a1a; transition: all 0.2s; }
        .title { font-size: 28px; font-weight: 800; color: #1e4d1e; margin: 0; letter-spacing: -0.5px; }
        
        .order-card { background: #fff; border-radius: 24px; padding: 20px; margin-bottom: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); display: flex; flex-direction: column; gap: 16px; text-decoration: none; transition: transform 0.2s; }
        .order-card:active { transform: scale(0.98); }
        .order-header { display: flex; justify-content: space-between; align-items: center; }
        .shop-name { font-size: 18px; font-weight: 800; color: #1a1a1a; margin: 0; }
        .order-date { font-size: 13px; color: #999; font-weight: 500; }
        
        .order-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px solid #f5f5f5; }
        .order-price { font-size: 20px; font-weight: 800; color: #4cd964; }
        .status-badge { display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 700; }
        
        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; text-align: center; }
        .empty-icon { font-size: 64px; margin-bottom: 24px; }
        .empty-title { font-size: 24px; font-weight: 800; color: #1a1a1a; margin: 0 0 8px; }
        .empty-sub { font-size: 15px; color: #777; margin: 0 0 32px; font-weight: 500; }
        .browse-btn { background: linear-gradient(135deg, #4cd964, #32b84a); color: #fff; border: none; border-radius: 24px; padding: 16px 32px; font-size: 16px; font-weight: 700; text-decoration: none; box-shadow: 0 8px 20px rgba(76,217,100,0.3); }
      `}} />

      <div className="page-container">
        <div className="header">
          <Link href="/profile" className="back-btn">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="title">My Orders</h1>
        </div>

        {orderList.length > 0 ? (
          <div>
            {orderList.map((order) => {
              const st = STATUS_MAP[order.status] ?? { bg: '#f5f5f5', color: '#666', label: order.status, Icon: Package }
              const StatusIcon = st.Icon
              return (
                <Link key={order.id} href={`/orders/${order.id}`} className="order-card" id={`order-row-${order.id}`}>
                  <div className="order-header">
                    <div>
                      <h3 className="shop-name">{order.shops?.name ?? 'Shop'}</h3>
                      <span className="order-date">
                        {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: st.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: st.color }}>
                      <StatusIcon size={24} strokeWidth={2.5} />
                    </div>
                  </div>
                  <div className="order-footer">
                    <span className="order-price">
                      {order.total_final_price != null ? `$ ${order.total_final_price}` : '--'}
                    </span>
                    <span className="status-badge" style={{ background: st.bg, color: st.color }}>
                      {st.label}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h2 className="empty-title">No orders yet</h2>
            <p className="empty-sub">You haven't placed any orders yet. Start shopping to see your history here.</p>
            <Link href="/home" className="browse-btn" id="orders-browse-btn">
              Browse Shops
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
