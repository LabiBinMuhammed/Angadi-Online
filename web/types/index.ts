// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = 'customer' | 'shop_owner' | 'admin'
export type SellMode    = 'Manual' | 'Fixed' | 'Dynamic' | 'Portion'
export type VariantType = 'Manual' | 'Fixed' | 'Dynamic' | 'Portion'
export type OrderStatus = 'pending' | 'accepted' | 'packing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled'
export type OrderItemStatus = 'pending' | 'adjusted' | 'approved' | 'rejected'
export type ItemStatus = 'draft' | 'incomplete' | 'ready' | 'published' | 'hidden' | 'rejected' | 'out_of_stock'
export type PaymentType = 'cod' | 'credit'
export type DeliverySlot = 'morning' | 'evening'

// ─── Users ────────────────────────────────────────────────────────────────────

export interface User {
  id: string
  name: string
  phone: string
  role: UserRole
  is_active: boolean
  phone_verified?: boolean
  last_login_at?: string
  created_at: string
  updated_at: string
}

export interface UserProfile {
  user_id: string
  email?: string
  profile_image_url?: string
  gender?: string
  date_of_birth?: string
  preferred_language?: string
  created_at: string
}

// ─── Addresses ────────────────────────────────────────────────────────────────

export interface UserAddress {
  id: string
  user_id: string
  label: string
  contact_name: string
  contact_phone: string
  address_line_1?: string
  address_line_2?: string
  landmark?: string
  house_name?: string
  village?: string
  delivery_note?: string
  location_id?: string
  latitude?: number
  longitude?: number
  is_default: boolean
  is_active: boolean
  created_at: string
}

export interface OrderAddress {
  id: string
  order_id: string
  label?: string
  contact_name: string
  contact_phone: string
  address_line_1?: string
  address_line_2?: string
  landmark?: string
  house_name?: string
  village?: string
  delivery_note?: string
  latitude?: number
  longitude?: number
}

// ─── Locations ────────────────────────────────────────────────────────────────

export interface Location {
  id: string
  name?: string
  latitude?: number
  longitude?: number
  type?: string
}

// ─── Shops ────────────────────────────────────────────────────────────────────

export interface Shop {
  id: string
  name: string
  location_id?: string
  type?: string
  logo_url?: string
  distance?: string
  replacement_enabled?: boolean
  return_window_hours?: number
  replacement_policy?: string
  created_at: string
  updated_at: string
}

export interface ShopOwner {
  id: string
  shop_id: string
  user_id: string
}

// ─── Categories & Units ───────────────────────────────────────────────────────

export interface Category {
  id: string
  name: string
  description?: string
  is_active: boolean
  display_order?: number
  updated_at: string
}

export interface UnitGroup {
  id: string
  name: string
}

export interface Unit {
  id: string
  name: string
  symbol: string
  unit_group_id: string
  base_multiplier: number
  updated_at: string
}

// ─── Items ────────────────────────────────────────────────────────────────────

export interface DemoItem {
  id: string
  category_id?: string
  name: string
  unit_id?: string
  sell_mode: SellMode
  default_image?: string
  demo_version?: number
  translations?: any
}

export interface DemoSellConfig {
  id: string
  demo_item_id: string
  sell_mode: SellMode
  base_unit_id?: string
  price_per_base_unit?: number
  allow_custom_quantity: boolean
  max_price_increase_percent?: number
  max_price_limit?: number
}

export interface DemoVariant {
  id: string
  demo_item_id: string
  variant_type: VariantType
  label: string
  unit_id?: string
  value?: number
  price?: number
  min_value?: number
  max_value?: number
  is_default: boolean
  is_active: boolean
}

export interface Item {
  id: string
  shop_id: string
  category_id?: string
  demo_item_id?: string
  name: string
  description?: string
  status: ItemStatus
  is_active?: boolean
  has_variants: boolean
  demo_version?: number
  translations?: any
  image_url?: string
  price?: number
  is_packed?: boolean
  variant_options?: string[]
  deleted_at?: string
  updated_at: string
  item_sell_config?: ItemSellConfig[]
  item_variants?: ItemVariant[]
  item_images?: ItemImage[]
}

