'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { SellMode } from '@/types'

export type UpdateDemoDetailsInput = {
  demoId: string
  locale: string
  name: string
  code: string | null
  category_id: string | null
  unit_id: string | null
  sell_mode: SellMode
  display_order: number | null
  default_image: string | null
  malayalamName?: string
}

export async function updateDemoDetailsAction(input: UpdateDemoDetailsInput) {
  try {
    const supabase = createAdminClient()

    if (!input.name || !input.name.trim()) {
      return { success: false, error: 'Product name cannot be blank.' }
    }

    const payload = {
      name: input.name.trim(),
      code: input.code?.trim() || null,
      category_id: input.category_id || null,
      unit_id: input.unit_id || null,
      sell_mode: input.sell_mode,
      display_order: input.display_order,
      default_image: input.default_image?.trim() || null
    }

    const { data: updatedItem, error: updateErr } = await supabase
      .from('demo_items')
      .update(payload)
      .eq('id', input.demoId)
      .select()
      .single()

    if (updateErr) {
      console.error('updateDemoDetailsAction error:', updateErr)
      return { success: false, error: updateErr.message }
    }

    // Save Malayalam translation
    if (input.malayalamName && input.malayalamName.trim()) {
      const { error: transErr } = await supabase
        .from('demo_item_translations')
        .upsert({
          demo_item_id: input.demoId,
          language_code: 'ml',
          name: input.malayalamName.trim()
        }, { onConflict: 'demo_item_id,language_code' })

      if (transErr) {
        console.error('Translation upsert error:', transErr)
      }
    } else {
      // Remove translation if empty
      await supabase
        .from('demo_item_translations')
        .delete()
        .eq('demo_item_id', input.demoId)
        .eq('language_code', 'ml')
    }

    // Revalidate paths
    revalidatePath(`/${input.locale}/admin/demos/${input.demoId}`)
    revalidatePath(`/${input.locale}/admin/demos`)
    revalidatePath('/admin/demos')

    return { success: true, item: updatedItem }
  } catch (err: any) {
    console.error('updateDemoDetailsAction caught error:', err)
    return { success: false, error: err.message || 'Failed to update template details.' }
  }
}

export type SaveDemoConfigInput = {
  demoId: string
  locale: string
  configId?: string
  sell_mode: SellMode
  base_unit_id: string | null
  allow_custom_quantity: boolean
  price_per_base_unit: number
  max_price_increase_percent: number | null
  max_price_limit: number | null
}

export async function saveDemoConfigAction(input: SaveDemoConfigInput) {
  try {
    const supabase = createAdminClient()

    if (input.price_per_base_unit < 0) {
      return { success: false, error: 'Price per base unit cannot be negative.' }
    }
    if (
      input.max_price_increase_percent !== null &&
      (input.max_price_increase_percent < 0 || input.max_price_increase_percent > 100)
    ) {
      return { success: false, error: 'Max price increase percent must be between 0 and 100.' }
    }

    const payload = {
      demo_item_id: input.demoId,
      sell_mode: input.sell_mode,
      base_unit_id: input.base_unit_id || null,
      allow_custom_quantity: input.allow_custom_quantity,
      price_per_base_unit: Number(input.price_per_base_unit) || 0,
      max_price_increase_percent: input.max_price_increase_percent !== null ? Number(input.max_price_increase_percent) : null,
      max_price_limit: input.max_price_limit !== null ? Number(input.max_price_limit) : null
    }

    let savedConfig = null

    // Check if a record already exists
    const { data: existing } = await supabase
      .from('demo_sell_config')
      .select('id')
      .eq('demo_item_id', input.demoId)
      .maybeSingle()

    if (existing?.id || input.configId) {
      const targetId = existing?.id || input.configId
      const { data, error } = await supabase
        .from('demo_sell_config')
        .update(payload)
        .eq('id', targetId)
        .select()
        .single()

      if (error) {
        console.error('Update config error:', error)
        return { success: false, error: error.message }
      }
      savedConfig = data
    } else {
      const { data, error } = await supabase
        .from('demo_sell_config')
        .insert(payload)
        .select()
        .single()

      if (error) {
        console.error('Insert config error:', error)
        return { success: false, error: error.message }
      }
      savedConfig = data
    }

    revalidatePath(`/${input.locale}/admin/demos/${input.demoId}`)
    revalidatePath(`/${input.locale}/admin/demos`)

    return { success: true, config: savedConfig }
  } catch (err: any) {
    console.error('saveDemoConfigAction error:', err)
    return { success: false, error: err.message || 'Failed to save sell configuration.' }
  }
}

