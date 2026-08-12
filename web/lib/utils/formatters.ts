/**
 * Utility functions to format and localize raw code strings, statuses, and types
 * ensuring clean, user-friendly text without raw underscores or code keys.
 */

export function formatShopType(type: string | null | undefined, t?: (key: string) => string): string {
  if (!type) return t ? (t('vendor_shop.no_type_set') || 'No Type Set') : 'No Type Set';
  
  const cleanType = type.replace('_inactive', '').trim();
  if (t) {
    const translated = t(`shop_types.${cleanType}`) || t(`categories.${cleanType}`);
    if (translated && !translated.startsWith('shop_types.') && !translated.startsWith('categories.')) {
      return translated;
    }
  }
  
  // Fallback to clean title case
  return cleanType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export function formatOrderStatus(status: string | null | undefined, t?: (key: string) => string): string {
  if (!status) return 'Pending';

  const s = status.toLowerCase();
  
  if (t) {
    const keyMap: Record<string, string> = {
      pending: 'orders.status_pending',
      accepted: 'orders.status_accepted',
      confirmed: 'orders.status_accepted',
      packing: 'orders.status_packing',
      ready: 'orders.status_ready',
      out_for_delivery: 'orders.status_delivering',
      delivering: 'orders.status_delivering',
      delivered: 'orders.status_delivered',
      cancelled: 'orders.status_cancelled',
    };

    const translationKey = keyMap[s] || `orders.status_${s}`;
    const translated = t(translationKey);
    if (translated && !translated.startsWith('orders.status_')) {
      return translated;
    }
  }

  // Fallback clean labels
  const fallbacks: Record<string, string> = {
    pending: 'Pending',
    accepted: 'Accepted',
    confirmed: 'Confirmed',
    packing: 'Packing',
    ready: 'Ready for Pickup',
    out_for_delivery: 'Out for Delivery',
    delivering: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
  };

  return fallbacks[s] || s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function formatPaymentMethod(method: string | null | undefined, t?: (key: string) => string): string {
  if (!method) return 'Cash on Delivery';

  const m = method.toLowerCase();

  if (t) {
    if (m === 'cod') return t('checkout.cash_on_delivery') || 'Cash on Delivery';
    if (m === 'credit') return t('checkout.credit_payment') || 'Credit Payment';
    if (m === 'online') return t('checkout.online_payment') || 'Online Payment';
  }

  if (m === 'cod') return 'Cash on Delivery';
  if (m === 'credit') return 'Credit Payment';
  if (m === 'online') return 'Online Payment';

  return m.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function formatUserRole(role: string | null | undefined, t?: (key: string) => string): string {
  if (!role) return 'Customer';

  const r = role.toLowerCase();

  if (r === 'admin') return 'Admin';
  if (r === 'shop_owner' || r === 'vendor') return 'Shop Owner';
  if (r === 'customer') return 'Customer';

  return r.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