export interface ItemSellConfig {
  id: string
  item_id: string
  sell_mode: SellMode
  base_unit_id?: string
  price_per_base_unit?: number
  max_price_increase_percent?: number
  max_price_limit?: number
  allow_custom_quantity: boolean
  created_at: string
}

export interface ItemVariant {
  id: string
  item_id: string
  variant_type: VariantType
  label: string
  unit_id?: string
  value?: number
  price?: number
  min_value?: number
  max_value?: number
  is_default: boolean
  is_active: boolean
  image_url?: string
}

export interface ItemImage {
  id: string
  item_id: string
  image_url: string
  is_primary: boolean
  sort_order: number
  alt_text?: string
  created_at: string
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export interface Order {
  id: string
  user_id: string
  shop_id: string
  total_estimated_price?: number
  total_final_price?: number
  payment_type?: PaymentType
  delivery_date?: string
  delivery_slot?: DeliverySlot
  order_number?: number
  delivery_batch_id?: string
  status: OrderStatus
  created_at: string
  updated_at: string
}

export interface ShopDeliverySettings {
  id: string
  shop_id: string
  morning_enabled: boolean
  evening_enabled: boolean
  morning_order_limit: number
  evening_order_limit: number
  morning_cutoff_time: string
  evening_cutoff_time: string
  created_at: string
  updated_at: string
}

export interface DeliveryBatch {
  id: string
  shop_id: string
  delivery_date: string
  delivery_slot: DeliverySlot
  status: 'pending' | 'delivering' | 'completed'
  notes?: string
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  item_id: string
  variant_id: string
  variant_type?: VariantType
  requested_value?: number
  estimated_price: number
  actual_value?: number
  final_price: number
  max_allowed_price?: number
  auto_approved: boolean
  status: OrderItemStatus
}

// ─── Credit ───────────────────────────────────────────────────────────────────

export interface ShopUserCredit {
  id: string
  shop_id: string
  user_id: string
  is_credit_enabled: boolean
  credit_limit?: number
  used_amount?: number
  is_blocked: boolean
  last_credit_used_at?: string
  created_at: string
}

// ─── Cart (client-side model) ─────────────────────────────────────────────────

export interface CartItem {
  id: string
  item: Item
  variant: ItemVariant
  quantity: number
  sell_config?: ItemSellConfig
}

export interface Cart {
  shop_id: string
  items: CartItem[]
}

// ─── API Response wrappers ────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  data: T
  error: null
}

export interface ApiError {
  data: null
  error: {
    message: string
    code?: string
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

export interface PinnedShop {
  id: string
  user_id: string
  shop_id: string
  created_at: string
}

export interface FavoriteItem {
  id: string
  user_id: string
  item_id: string
  created_at: string
}

// ─── Replacement Request System ──────────────────────────────────────────────

export type ReplacementRequestReason =
  | 'Wrong Item'
  | 'Damaged'
  | 'Poor Quality'
  | 'Expired'
  | 'Missing Item'
  | 'Other'

export type ReplacementRequestStatus =
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'Completed'
  | 'Cancelled'

export interface ReplacementRequest {
  id: string
  order_id: string
  user_id: string
  shop_id: string
  reason: ReplacementRequestReason
  description?: string
  status: ReplacementRequestStatus
  customer_images: string[]
  created_at: string
  updated_at: string
  shops?: {
    name: string
  }
  users?: {
    name: string
    phone: string
  }
}

export interface ReplacementItem {
  id: string
  replacement_request_id: string
  order_item_id: string
  quantity: number
  seller_notes?: string
  order_items?: {
    item_id: string
    variant_id: string
    requested_value?: number
    actual_value?: number
    estimated_price: number
    final_price: number
    items?: {
      name: string
    }
    item_variants?: {
      label: string
    }
  }
}

export interface ReplacementStatusLog {
  id: string
  replacement_request_id: string
  from_status?: ReplacementRequestStatus
  to_status: ReplacementRequestStatus
  changed_by?: string
  notes?: string
  created_at: string
}

