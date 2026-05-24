'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Item, Category, DemoItem, Unit, DemoSellConfig, DemoVariant } from '@/types'
import { Package, Save, AlertCircle, ArrowRight, ArrowLeft, Plus, Trash2, Edit, Check, Eye } from 'lucide-react'
import ImageUploader from '@/components/ImageUploader'
import { parseVariantLabel } from '@/lib/utils/parser'

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

const CATEGORY_EMOJIS: Record<string, string> = {
  'Vegetables': '🥦',
  'Fruits': '🍎',
  'Dairy & Eggs': '🥛',
  'Dairy & Beverages': '🥛',
  'Grains & Pulses': '🌾',
  'Grocery': '🌾',
  'Spices': '🌶️',
  'Bakery': '🍞',
  'Oils': '🛢️',
  'Meat & Fish': '🥩',
  'Household Essentials': '🧹',
  'Stationery': '✏️',
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
  const isEdit = !!item
  const router = useRouter()

  // Steps: 1=Category, 2=Selling Style/Demo, 3=Details, 4=Variants, 5=Preview
  const [step, setStep] = useState(isEdit ? 3 : 1)

  const [form, setForm] = useState({
    name: item?.name ?? '',
    description: item?.description ?? '',
    category_id: item?.category_id ?? '',
    demo_item_id: item?.demo_item_id ?? '',
    sell_mode: (item?.item_sell_config && item.item_sell_config.length > 0 ? item.item_sell_config[0].sell_mode : 'Manual') as string,
    base_unit_id: (item?.item_sell_config && item.item_sell_config.length > 0 ? item.item_sell_config[0].base_unit_id : '') as string,
    price_per_base_unit: (item?.item_sell_config && item.item_sell_config.length > 0 ? item.item_sell_config[0].price_per_base_unit?.toString() : '') as string,
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
    } else {
      set('base_unit_id', demo.unit_id || '')
    }

    if (vars.length > 0) {
      setVariants(vars.map(v => ({
        variant_type: demo.sell_mode,
        label: v.label,
        unit_id: v.unit_id || demo.unit_id || '',
        value: v.value || '',
        price: v.price || '',
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

  // Variant Modal functions
  function openAddVariantModal() {
    if (variants.length >= 5) {
      setError('Maximum 5 variants allowed to prevent UI complexity.')
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
      setError('Variant name/label is required')
      return
    }
    if (!modalPrice || isNaN(Number(modalPrice)) || Number(modalPrice) < 0) {
      setError('Please provide a valid variant price')
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
      setError('Product Name is required')
      return
    }
    setSaving(true)
    setError(null)
    const supabase = createClient()

    try {
      if (isEdit) {
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
        if (variants.length > 0) {
          const varPayload = variants.map(v => ({
            item_id: item!.id,
            variant_type: form.sell_mode as any,
            label: v.label,
            unit_id: v.unit_id || null,
            value: v.value ? Number(v.value) : 1,
            price: v.price ? Number(v.price) : 0,
            min_value: null,
            max_value: null,
            is_default: v.is_default,
            is_active: v.is_active,
            image_url: v.image_url || null
          }))
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
          variants: variants.map(v => ({
            variant_type: v.variant_type,
            label: v.label,
            unit_id: v.unit_id || null,
            value: v.value ? Number(v.value) : 1,
            price: v.price ? Number(v.price) : 0,
            min_value: null,
            max_value: null,
            is_default: v.is_default,
            is_active: v.is_active,
            image_url: v.image_url || null
          }))
        }

        const { data: rpcData, error: rpcError } = await supabase.rpc('create_shop_item_transaction', { payload: rpcPayload })
        if (rpcError) throw rpcError

        // Update items.image_url with primary image
        if (rpcData?.item_id && images.length > 0) {
          const { error: urlUpdateError } = await supabase
            .from('items')
            .update({ image_url: images[0] })
            .eq('id', rpcData.item_id)
          if (urlUpdateError) console.error("Failed to update items.image_url:", urlUpdateError.message)
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

  return (
    <div className="vp-card" style={{ maxWidth: 800, margin: '0 auto', background: 'rgba(20,20,25,0.7)', border: '1px solid rgba(255,255,255,0.05)' }}>
      
      {/* Steps Indicator */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>
          <span>Step {currentStepNum} of {totalSteps}</span>
          <span style={{ color: '#fff' }}>
            {isEdit
              ? (step === 3 ? 'Basic Details' : step === 4 ? 'Variants & Pricing' : 'Customer Preview')
              : (step === 1 ? 'Select Category' : step === 2 ? 'Choose Selling Style' : step === 3 ? 'Basic Details' : step === 4 ? 'Variants & Pricing' : 'Customer Preview')}
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
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: '0 0 0.5rem 0' }}>Select Category</h2>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.95rem' }}>Select the category your item belongs to</p>
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
                <span style={{ fontSize: '2.5rem' }}>{CATEGORY_EMOJIS[c.name] ?? '📦'}</span>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff', textAlign: 'center', lineHeight: '1.2' }}>{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: LOAD FROM TEMPLATES */}
      {step === 2 && !isEdit && (
        <div className="vp-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: '0 0 0.25rem 0' }}>Load from Templates</h2>
              <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.95rem' }}>Select a template to quickly set up your item</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" onClick={() => setStep(1)} className="vp-btn vp-btn-outline vp-btn-sm" style={{ height: '38px', borderRadius: '10px' }}><ArrowLeft size={16}/> Back</button>
              <button type="button" onClick={skipDemo} className="vp-btn vp-btn-outline vp-btn-sm" style={{ height: '38px', borderRadius: '10px' }}>Skip to Custom</button>
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
                    textAlign: 'left'
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
              <p style={{ color: '#94a3b8', margin: '0 0 1.5rem 0', fontSize: '0.95rem' }}>No templates available for this category.</p>
              <button type="button" onClick={skipDemo} className="vp-btn vp-btn-primary">
                Create Custom Item
              </button>
            </div>
          )}
        </div>
      )}


      {/* STEP 3: BASIC DETAILS */}
      {step === 3 && (
        <div className="vp-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: '0 0 0.25rem 0' }}>
                {isEdit ? (
                  <span className="malayalam-text">ഉൽപ്പന്ന വിവരങ്ങൾ തിരുത്തുക</span>
                ) : (
                  <span className="malayalam-text">ഉൽപ്പന്ന വിവരങ്ങൾ നൽകുക</span>
                )}
              </h2>
              <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.95rem' }}>Enter basic details and upload images</p>
            </div>
            {!isEdit && <button type="button" onClick={() => setStep(2)} className="vp-btn vp-btn-outline vp-btn-sm"><ArrowLeft size={16}/> Back</button>}
          </div>

          <ImageUploader
            shopId={shopId}
            images={images}
            onChange={setImages}
            maxImages={4}
          />

          <div className="vp-form-group">
            <label className="vp-label" htmlFor="item-name">Product Name (<span className="malayalam-text">ഉൽപ്പന്നത്തിന്റെ പേര്</span>) *</label>
            <input id="item-name" className="vp-input" value={form.name} required
              onChange={e => set('name', e.target.value)} placeholder="e.g. നാടൻ തക്കാളി, പച്ചമുളക്"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '0.85rem 1rem' }} />
          </div>

          <div className="vp-form-group">
            <label className="vp-label" htmlFor="item-desc">Description (<span className="malayalam-text">വിവരണം - ഓപ്ഷണൽ</span>)</label>
            <textarea id="item-desc" className="vp-textarea" rows={3} value={form.description}
              onChange={e => set('description', e.target.value)} placeholder="വിശദാംശങ്ങൾ ഇവിടെ എഴുതുക..."
              style={{ resize: 'vertical', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '0.85rem 1rem' }} />
          </div>

          <div style={{ display: 'flex', gap: '1rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button type="button" className="vp-btn vp-btn-outline" onClick={() => router.back()} style={{ flex: 1 }}>Cancel</button>
            <button type="button" onClick={() => {
              if (form.name.trim()) {
                setStep(4)
              } else {
                setError('Product Name is required')
              }
            }} className="vp-btn vp-btn-primary" style={{ flex: 1.5 }}>
              Next: Variants & Pricing <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: VARIANTS AND PRICING */}
      {step === 4 && (
        <div className="vp-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: '0 0 0.25rem 0' }}>
                <span className="malayalam-text">വിലയും വകഭേദങ്ങളും നൽകുക</span>
              </h2>
              <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.95rem' }}>Set pricing options and create variants</p>
            </div>
            <button type="button" onClick={() => setStep(3)} className="vp-btn vp-btn-outline vp-btn-sm"><ArrowLeft size={16}/> Back</button>
          </div>

          {form.sell_mode !== 'Fixed' && (
            <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '24px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                Base Price (<span className="malayalam-text">അടിസ്ഥാന വില</span>)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="vp-form-group">
                  <label className="vp-label">Base Unit (<span className="malayalam-text">അളവ്</span>)</label>
                  <select className="vp-select" value={form.base_unit_id} onChange={e => handleBaseUnitChange(e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
                    <option value="">— Select Unit —</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>)}
                  </select>
                </div>
                <div className="vp-form-group">
                  <label className="vp-label">Price per Unit (<span className="malayalam-text">വില ₹</span>)</label>
                  <input type="number" step="0.01" min="0" className="vp-input" value={form.price_per_base_unit} onChange={e => handleBasePriceChange(e.target.value)} placeholder="0.00"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '0.85rem 1rem' }} />
                </div>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.75rem', marginInlineStart: '0.25rem' }}>
                <span className="malayalam-text">ഉദാഹരണം: 1kg ഉള്ളിക്ക് ₹40 രൂപ നിരക്ക് നൽകുക. ബാക്കി അളവുകൾ ഇതിനനുസരിച്ച് കണക്കാക്കാം.</span>
              </p>
            </div>
          )}

          <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '24px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff', margin: 0 }}>
                <span className="malayalam-text">ഉൽപ്പന്നത്തിന്റെ വകഭേദങ്ങൾ</span> (Variants)
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>{variants.length} / 5 Max</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {variants.map((v, idx) => (
                <div key={idx} style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: `2px solid ${v.is_default ? '#3b82f6' : 'rgba(255, 255, 255, 0.06)'}`,
                  borderRadius: '20px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="vp-badge" style={{
                      background: v.is_default ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.05)',
                      color: v.is_default ? '#60a5fa' : '#94a3b8',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      border: v.is_default ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(255,255,255,0.05)'
                    }}>{v.is_default ? 'DEFAULT' : 'VARIANT'}</span>

                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button type="button" onClick={() => openEditVariantModal(idx)} className="vp-btn vp-btn-outline vp-btn-sm" style={{ padding: '0.35rem', borderRadius: '8px', border: 'none' }} title="Edit">
                        <Edit size={14} />
                      </button>
                      <button type="button" onClick={() => removeVariant(idx)} className="vp-btn vp-btn-danger vp-btn-sm" style={{ padding: '0.35rem', borderRadius: '8px', border: 'none' }} title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ width: 44, height: 44, background: '#1e293b', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {v.image_url ? (
                        <img src={v.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Package size={20} style={{ color: '#64748b' }} />
                      )}
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 700, margin: 0, color: '#fff', fontSize: '0.95rem' }}>{v.label}</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#60a5fa', fontWeight: 700 }}>₹{v.price || '0.00'}</p>
                    </div>
                  </div>
                </div>
              ))}

              {variants.length < 5 && (
                <button type="button" onClick={openAddVariantModal} style={{
                  border: '2px dashed rgba(255,255,255,0.12)',
                  borderRadius: '20px',
                  background: 'rgba(0,0,0,0.1)',
                  height: '116px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  color: '#94a3b8',
                  outline: 'none'
                }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
                >
                  <Plus size={20} />
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Add Variant Option</span>
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button type="button" onClick={() => setStep(3)} className="vp-btn vp-btn-outline" style={{ flex: 1 }}>Back</button>
            <button type="button" onClick={() => {
              if (variants.length === 0 && form.sell_mode === 'Fixed') {
                setError('Pre-Packed (Fixed) sell mode requires at least 1 variant option')
              } else if (variants.length === 0 && (!form.base_unit_id || !form.price_per_base_unit)) {
                setError('Please configure base price/unit or add at least 1 variant option')
              } else {
                setStep(5)
                setError(null)
              }
            }} className="vp-btn vp-btn-primary" style={{ flex: 1.5 }}>
              Next: Customer Preview <Eye size={18} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: VISUAL CUSTOMER PREVIEW */}
      {step === 5 && (
        <div className="vp-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: '0 0 0.25rem 0' }}>
                <span className="malayalam-text">കസ്റ്റമർ കാണുന്ന രൂപം</span> (Preview)
              </h2>
              <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.95rem' }}>Verify item appearance before saving</p>
            </div>
            <button type="button" onClick={() => setStep(4)} className="vp-btn vp-btn-outline vp-btn-sm"><ArrowLeft size={16}/> Back</button>
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
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
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
                  left: 10,
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: '#a1a1aa' }}>
                  <span>🏪</span> <span style={{ fontWeight: 600 }}>Your Store</span>
                </div>
              </div>

              {/* Variants Picker */}
              {variants.length > 0 && (
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#a1a1aa', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                    <span className="malayalam-text">അളവ് തിരഞ്ഞെടുക്കുക</span> (Select Option)
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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
                marginTop: '0.5rem'
              }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#71717a', display: 'block' }}>Price</span>
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
                  Add to Cart
                </button>
              </div>

            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button type="button" onClick={() => setStep(4)} className="vp-btn vp-btn-outline" style={{ flex: 1 }}>Back</button>
            
            <div style={{ flex: 2, display: 'flex', gap: '0.5rem' }}>
              <button type="button" onClick={() => handleFinalSubmit('draft')} className="vp-btn vp-btn-outline" style={{ flex: 1, padding: '0.85rem 1rem' }} disabled={saving}>
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button type="button" onClick={() => handleFinalSubmit('published')} className="vp-btn vp-btn-primary" style={{ flex: 1.5, padding: '0.85rem 1rem' }} disabled={saving || !isComplete} title={!isComplete ? 'Complete missing fields to publish' : ''}>
                <Check size={18} /> {saving ? 'Publishing...' : 'Publish Item'}
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
            fontFamily: 'inherit'
          }}>
            <div style={{ maxWidth: '500px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  {editingVarIndex !== null ? '✏️ Edit Variant option' : '✨ Add Variant option'}
                </h3>
                <button type="button" onClick={() => setIsVarModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.5rem', padding: '0.2rem' }}>×</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* Variant image uploader */}
                <div className="vp-form-group">
                  <label className="vp-label">Variant Image (Optional)</label>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 0.5rem 0' }}>If not provided, the primary product image will be shown.</p>
                  <ImageUploader
                    shopId={shopId}
                    images={modalImageUrl ? [modalImageUrl] : []}
                    onChange={(urls) => setModalImageUrl(urls[0] || '')}
                    maxImages={1}
                  />
                </div>

                <div className="vp-form-group">
                  <label className="vp-label">Variant Name / Size *</label>
                  <input className="vp-input modal-highlight-input" value={modalLabel} required
                    onChange={e => handleModalLabelChange(e.target.value)}
                    placeholder="eg: name, 1kg" />
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>Type weight or quantity. We will auto-detect value and units!</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="vp-form-group">
                    <label className="vp-label">Detected Value</label>
                    <input className="vp-input" type="number" step="any" value={modalValue} readOnly
                      style={{ background: 'rgba(255,255,255,0.02)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '0.85rem 1rem', cursor: 'not-allowed' }} />
                  </div>
                  <div className="vp-form-group">
                    <label className="vp-label">Detected Unit</label>
                    <select className="vp-select" value={modalUnitId || ''} disabled
                      style={{ background: 'rgba(255,255,255,0.02)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', cursor: 'not-allowed' }}>
                      <option value="">— No Unit —</option>
                      {units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>)}
                    </select>
                  </div>
                </div>

                <div className="vp-form-group">
                  <label className="vp-label">Variant Price (₹) *</label>
                  <input className="vp-input modal-highlight-input" type="number" step="0.01" min="0" value={modalPrice} required
                    onChange={e => setModalPrice(e.target.value)} placeholder="0.00" />
                </div>

                <div className="vp-form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                  <input type="checkbox" id="modal-default" checked={modalIsDefault}
                    onChange={e => setModalIsDefault(e.target.checked)}
                    style={{ width: '1.1rem', height: '1.1rem', accentColor: '#3b82f6' }} />
                  <label className="vp-label" htmlFor="modal-default" style={{ cursor: 'pointer', margin: 0 }}>Set as default option shown to customers</label>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" onClick={() => setIsVarModalOpen(false)} className="vp-btn vp-btn-outline" style={{ flex: 1 }}>Cancel</button>
                  <button type="button" onClick={saveVariantModal} className="vp-btn vp-btn-primary" style={{ flex: 1.5 }}>Save Option</button>
                </div>

              </div>
            </div>
          </div>
        </>
      )}

    </div>
  )
}
