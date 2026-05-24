// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = 'customer' | 'shop_owner' | 'admin'
export type SellMode    = 'Manual' | 'Fixed' | 'Dynamic' | 'Portion'
export type VariantType = 'Manual' | 'Fixed' | 'Dynamic' | 'Portion'
export type OrderStatus = 'pending' | 'packing' | 'delivering' | 'delivered' | 'cancelled'
export type OrderItemStatus = 'pending' | 'adjusted' | 'approved' | 'rejected'
export type ItemStatus = 'draft' | 'incomplete' | 'ready' | 'published' | 'hidden' | 'rejected' | 'out_of_stock'
export type PaymentType = 'cod' | 'credit'

// ─── Users ────────────────────────────────────────────────────────────────────

export interface User {
  id: string
  name: string
  phone: string
  role: UserRole
  is_active: boolean
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
  address_line_1: string
  address_line_2?: string
  landmark?: string
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
  contact_name: string
  contact_phone: string
  address_line_1: string
  address_line_2?: string
  landmark?: string
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
  status: OrderStatus
  created_at: string
  updated_at: string
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