export type VariantInput = {
  label: string
  unit_id?: string | null
  value: number
  price: number
  is_default: boolean
  is_active?: boolean
}

export type SaveDemoVariantsInput = {
  demoId: string
  locale: string
  sellMode: SellMode
  defaultUnitId: string | null
  variants: VariantInput[]
}

export async function saveDemoVariantsAction(input: SaveDemoVariantsInput) {
  try {
    const supabase = createAdminClient()

    if (input.variants.some(v => !v.label || !v.label.trim())) {
      return { success: false, error: 'All variants must have a label (e.g. 500g, 1kg).' }
    }
    if (input.variants.length > 12) {
      return { success: false, error: 'Maximum 12 pack variants allowed.' }
    }

    // Delete existing variants
    const { error: delErr } = await supabase
      .from('demo_variants')
      .delete()
      .eq('demo_item_id', input.demoId)

    if (delErr) {
      console.error('Error clearing demo variants:', delErr)
      return { success: false, error: delErr.message }
    }

    let insertedVariants: any[] = []

    if (input.variants.length > 0) {
      const payload = input.variants.map((v, idx) => ({
        demo_item_id: input.demoId,
        variant_type: input.sellMode,
        label: v.label.trim(),
        unit_id: v.unit_id || input.defaultUnitId || null,
        value: v.value ? Number(v.value) : 1,
        price: v.price ? Number(v.price) : 0,
        is_default: Boolean(v.is_default),
        is_active: v.is_active ?? true,
        display_order: idx + 1
      }))

      const { data, error: insErr } = await supabase
        .from('demo_variants')
        .insert(payload)
        .select()

      if (insErr) {
        console.error('Error inserting demo variants:', insErr)
        return { success: false, error: insErr.message }
      }
      insertedVariants = data || []
    }

    revalidatePath(`/${input.locale}/admin/demos/${input.demoId}`)
    revalidatePath(`/${input.locale}/admin/demos`)

    return { success: true, variants: insertedVariants }
  } catch (err: any) {
    console.error('saveDemoVariantsAction error:', err)
    return { success: false, error: err.message || 'Failed to save variants.' }
  }
}

export async function deleteDemoTemplateAction(demoId: string, locale: string) {
  try {
    const supabase = createAdminClient()

    // 1. Delete associated child records
    await supabase.from('demo_variants').delete().eq('demo_item_id', demoId)
    await supabase.from('demo_sell_config').delete().eq('demo_item_id', demoId)
    await supabase.from('demo_item_translations').delete().eq('demo_item_id', demoId)

    // 2. Delete demo item itself
    const { error: delErr } = await supabase.from('demo_items').delete().eq('id', demoId)
    if (delErr) {
      console.error('Delete demo_item error:', delErr)
      return { success: false, error: delErr.message }
    }

    revalidatePath(`/${locale}/admin/demos`)
    revalidatePath('/admin/demos')

    return { success: true }
  } catch (err: any) {
    console.error('deleteDemoTemplateAction error:', err)
    return { success: false, error: err.message || 'Failed to delete blueprint template.' }
  }
}

export async function uploadDemoImageAction(formData: FormData) {
  try {
    const file = formData.get('file') as File
    if (!file) {
      return { success: false, error: 'No image file was received.' }
    }

    const supabase = createAdminClient()
    const arrayBuffer = await file.arrayBuffer()
    const ext = file.name.split('.').pop() || 'jpg'
    const fileName = `demos/demo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`

    const { error: upErr } = await supabase.storage
      .from('item-images')
      .upload(fileName, arrayBuffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || 'image/jpeg'
      })

    if (upErr) {
      console.error('Upload storage error:', upErr)
      return { success: false, error: upErr.message }
    }

    const { data } = supabase.storage.from('item-images').getPublicUrl(fileName)
    return { success: true, publicUrl: data.publicUrl }
  } catch (err: any) {
    console.error('uploadDemoImageAction error:', err)
    return { success: false, error: err.message || 'Failed to upload image to server storage.' }
  }
}
