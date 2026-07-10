'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Item, Category, DemoItem, Unit, DemoSellConfig, DemoVariant } from '@/types'
import { Package, Save, AlertCircle, ArrowRight, ArrowLeft, Plus, Trash2, Edit, Check, Eye, Store, Sparkles, PenTool, Carrot, Apple, Milk, Wheat, Flame, Croissant, GlassWater, Fish } from 'lucide-react'
import ImageUploader from '@/components/ImageUploader'
import { parseVariantLabel } from '@/lib/utils/parser'
import { useTranslation } from '@/lib/i18n/I18nContext'

type Props = {
  item: Item | null
  shopId: string
  categories: Category[]
  demoItems?: DemoItem[]
  units?: Unit[]
  demoConfigs?: DemoSellConfig[]
  demoVariants?: DemoVariant[]
}

const SELLING_STYLES = [
  {
    value: 'Manual',
    title: 'തൂക്കത്തിൽ വിൽക്കുന്നത്',
    sub: 'By Weight',
    desc: 'കിലോഗ്രാം, ഗ്രാം കണക്കിൽ തൂക്കി വിൽക്കുന്നവ (ഉദാ: തക്കാളി, ഉള്ളി)',
    emoji: '⚖️',
    color: '#3b82f6'
  },
  {
    value: 'Fixed',
    title: 'പാക്ക് ചെയ്ത ഉൽപ്പന്നം',
    sub: 'Pre-Packed',
    desc: 'നിശ്ചിത അളവിലുള്ള കവറുകളോ പാക്കറ്റുകളോ ആയി വിൽക്കുന്നവ (ഉദാ: പാൽ, ബിസ്ക്കറ്റ്)',
    emoji: '📦',
    color: '#10b981'
  },
  {
    value: 'Portion',
    title: 'മുറിച്ച് നൽകുന്ന ഉൽപ്പന്നം',
    sub: 'By Piece/Portion',
    desc: 'പീസ് ആയിട്ടോ മുറിച്ചോ വിൽക്കുന്നവ (ഉദാ: ചക്ക, കപ്പ, പൂള)',
    emoji: '🔪',
    color: '#f59e0b'
  },
  {
    value: 'Dynamic',
    title: 'വലിപ്പം പറഞ്ഞ് വിൽക്കുന്നത്',
    sub: 'Size-based/Dynamic Price',
    desc: 'ചെറുത്, വലുത് എന്നിങ്ങനെ വലിപ്പം നോക്കി വിൽക്കുന്നവ (ഉദാ: ചിക്കൻ, മീൻ)',
    emoji: ' Rooster',
    color: '#ec4899'
  }
]

function renderCategoryIcon(name: string, size = 40) {
  const n = name.toLowerCase()
  if (n.includes('vegetable') || n.includes('veg')) return <Carrot size={size} />
  if (n.includes('fruit'))      return <Apple size={size} />
  if (n.includes('dairy') || n.includes('beverage')) return <Milk size={size} />
  if (n.includes('grain') || n.includes('rice') || n.includes('wheat') || n.includes('grocery')) return <Wheat size={size} />
  if (n.includes('spice'))      return <Flame size={size} />
  if (n.includes('bakery') || n.includes('bread')) return <Croissant size={size} />
  if (n.includes('oil'))        return <GlassWater size={size} />
  if (n.includes('meat') || n.includes('fish'))    return <Fish size={size} />
  if (n.includes('household') || n.includes('essentials') || n.includes('clean')) return <Sparkles size={size} />
  if (n.includes('stationery') || n.includes('pen') || n.includes('pencil')) return <PenTool size={size} />
  return <Package size={size} />
}

function parseManualUnitAndPrice(unitText: string, priceText: string, unitsList: Unit[]) {
  const cleanUnit = (unitText || '').trim()
  const cleanPrice = Number(priceText || 0)
  if (isNaN(cleanPrice) || cleanPrice <= 0) return null

  const match = cleanUnit.match(/^\s*([\d.]+)?\s*([a-zA-Z&]+)\s*$/)
  if (!match) return null

  const value = match[1] ? Number(match[1]) : 1
  const symbol = match[2].toLowerCase()

  let targetSymbol = symbol
  if (symbol === 'piece') targetSymbol = 'pcs'

  const matchedUnit = unitsList.find(u => u.symbol.toLowerCase() === targetSymbol)
  if (!matchedUnit) return null

  const pricePerBaseUnit = value > 0 ? cleanPrice / value : 0

  return {
    base_unit_id: matchedUnit.id,
    price_per_base_unit: pricePerBaseUnit,
    value: value,
    symbol: matchedUnit.symbol
  }
}

export default function ItemFormClient({
  item,
  shopId,
  categories,
  demoItems = [],
  units = [],
  demoConfigs = [],
  demoVariants = []
}: Props) {
  const { t, isRtl, locale } = useTranslation()
  const isEdit = !!item
  const router = useRouter()

  const BackIcon = isRtl ? ArrowRight : ArrowLeft
  const NextIcon = isRtl ? ArrowLeft : ArrowRight

  const resolvedSellConfig = item?.item_sell_config 
    ? (Array.isArray(item.item_sell_config) ? item.item_sell_config[0] : item.item_sell_config)
    : null

  // Steps: 1=Category, 2=Selling Style/Demo, 3=Details, 4=Variants, 5=Preview
  const [step, setStep] = useState(isEdit ? 3 : 1)

  // Manual mode state
  const [manualUnitText, setManualUnitText] = useState(() => {
    if (item && resolvedSellConfig?.price_per_base_unit && resolvedSellConfig?.base_unit_id) {
      const unit = units.find(u => u.id === resolvedSellConfig.base_unit_id)
      if (unit) {
        return `1${unit.symbol}`
      }
    }
    return '1kg'
  })
  
  const [manualPriceVal, setManualPriceVal] = useState(() => {
    if (item && resolvedSellConfig?.price_per_base_unit) {
      return resolvedSellConfig.price_per_base_unit.toString()
    }
    return ''
  })

  // Fixed mode state for new option
  const [newOptMeasure, setNewOptMeasure] = useState('')
  const [newOptPrice, setNewOptPrice] = useState('')

  const [form, setForm] = useState({
    name: item?.name ?? '',
    description: item?.description ?? '',
    category_id: item?.category_id ?? '',
    demo_item_id: item?.demo_item_id ?? '',
    sell_mode: (resolvedSellConfig?.sell_mode ?? 'Manual') as string,
    base_unit_id: (resolvedSellConfig?.base_unit_id ?? '') as string,
    price_per_base_unit: (resolvedSellConfig?.price_per_base_unit?.toString() ?? '') as string,
    status: item?.status || (item?.is_active ? 'published' : 'draft'),
  })

  const [variants, setVariants] = useState<any[]>(() => {
    if (item?.item_variants && item.item_variants.length > 0) {
      return item.item_variants.map(v => ({
        id: v.id,
        variant_type: v.variant_type,
        label: v.label,
        unit_id: v.unit_id ?? '',
        value: v.value ?? '',
        price: v.price ?? '',
        min_value: v.min_value ?? null,
        max_value: v.max_value ?? null,
        is_default: v.is_default,
        is_active: v.is_active,
        image_url: v.image_url ?? ''
      }))
    }
    return []
  })

  const [images, setImages] = useState<string[]>(
    item?.item_images && item.item_images.length > 0
      ? item.item_images.map(img => img.image_url)
      : item?.image_url ? [item.image_url] : []
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Variant modal / bottom drawer state
  const [isVarModalOpen, setIsVarModalOpen] = useState(false)
  const [editingVarIndex, setEditingVarIndex] = useState<number | null>(null)
  const [modalLabel, setModalLabel] = useState('')
  const [modalPrice, setModalPrice] = useState('')
  const [modalImageUrl, setModalImageUrl] = useState('')
  const [modalValue, setModalValue] = useState<number>(1)
  const [modalUnitId, setModalUnitId] = useState<string>('')
  const [modalIsDefault, setModalIsDefault] = useState(false)

  // Interactive customer preview state
  const [previewActiveVarIdx, setPreviewActiveVarIdx] = useState<number>(0)

  function set(key: string, val: unknown) {
    setForm(f => ({ ...f, [key]: val }))
  }

  const categoryDemos = useMemo(() => {
    if (!form.category_id) return []
    return demoItems.filter(d => d.category_id === form.category_id)
  }, [form.category_id, demoItems])

  function selectDemoItem(demo: DemoItem) {
    const config = demoConfigs.find(c => c.demo_item_id === demo.id)
    const vars = demoVariants.filter(v => v.demo_item_id === demo.id)

    set('demo_item_id', demo.id)
    set('name', demo.name)
    set('sell_mode', demo.sell_mode)

    if (config) {
      set('base_unit_id', config.base_unit_id || demo.unit_id || '')
      set('price_per_base_unit', config.price_per_base_unit || '')
      if (demo.sell_mode === 'Manual') {
        const u = units.find(unit => unit.id === (config.base_unit_id || demo.unit_id))
        setManualUnitText(u ? `1${u.symbol}` : '1kg')
        setManualPriceVal(config.price_per_base_unit ? config.price_per_base_unit.toString() : '')
      }
    } else {
      set('base_unit_id', demo.unit_id || '')
      if (demo.sell_mode === 'Manual') {
        const u = units.find(unit => unit.id === demo.unit_id)
        setManualUnitText(u ? `1${u.symbol}` : '1kg')
        setManualPriceVal('')
      }
    }

    if (vars.length > 0) {
       setVariants(vars.map(v => ({
         variant_type: demo.sell_mode,
         label: v.label,
         unit_id: v.unit_id || demo.unit_id || '',
         value: v.value || '',
         price: v.price || '',
         min_value: v.min_value ?? null,
         max_value: v.max_value ?? null,
         is_default: v.is_default,
         is_active: v.is_active,
         image_url: ''
       })))
     } else {
       setVariants([])
     }

    if (demo.default_image) setImages([demo.default_image])
    setStep(3)
  }

  function skipDemo() {
    set('demo_item_id', '')
    setStep(3)
  }

  function handleManualUnitChange(val: string) {
    setManualUnitText(val)
    updateManualPricing(val, manualPriceVal)
  }

  function handleManualPriceChange(val: string) {
    setManualPriceVal(val)
    updateManualPricing(manualUnitText, val)
  }

  function updateManualPricing(unitText: string, priceText: string) {
    const parsed = parseManualUnitAndPrice(unitText, priceText, units)
    if (parsed) {
      set('base_unit_id', parsed.base_unit_id)
      set('price_per_base_unit', parsed.price_per_base_unit.toString())

      // If sellMode is Dynamic or Portion, recalculate variants' prices!
      if (['Dynamic', 'Portion'].includes(form.sell_mode)) {
        const basePrice = parsed.price_per_base_unit
        const newVars = [...variants].map(v => {
          const varUnit = units.find(u => u.id === v.unit_id)
          const baseUnit = units.find(u => u.id === parsed.base_unit_id)
          if (varUnit && baseUnit) {
            const ratio = Number(varUnit.base_multiplier) / Number(baseUnit.base_multiplier)
            const calc = Number(v.value) * ratio * basePrice
            v.price = calc.toFixed(2)
          }
          return v
        })
        setVariants(newVars)
      }
    } else {
      set('base_unit_id', '')
      set('price_per_base_unit', '')
    }
  }

  function handleAddFixedOption() {
    if (!newOptMeasure.trim()) {
      setError('Please enter the measure of pack (e.g. 250g).')
      return
    }
    if (!newOptPrice || isNaN(Number(newOptPrice)) || Number(newOptPrice) < 0) {
      setError('Please enter a valid price.')
      return
    }

    const parsed = parseManualUnitAndPrice(newOptMeasure, newOptPrice, units)
    const unitId = parsed ? parsed.base_unit_id : null
    const val = parsed ? parsed.value : 1

    const newVar = {
      variant_type: 'Fixed',
      label: newOptMeasure.trim(),
      unit_id: unitId,
      value: val,
      price: Number(newOptPrice),
      is_default: variants.length === 0,
      is_active: true,
      image_url: ''
    }

    setVariants([...variants, newVar])
    setNewOptMeasure('')
    setNewOptPrice('')
    setError(null)
  }

  // Variant Modal functions
  function openAddVariantModal() {
    if (variants.length >= 5) {
      setError(t('vendor_items.err_max_variants'))
      return
    }
    setEditingVarIndex(null)
    setModalLabel('')
    setModalPrice('')
    setModalImageUrl('')
    setModalValue(1)
    setModalUnitId(form.base_unit_id || '')
    setModalIsDefault(variants.length === 0)
    setIsVarModalOpen(true)
    setError(null)
  }

  function openEditVariantModal(index: number) {
    const v = variants[index]
    setEditingVarIndex(index)
    setModalLabel(v.label)
    setModalPrice(v.price?.toString() ?? '')
    setModalImageUrl(v.image_url ?? '')
    setModalValue(v.value ? Number(v.value) : 1)
    setModalUnitId(v.unit_id ?? '')
    setModalIsDefault(v.is_default)
    setIsVarModalOpen(true)
    setError(null)
  }

  function autoCalculatePrice(val: number, unitId: string): string {
    const basePrice = Number(form.price_per_base_unit)
    if (!basePrice || isNaN(basePrice) || !form.base_unit_id) return ''

    const varUnit = units.find(u => u.id === unitId)
    const baseUnit = units.find(u => u.id === form.base_unit_id)
    if (!varUnit || !baseUnit) return ''

    const ratio = Number(varUnit.base_multiplier) / Number(baseUnit.base_multiplier)
    const calc = val * ratio * basePrice
    return calc.toFixed(2)
  }

  function handleModalLabelChange(label: string) {
    setModalLabel(label)
    const parsed = parseVariantLabel(label, form.category_id, units)
    if (parsed.value) {
      setModalValue(parsed.value)
    }
    if (parsed.unitId) {
      setModalUnitId(parsed.unitId)
      const calculated = autoCalculatePrice(parsed.value, parsed.unitId)
      if (calculated) {
        setModalPrice(calculated)
      }
    }
  }

  function saveVariantModal() {
    if (!modalLabel.trim()) {
      setError(t('vendor_items.err_variant_label_required'))
      return
    }
    if (!modalPrice || isNaN(Number(modalPrice)) || Number(modalPrice) < 0) {
      setError(t('vendor_items.err_variant_price_invalid'))
      return
    }

    const varObj = {
      variant_type: form.sell_mode,
      label: modalLabel.trim(),
      unit_id: modalUnitId || null,
      value: modalValue,
      price: Number(modalPrice),
      is_default: modalIsDefault,
      is_active: true,
      image_url: modalImageUrl || null
    }

    const newVars = [...variants]
    if (modalIsDefault) {
      newVars.forEach(v => { v.is_default = false })
    }

    if (editingVarIndex !== null) {
      newVars[editingVarIndex] = { ...newVars[editingVarIndex], ...varObj }
    } else {
      newVars.push(varObj)
    }

    // Ensure at least one default variant exists
    if (newVars.length > 0 && !newVars.some(v => v.is_default)) {
      newVars[0].is_default = true
    }

    setVariants(newVars)
    setIsVarModalOpen(false)
    setError(null)
  }

  function removeVariant(index: number) {
    const newVars = [...variants]
    const deletedIsDefault = newVars[index]?.is_default
    newVars.splice(index, 1)

    if (newVars.length > 0 && deletedIsDefault) {
      newVars[0].is_default = true
    }

    setVariants(newVars)
    setError(null)
  }

  function handleBaseUnitChange(unitId: string) {
    set('base_unit_id', unitId)
    const unit = units.find(u => u.id === unitId)
    if (form.sell_mode === 'Manual' && unit && (unit.symbol === 'g' || unit.symbol === 'kg')) {
      // Setup smart default weights
      setVariants([
        { label: '250g', value: 250, price: autoCalculatePrice(250, '32d0b812-34cc-415c-b7cf-1f96dc2f841f') || '', is_default: false, is_active: true, variant_type: 'Manual', unit_id: '32d0b812-34cc-415c-b7cf-1f96dc2f841f', image_url: '' },
        { label: '500g', value: 500, price: autoCalculatePrice(500, '32d0b812-34cc-415c-b7cf-1f96dc2f841f') || '', is_default: true, is_active: true, variant_type: 'Manual', unit_id: '32d0b812-34cc-415c-b7cf-1f96dc2f841f', image_url: '' },
        { label: '1kg', value: 1000, price: autoCalculatePrice(1000, 'fc6f287c-0b3c-458e-8d4f-4679d0059c32') || '', is_default: false, is_active: true, variant_type: 'Manual', unit_id: 'fc6f287c-0b3c-458e-8d4f-4679d0059c32', image_url: '' }
      ])
    }
  }

  function handleBasePriceChange(val: string) {
    set('price_per_base_unit', val)
    const basePrice = Number(val)
    if (!isNaN(basePrice) && basePrice > 0) {
      const newVars = [...variants].map(v => {
        const calculated = autoCalculatePrice(Number(v.value), v.unit_id)
        if (calculated) {
          v.price = calculated
        }
        return v
      })
      setVariants(newVars)
    }
  }

  const isComplete = Boolean(
    form.name &&
    form.category_id &&
    images.length > 0 &&
    (
      (form.sell_mode !== 'Fixed' && (variants.length > 0 || (form.base_unit_id && form.price_per_base_unit))) ||
      (form.sell_mode === 'Fixed' && variants.length > 0)
    )
  )

  async function handleFinalSubmit(intendedStatus: 'draft' | 'published') {
    if (!form.name || !shopId) {
      setError(t('vendor_items.err_name_required'))
      return
    }
    setSaving(true)
    setError(null)
    const supabase = createClient()
    let targetId: string | null = null

    try {
      if (isEdit) {
        targetId = item!.id
        // 1. Update basic item details
        const payload = {
          name: form.name,
          description: form.description || null,
          category_id: form.category_id || null,
          is_active: intendedStatus === 'published',
          has_variants: variants.length > 0,
          image_url: images[0] || null,
        }
        const { error: updateError } = await supabase.from('items').update(payload).eq('id', item!.id)
        if (updateError) throw updateError

        // 2. Sync images (delete existing, insert new)
        await supabase.from('item_images').delete().eq('item_id', item!.id)
        if (images.length > 0) {
          const imagePayload = images.map((url, idx) => ({
            item_id: item!.id,
            image_url: url,
            is_primary: idx === 0,
            sort_order: idx
          }))
          const { error: imgError } = await supabase.from('item_images').insert(imagePayload)
          if (imgError) throw imgError
        }

        // 3. Upsert item_sell_config
        const sellConfigPayload = {
          item_id: item!.id,
          sell_mode: form.sell_mode as any,
          base_unit_id: form.base_unit_id || null,
          price_per_base_unit: form.price_per_base_unit ? Number(form.price_per_base_unit) : 0,
          allow_custom_quantity: true,
          max_price_increase_percent: 15,
          max_price_limit: 0
        }
        const { error: configError } = await supabase.from('item_sell_config').upsert(sellConfigPayload)
        if (configError) throw configError

        // 4. Sync item_variants (delete existing, insert new)
        await supabase.from('item_variants').delete().eq('item_id', item!.id)
        
        let varPayload = variants.map(v => ({
          item_id: item!.id,
          variant_type: form.sell_mode as any,
          label: v.label,
          unit_id: v.unit_id || null,
          value: v.value ? Number(v.value) : 1,
          price: v.price ? Number(v.price) : 0,
          min_value: v.min_value !== undefined ? v.min_value : null,
          max_value: v.max_value !== undefined ? v.max_value : null,
          is_default: v.is_default,
          is_active: v.is_active,
          image_url: v.image_url || null
        }))

        if (form.sell_mode === 'Manual' && varPayload.length === 0) {
          varPayload = [{
            item_id: item!.id,
            variant_type: 'Manual' as any,
            label: 'Default',
            unit_id: form.base_unit_id || null,
            value: 1,
            price: 0,
            min_value: null,
            max_value: null,
            is_default: true,
            is_active: true,
            image_url: null
          }]
        }

        if (varPayload.length > 0) {
          const { error: varError } = await supabase.from('item_variants').insert(varPayload)
          if (varError) throw varError
        }

      } else {
        // CREATE flow via RPC transaction
        const config = demoConfigs.find(c => c.demo_item_id === form.demo_item_id)
        const rpcPayload = {
          shop_id: shopId,
          category_id: form.category_id || null,
          demo_item_id: form.demo_item_id || null,
          name: form.name,
          description: form.description || null,
          status: intendedStatus,
          is_active: intendedStatus === 'published',
          has_variants: variants.length > 0,
          images: images.map((url, idx) => ({ image_url: url, is_primary: idx === 0, sort_order: idx })),
          sell_config: {
            sell_mode: form.sell_mode,
            base_unit_id: form.base_unit_id || null,
            price_per_base_unit: form.price_per_base_unit ? Number(form.price_per_base_unit) : 0,
            allow_custom_quantity: config ? config.allow_custom_quantity : true,
            max_price_increase_percent: config ? config.max_price_increase_percent : 15,
            max_price_limit: config ? config.max_price_limit : 0
          },
          variants: variants.length > 0 ? variants.map(v => ({
            variant_type: v.variant_type,
            label: v.label,
            unit_id: v.unit_id || null,
            value: v.value ? Number(v.value) : 1,
            price: v.price ? Number(v.price) : 0,
            min_value: v.min_value !== undefined ? v.min_value : null,
            max_value: v.max_value !== undefined ? v.max_value : null,
            is_default: v.is_default,
            is_active: v.is_active,
            image_url: v.image_url || null
          })) : (form.sell_mode === 'Manual' ? [{
            variant_type: 'Manual',
            label: 'Default',
            unit_id: form.base_unit_id || null,
            value: 1,
            price: 0,
            min_value: null,
            max_value: null,
            is_default: true,
            is_active: true,
            image_url: null
          }] : [])
        }

        const { data: rpcData, error: rpcError } = await supabase.rpc('create_shop_item_transaction', { payload: rpcPayload })
        if (rpcError) throw rpcError
        targetId = rpcData?.item_id

        // Update items.image_url with primary image
        if (targetId && images.length > 0) {
          const { error: urlUpdateError } = await supabase
            .from('items')
            .update({ image_url: images[0] })
            .eq('id', targetId)
          if (urlUpdateError) console.error("Failed to update items.image_url:", urlUpdateError.message)
        }
      }

      // ─── Trigger Auto-Translation ───
      if (targetId) {
        try {
          await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'item',
              id: targetId,
              fields: {
                name: form.name,
                description: form.description || ''
              }
            })
          })

          // Fetch and translate all item variants
          const { data: insertedVars } = await supabase
            .from('item_variants')
            .select('id, label')
            .eq('item_id', targetId)
          
          if (insertedVars && insertedVars.length > 0) {
            for (const v of insertedVars) {
              await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'variant',
                  id: v.id,
                  fields: {
                    label: v.label
                  }
                })
              })
            }
          }
        } catch (tErr) {
          console.error("Auto translation failed:", tErr)
        }
      }

      router.push('/vendor/items')
      router.refresh()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'An error occurred while saving the item')
      setSaving(false)
    }
  }

  // Helper values for active preview
  const activePreviewVar = variants[previewActiveVarIdx] || variants.find(v => v.is_default) || variants[0]
  const previewImage = activePreviewVar?.image_url || images[0] || ''
  const previewPrice = activePreviewVar ? activePreviewVar.price : (form.price_per_base_unit || '0')

  // Total steps helper
  const totalSteps = isEdit ? 3 : 5
  const currentStepNum = isEdit
    ? (step === 3 ? 1 : step === 4 ? 2 : 3)
    : step

  const stepTitle = useMemo(() => {
    if (isEdit) {
      if (step === 3) return t('vendor_items.add_item_details_title')
      if (step === 4) return t('vendor_items.pricing_variants_title')
      return t('vendor_items.preview_title')
    } else {
      if (step === 1) return t('vendor_items.step_1_title')
      if (step === 2) return t('vendor_items.step_2_title')
      if (step === 3) return t('vendor_items.add_item_details_title')
      if (step === 4) return t('vendor_items.pricing_variants_title')
      return t('vendor_items.preview_title')
    }
  }, [isEdit, step, t])

  return (
    <div className="vp-card" style={{ maxWidth: 800, margin: '0 auto', background: 'rgba(20,20,25,0.7)', border: '1px solid rgba(255,255,255,0.05)' }}>
      
      {/* Steps Indicator */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>
          <span>{t('vendor_items.step_indicator').replace('{currentStep}', currentStepNum.toString()).replace('{totalSteps}', totalSteps.toString())}</span>
          <span style={{ color: '#fff' }}>
            {stepTitle}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {Array.from({ length: totalSteps }).map((_, idx) => (
            <div key={idx} style={{
              flex: 1,
              height: 6,
              borderRadius: 3,
              background: currentStepNum >= idx + 1
                ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
                : 'rgba(255,255,255,0.08)',
              transition: 'all 0.3s ease'
            }} />
          ))}
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: '1.5rem', padding: '1rem', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.12)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem' }}>
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {/* STEP 1: CATEGORY SELECTION */}
      {step === 1 && !isEdit && (
        <div className="vp-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: '0 0 0.5rem 0' }}>{t('vendor_items.step_1_title')}</h2>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.95rem' }}>{t('vendor_items.step_1_desc')}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1rem' }}>
            {categories.map(c => (
              <button key={c.id} type="button" onClick={() => { set('category_id', c.id); setStep(2) }}
                className="vp-btn" style={{
                  height: '130px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: form.category_id === c.id ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255,255,255,0.02)',
                  border: `2px solid ${form.category_id === c.id ? '#3b82f6' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '24px',
                  transition: 'all 0.25s ease',
                  gap: '0.5rem',
                  padding: '1rem'
                }}
                onMouseOver={(e) => {
                  if (form.category_id !== c.id) {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }
                }}
                onMouseOut={(e) => {
                  if (form.category_id !== c.id) {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.transform = 'none';
                  }
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: '48px', color: '#60a5fa' }}>
                  {renderCategoryIcon(c.name, 40)}
                </span>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff', textAlign: 'center', lineHeight: '1.2' }}>{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: LOAD FROM TEMPLATES */}
      {step === 2 && !isEdit && (
        <div className="vp-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: '0 0 0.25rem 0' }}>{t('vendor_items.step_2_title')}</h2>
              <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.95rem' }}>{t('vendor_items.step_2_desc')}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
              <button type="button" onClick={() => setStep(1)} className="vp-btn vp-btn-outline vp-btn-sm" style={{ height: '38px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><BackIcon size={16}/> {t('vendor_items.back_button')}</button>
              <button type="button" onClick={skipDemo} className="vp-btn vp-btn-outline vp-btn-sm" style={{ height: '38px', borderRadius: '10px' }}>{t('vendor_items.skip_to_custom')}</button>
            </div>
          </div>

          {categoryDemos.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
              {categoryDemos.map(d => (
                <button key={d.id} type="button" onClick={() => selectDemoItem(d)}
                  className="vp-btn" style={{
                    background: 'rgba(59,130,246,0.08)',
                    border: '1px solid rgba(59,130,246,0.2)',
                    borderRadius: '16px',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    justifyContent: 'flex-start',
                    width: '100%',
                    textAlign: isRtl ? 'right' : 'left'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(59,130,246,0.15)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(59,130,246,0.08)'}
                >
                  <Package size={16} style={{ color: '#60a5fa' }} />
                  <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff' }}>{d.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <Package size={48} style={{ color: '#475569', margin: '0 auto 1rem auto' }} />
              <p style={{ color: '#94a3b8', margin: '0 0 1.5rem 0', fontSize: '0.95rem' }}>{t('vendor_items.no_templates')}</p>
              <button type="button" onClick={skipDemo} className="vp-btn vp-btn-primary">
                {t('vendor_items.create_custom_item')}
              </button>
            </div>
          )}
        </div>
      )}


      {/* STEP 3: BASIC DETAILS */}
      {step === 3 && (
        <div className="vp-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: '0 0 0.25rem 0' }}>
                {isEdit ? t('vendor_items.edit_item_details_title') : t('vendor_items.add_item_details_title')}
              </h2>
              <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.95rem' }}>{t('vendor_items.enter_details_desc')}</p>
            </div>
            {!isEdit && (
              <button type="button" onClick={() => setStep(2)} className="vp-btn vp-btn-outline vp-btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <BackIcon size={16}/> {t('vendor_items.back_button')}
              </button>
            )}
          </div>

          <ImageUploader
            shopId={shopId}
            images={images}
            onChange={setImages}
            maxImages={4}
          />

          <div className="vp-form-group">
            <label className="vp-label" htmlFor="item-name">{t('vendor_items.product_name_label')} *</label>
            <input id="item-name" className="vp-input" value={form.name} required
              onChange={e => set('name', e.target.value)} placeholder={t('vendor_items.product_name_placeholder')}
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '0.85rem 1rem' }} />
          </div>

          <div className="vp-form-group">
            <label className="vp-label" htmlFor="item-desc">{t('vendor_items.description_label')}</label>
            <textarea id="item-desc" className="vp-textarea" rows={3} value={form.description}
              onChange={e => set('description', e.target.value)} placeholder={t('vendor_items.description_placeholder')}
              style={{ resize: 'vertical', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '0.85rem 1rem' }} />
          </div>

          {['Manual', 'Dynamic', 'Portion'].includes(form.sell_mode) && (
            <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '24px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', margin: 0 }}>
                Pricing & Unit
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="vp-form-group">
                  <label className="vp-label">Unit/Measure (e.g. 101g, 1kg, 250ml) *</label>
                  <input 
                    className="vp-input" 
                    value={manualUnitText} 
                    onChange={e => handleManualUnitChange(e.target.value)} 
                    placeholder="e.g. 101g"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '0.85rem 1rem' }}
                  />
                </div>
                <div className="vp-form-group">
                  <label className="vp-label">Price (₹) *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    className="vp-input" 
                    value={manualPriceVal} 
                    onChange={e => handleManualPriceChange(e.target.value)} 
                    placeholder="0.00"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '0.85rem 1rem' }}
                  />
                </div>
              </div>
              {manualUnitText && manualPriceVal && parseManualUnitAndPrice(manualUnitText, manualPriceVal, units) && (
                <p style={{ fontSize: '0.8rem', color: '#4ade80', margin: 0, fontWeight: 500 }}>
                  Active setting: ₹{Number(manualPriceVal).toFixed(2)} per {manualUnitText} (calculated as ₹{parseManualUnitAndPrice(manualUnitText, manualPriceVal, units)?.price_per_base_unit.toFixed(4)} per base unit).
                </p>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
            <button type="button" className="vp-btn vp-btn-outline" onClick={() => router.back()} style={{ flex: 1 }}>{t('vendor_items.cancel_button')}</button>
            <button type="button" onClick={() => {
              if (!form.name.trim()) {
                setError(t('vendor_items.err_name_required'))
                return
              }
              if (['Manual', 'Dynamic', 'Portion'].includes(form.sell_mode)) {
                const parsed = parseManualUnitAndPrice(manualUnitText, manualPriceVal, units)
                if (!parsed) {
                  setError("Please enter a valid unit/measure (e.g. 101g, 1kg) and a valid positive price.")
                  return
                }
              }
              if (form.sell_mode === 'Manual') {
                setStep(5)
                setError(null)
              } else {
                setStep(4)
                setError(null)
              }
            }} className="vp-btn vp-btn-primary" style={{ flex: 1.5, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {form.sell_mode === 'Manual' ? (
                <>Next: Preview <NextIcon size={18} /></>
              ) : (
                <>{t('vendor_items.next_variants_pricing')} <NextIcon size={18} /></>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: VARIANTS AND PRICING */}
      {step === 4 && (
        <div className="vp-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: '0 0 0.25rem 0' }}>
                {t('vendor_items.pricing_variants_title')}
              </h2>
              <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.95rem' }}>
                {form.sell_mode === 'Fixed' ? 'Configure pack sizes and prices.' : 'View pre-defined option configurations.'}
              </p>
            </div>
            <button type="button" onClick={() => setStep(3)} className="vp-btn vp-btn-outline vp-btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><BackIcon size={16}/> {t('vendor_items.back_button')}</button>
          </div>

          {form.sell_mode === 'Fixed' ? (
            <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '24px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff', margin: 0 }}>
                  Pre-Packed Options / Variants
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
                  {variants.length} / 5 Options Configured
                </span>
              </div>

              {/* Options List */}
              {variants.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                  <p style={{ color: '#94a3b8', margin: 0 }}>No options added yet. Add at least one option below.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {variants.map((v, idx) => (
                    <div key={idx} style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: `1.5px solid ${v.is_default ? '#3b82f6' : 'rgba(255, 255, 255, 0.06)'}`,
                      borderRadius: '16px',
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexDirection: isRtl ? 'row-reverse' : 'row'
                    }}>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                        <div style={{ textAlign: isRtl ? 'right' : 'left' }}>
                          <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{v.label}</span>
                          {v.is_default && (
                            <span style={{ marginInlineStart: '0.5rem', fontSize: '0.65rem', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                              Default
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                        <span style={{ fontWeight: 800, color: '#4ade80' }}>₹{Number(v.price).toFixed(2)}</span>
                        
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          {!v.is_default && (
                            <button type="button" onClick={() => {
                              const newVars = [...variants].map((item, i) => ({ ...item, is_default: i === idx }))
                              setVariants(newVars)
                            }} className="vp-btn vp-btn-outline vp-btn-sm" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                              Set Default
                            </button>
                          )}
                          <button type="button" onClick={() => removeVariant(idx)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#f87171', padding: '6px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Remove">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Inline Add Option Form */}
              {variants.length < 5 && (
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1.25rem' }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#fff', fontWeight: 700 }}>Add New Option</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.75rem', alignItems: 'end' }}>
                    <div className="vp-form-group" style={{ marginBottom: 0 }}>
                      <label className="vp-label" style={{ fontSize: '0.75rem', marginBottom: '0.35rem' }}>Measure of Pack (e.g. 250g, 500ml, 12pcs) *</label>
                      <input 
                        className="vp-input" 
                        value={newOptMeasure} 
                        onChange={e => setNewOptMeasure(e.target.value)} 
                        placeholder="e.g. 250g"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '0.65rem 0.85rem', fontSize: '0.9rem' }}
                      />
                    </div>
                    <div className="vp-form-group" style={{ marginBottom: 0 }}>
                      <label className="vp-label" style={{ fontSize: '0.75rem', marginBottom: '0.35rem' }}>Price (₹) *</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        className="vp-input" 
                        value={newOptPrice} 
                        onChange={e => setNewOptPrice(e.target.value)} 
                        placeholder="0.00"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '0.65rem 0.85rem', fontSize: '0.9rem' }}
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={handleAddFixedOption} 
                      className="vp-btn vp-btn-primary" 
                      style={{ padding: '0.65rem 1.25rem', borderRadius: '10px', height: '39px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Plus size={16} /> Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Dynamic or Portion mode: display demo options with Remove button and Set Default button
            <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '24px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff', margin: 0 }}>
                  Demo Options
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
                  {variants.length} Options Config
                </span>
              </div>
              
              {variants.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                  <p style={{ color: '#94a3b8', margin: 0 }}>No options remaining. At least one option is required.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {variants.map((v, idx) => (
                    <div key={idx} style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: `1.5px solid ${v.is_default ? '#3b82f6' : 'rgba(255, 255, 255, 0.06)'}`,
                      borderRadius: '16px',
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexDirection: isRtl ? 'row-reverse' : 'row'
                    }}>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                        <div style={{ textAlign: isRtl ? 'right' : 'left' }}>
                          <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{v.label}</span>
                          {v.is_default && (
                            <span style={{ marginInlineStart: '0.5rem', fontSize: '0.65rem', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                              Default
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                        <span style={{ color: '#4ade80', fontWeight: 800 }}>
                          {v.price && Number(v.price) > 0 ? `₹${Number(v.price).toFixed(2)}` : 'Pricing dynamic'}
                        </span>
                        
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          {!v.is_default && (
                            <button type="button" onClick={() => {
                              const newVars = [...variants].map((item, i) => ({ ...item, is_default: i === idx }))
                              setVariants(newVars)
                            }} className="vp-btn vp-btn-outline vp-btn-sm" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                              Set Default
                            </button>
                          )}
                          <button type="button" onClick={() => {
                            const filtered = variants.filter((_, i) => i !== idx);
                            if (v.is_default && filtered.length > 0) {
                              filtered[0].is_default = true;
                            }
                            setVariants(filtered);
                          }} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#f87171', padding: '6px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Remove">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
            <button type="button" onClick={() => setStep(3)} className="vp-btn vp-btn-outline" style={{ flex: 1 }}>{t('vendor_items.back_button')}</button>
            <button type="button" onClick={() => {
              if (variants.length === 0) {
                setError("Please ensure there is at least one option/variant configured.")
              } else {
                setStep(5)
                setError(null)
              }
            }} className="vp-btn vp-btn-primary" style={{ flex: 1.5, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {t('vendor_items.next_customer_preview')} <Eye size={18} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: VISUAL CUSTOMER PREVIEW */}
      {step === 5 && (
        <div className="vp-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: '0 0 0.25rem 0' }}>
                {t('vendor_items.preview_title')}
              </h2>
              <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.95rem' }}>{t('vendor_items.preview_desc')}</p>
            </div>
            <button type="button" onClick={() => setStep(form.sell_mode === 'Manual' ? 3 : 4)} className="vp-btn vp-btn-outline vp-btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><BackIcon size={16}/> {t('vendor_items.back_button')}</button>
          </div>

          {/* Smartphone Mockup */}
          <div style={{
            width: '100%',
            maxWidth: '350px',
            margin: '0 auto',
            border: '8px solid #27272a',
            borderRadius: '36px',
            background: '#09090b',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            {/* Screen Header */}
            <div style={{ height: '24px', background: '#18181b', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ width: '60px', height: '12px', background: '#000', borderRadius: '6px' }} />
            </div>

            {/* Screen Content */}
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', direction: isRtl ? 'rtl' : 'ltr', textAlign: isRtl ? 'right' : 'left' }}>
              
              {/* Product Image Carousel */}
              <div style={{
                width: '100%',
                aspectRatio: '1.2/1',
                background: '#18181b',
                borderRadius: '18px',
                overflow: 'hidden',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {previewImage ? (
                  <img src={previewImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Package size={48} style={{ color: '#3f3f46' }} />
                )}
                {/* Sale mode badge */}
                <span style={{
                  position: 'absolute',
                  top: 10,
                  left: isRtl ? 'auto' : 10,
                  right: isRtl ? 10 : 'auto',
                  background: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  fontSize: '0.7rem',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '6px',
                  fontWeight: 600
                }}>
                  {form.sell_mode}
                </span>
              </div>

              {/* Title & Info */}
              <div>
                <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 700, textTransform: 'uppercase' }}>
                  {categories.find(c => c.id === form.category_id)?.name || 'Category'}
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: '0.2rem 0' }}>{form.name || 'Item Name'}</h3>
                <p style={{ fontSize: '0.8rem', color: '#71717a', margin: '0 0 0.5rem 0' }}>{form.description || 'No description provided.'}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: '#a1a1aa', justifyContent: isRtl ? 'flex-start' : 'flex-start', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                  <Store size={14} style={{ color: '#3b82f6' }} /> <span style={{ fontWeight: 600 }}>Your Store</span>
                </div>
              </div>

              {/* Variants Picker */}
              {variants.length > 0 && (
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#a1a1aa', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                    {t('vendor_items.select_option_label')}
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                    {variants.map((v, i) => {
                      const isActive = i === previewActiveVarIdx
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setPreviewActiveVarIdx(i)}
                          style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: '12px',
                            border: `2px solid ${isActive ? '#3b82f6' : '#27272a'}`,
                            background: isActive ? 'rgba(59, 130, 246, 0.15)' : '#18181b',
                            color: isActive ? '#3b82f6' : '#d4d4d8',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            outline: 'none'
                          }}
                        >
                          {v.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Add to Cart Bar */}
              <div style={{
                background: '#18181b',
                padding: '0.75rem',
                borderRadius: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '0.5rem',
                flexDirection: isRtl ? 'row-reverse' : 'row'
              }}>
                <div style={{ textAlign: isRtl ? 'right' : 'left' }}>
                  <span style={{ fontSize: '0.7rem', color: '#71717a', display: 'block' }}>{t('vendor_items.price_label')}</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#4ade80' }}>₹{previewPrice}</span>
                </div>
                <button type="button" style={{
                  background: '#22c55e',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}>
                  {t('vendor_items.add_to_cart_button')}
                </button>
              </div>

            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
            <button type="button" onClick={() => setStep(4)} className="vp-btn vp-btn-outline" style={{ flex: 1 }}>{t('vendor_items.back_button')}</button>
            
            <div style={{ flex: 2, display: 'flex', gap: '0.5rem', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
              <button type="button" onClick={() => handleFinalSubmit('draft')} className="vp-btn vp-btn-outline" style={{ flex: 1, padding: '0.85rem 1rem' }} disabled={saving}>
                {saving ? t('vendor_items.saving_loading') : t('vendor_items.save_draft_button')}
              </button>
              <button type="button" onClick={() => handleFinalSubmit('published')} className="vp-btn vp-btn-primary" style={{ flex: 1.5, padding: '0.85rem 1rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }} disabled={saving || !isComplete} title={!isComplete ? 'Complete missing fields to publish' : ''}>
                <Check size={18} /> {saving ? t('vendor_items.publishing_loading') : t('vendor_items.publish_item_button')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VARIANT BOTTOM SHEET MODAL */}
      {isVarModalOpen && (
        <>
          <div
            onClick={() => setIsVarModalOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.6)',
              zIndex: 99,
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)'
            }}
          />
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: '#0c0c0e',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            borderTopLeftRadius: '32px',
            borderTopRightRadius: '32px',
            padding: '2rem 1.5rem 2.5rem 1.5rem',
            zIndex: 100,
            maxHeight: '85vh',
            overflowY: 'auto',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.4)',
            fontFamily: 'inherit',
            direction: isRtl ? 'rtl' : 'ltr'
          }}>
            <div style={{ maxWidth: '500px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                  {editingVarIndex !== null ? <Edit size={18} /> : <Plus size={18} />}
                  {editingVarIndex !== null ? t('vendor_items.edit_variant_option_title') : t('vendor_items.add_variant_option_title')}
                </h3>
                <button type="button" onClick={() => setIsVarModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.5rem', padding: '0.2rem' }}>×</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: isRtl ? 'right' : 'left' }}>
                
                {/* Variant image uploader */}
                <div className="vp-form-group">
                  <label className="vp-label">{t('vendor_items.variant_image_label')}</label>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 0.5rem 0' }}>{t('vendor_items.variant_image_desc')}</p>
                  <ImageUploader
                    shopId={shopId}
                    images={modalImageUrl ? [modalImageUrl] : []}
                    onChange={(urls) => setModalImageUrl(urls[0] || '')}
                    maxImages={1}
                  />
                </div>

                <div className="vp-form-group">
                  <label className="vp-label">{t('vendor_items.variant_name_label')}</label>
                  <input className="vp-input modal-highlight-input" value={modalLabel} required
                    onChange={e => handleModalLabelChange(e.target.value)}
                    placeholder={t('vendor_items.variant_name_placeholder')} />
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>{t('vendor_items.variant_name_desc')}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="vp-form-group">
                    <label className="vp-label">{t('vendor_items.detected_value_label')}</label>
                    <input className="vp-input" type="number" step="any" value={modalValue} readOnly
                      style={{ background: 'rgba(255,255,255,0.02)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '0.85rem 1rem', cursor: 'not-allowed' }} />
                  </div>
                  <div className="vp-form-group">
                    <label className="vp-label">{t('vendor_items.detected_unit_label')}</label>
                    <select className="vp-select" value={modalUnitId || ''} disabled
                      style={{ background: 'rgba(255,255,255,0.02)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', cursor: 'not-allowed' }}>
                      <option value="">{t('vendor_items.no_unit_option')}</option>
                      {units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>)}
                    </select>
                  </div>
                </div>

                <div className="vp-form-group">
                  <label className="vp-label">{t('vendor_items.variant_price_label')}</label>
                  <input className="vp-input modal-highlight-input" type="number" step="0.01" min="0" value={modalPrice} required
                    onChange={e => setModalPrice(e.target.value)} placeholder="0.00" />
                </div>

                <div className="vp-form-group" style={{ flexDirection: isRtl ? 'row-reverse' : 'row', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                  <input type="checkbox" id="modal-default" checked={modalIsDefault}
                    onChange={e => setModalIsDefault(e.target.checked)}
                    style={{ width: '1.1rem', height: '1.1rem', accentColor: '#3b82f6' }} />
                  <label className="vp-label" htmlFor="modal-default" style={{ cursor: 'pointer', margin: 0 }}>{t('vendor_items.set_as_default_option')}</label>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                  <button type="button" onClick={() => setIsVarModalOpen(false)} className="vp-btn vp-btn-outline" style={{ flex: 1 }}>{t('vendor_items.cancel_button')}</button>
                  <button type="button" onClick={saveVariantModal} className="vp-btn vp-btn-primary" style={{ flex: 1.5 }}>{t('vendor_items.save_option_button')}</button>
                </div>

              </div>
            </div>
          </div>
        </>
      )}

    </div>
  )
}
