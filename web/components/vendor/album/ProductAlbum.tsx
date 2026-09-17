'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Category, DemoItem, DemoSellConfig, DemoVariant, Unit, Item } from '@/types'
import AlbumHeader from './AlbumHeader'
import ProductCardArea from './ProductCardArea'
import ProductPriceEditor, { type VariantPriceItem } from './ProductPriceEditor'
import AvailabilityRating from './AvailabilityRating'
import AlbumNavigation from './AlbumNavigation'
import UnsavedChangesModal from './UnsavedChangesModal'
import CompletionView from './CompletionView'
import { AlertCircle } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/I18nContext'

interface ProductAlbumProps {
  shopId: string
  category: Category
  demoItems: DemoItem[]
  demoConfigs: DemoSellConfig[]
  demoVariants: DemoVariant[]
  units: Unit[]
  existingShopItems: Item[]
}

interface ProductFormState {
  name: string
  description: string
  customImage: string
  basePrice: string
  unitId: string
  variants: VariantPriceItem[]
  confidence: number
  isNotAvailable: boolean
}

export default function ProductAlbum({
  shopId,
  category,
  demoItems = [],
  demoConfigs = [],
  demoVariants = [],
  units = [],
  existingShopItems = []
}: ProductAlbumProps) {
  const router = useRouter()
  const { t, locale } = useTranslation()
  const supabase = createClient()

  // Track map of existing shop items keyed by demo_item_id
  const [shopItemsMap, setShopItemsMap] = useState<Map<string, Item>>(() => {
    const map = new Map<string, Item>()
    for (const it of existingShopItems) {
      if (it.demo_item_id) {
        map.set(it.demo_item_id, it)
      }
    }
    return map
  })

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavedJustNow, setIsSavedJustNow] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Unsaved changes modal state
  const [isDirty, setIsDirty] = useState(false)
  const [showUnsavedModal, setShowUnsavedModal] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  // Session counters
  const [skippedCount, setSkippedCount] = useState(0)

  // Current Demo Item
  const currentDemo = demoItems[currentIndex]
  const currentConfig = currentDemo
    ? demoConfigs.find((c) => c.demo_item_id === currentDemo.id)
    : null
  const currentVariants = currentDemo
    ? demoVariants.filter((v) => v.demo_item_id === currentDemo.id)
    : []
  const existingShopItem = currentDemo ? shopItemsMap.get(currentDemo.id) : null


  // Compute Initial Form State for a product
  const computeInitialFormState = useCallback(
    (demo: DemoItem, existing?: Item | null): ProductFormState => {
      const cfg = demoConfigs.find((c) => c.demo_item_id === demo.id)
      const vars = demoVariants.filter((v) => v.demo_item_id === demo.id)

      // Base Unit determination
      let resolvedUnitId = ''
      if (existing && existing.item_sell_config) {
        const sc = Array.isArray(existing.item_sell_config)
          ? existing.item_sell_config[0]
          : existing.item_sell_config
        if (sc?.base_unit_id) {
          resolvedUnitId = sc.base_unit_id
        }
      }
      if (!resolvedUnitId && (existing as any)?.unit_id) {
        resolvedUnitId = (existing as any).unit_id
      }
      if (!resolvedUnitId) {
        resolvedUnitId = demo.unit_id || cfg?.base_unit_id || ''
      }
      if (!resolvedUnitId || !units.some((u) => u.id === resolvedUnitId)) {
        const kgUnit = units.find((u) => u.symbol?.toLowerCase() === 'kg')
        resolvedUnitId = kgUnit ? kgUnit.id : units[0]?.id || ''
      }

      // Check if existing shop item has variants
      let resolvedVariants: VariantPriceItem[] = []
      const isWeightBased = demo.sell_mode?.toLowerCase() === 'manual'
      const isDynamic = demo.sell_mode?.toLowerCase() === 'dynamic'

      if (!isWeightBased) {
        if (existing && existing.item_variants && existing.item_variants.length > 0) {
          resolvedVariants = existing.item_variants.map((v) => {
            const u = units.find((un) => un.id === v.unit_id)
            return {
              id: v.id,
              label: v.label || 'Pack',
              price: v.price?.toString() ?? '',
              unitSymbol: u?.symbol || '',
              value: v.value ?? undefined,
              isDefault: v.is_default
            }
          })
        } else if (vars.length > 0) {
          resolvedVariants = vars.map((v) => {
            const u = units.find((un) => un.id === v.unit_id)
            return {
              id: v.id,
              label: v.label || 'Pack',
              price: v.price?.toString() ?? '',
              unitSymbol: u?.symbol || '',
              value: v.value ?? undefined,
              isDefault: v.is_default
            }
          })
        } else if (isDynamic) {
          const u = units.find((un) => un.id === (resolvedUnitId || demo.unit_id))
          const defDyn = ['Quarter', 'Half', 'Small', 'Large']
          resolvedVariants = defDyn.map((label) => ({
            label,
            price: '',
            unitSymbol: u?.symbol || '',
            value: label === 'Quarter' ? 0.25 : label === 'Half' ? 0.5 : label === 'Small' ? 1 : 2,
            isDefault: label === 'Small'
          }))
        }
      }

      // Base Price
      let basePriceVal = ''
      if (existing && existing.item_sell_config) {
        const sc = Array.isArray(existing.item_sell_config)
          ? existing.item_sell_config[0]
          : existing.item_sell_config
        if (sc?.price_per_base_unit != null) {
          basePriceVal = sc.price_per_base_unit.toString()
        }
      } else if (cfg?.price_per_base_unit != null) {
        basePriceVal = cfg.price_per_base_unit.toString()
      } else if (vars.length > 0 && vars[0].price != null) {
        basePriceVal = vars[0].price.toString()
      } else if (resolvedVariants.length === 1) {
        basePriceVal = resolvedVariants[0].price.toString()
      }

      // Availability Confidence & Not Available
      const confidenceVal =
        (existing as any)?.availability_confidence ??
        (existing as any)?.translations?.availability_confidence ??
        5
      const isNotAvail = existing ? !existing.is_active || existing.status === 'hidden' : false

      return {
        name: existing?.name || demo.name || '',
        description: existing?.description || '',
        customImage:
          existing?.image_url && existing.image_url !== demo.default_image
            ? existing.image_url
            : '',
        basePrice: basePriceVal,
        unitId: resolvedUnitId,
        variants: resolvedVariants,
        confidence: confidenceVal,
        isNotAvailable: isNotAvail
      }
    },
    [demoConfigs, demoVariants, units]
  )

  // Current Form State
  const [form, setForm] = useState<ProductFormState>(() => {
    if (!currentDemo) {
      return {
        name: '',
        description: '',
        customImage: '',
        basePrice: '',
        unitId: '',
        variants: [],
        confidence: 5,
        isNotAvailable: false
      }
    }
    return computeInitialFormState(currentDemo, existingShopItem)
  })

  // Whenever currentIndex changes, re-initialize form state
  useEffect(() => {
    if (currentDemo) {
      setForm(computeInitialFormState(currentDemo, shopItemsMap.get(currentDemo.id)))
      setIsDirty(false)
      setErrorMessage(null)
    }
  }, [currentIndex, currentDemo, computeInitialFormState, shopItemsMap])

  // Unit symbol helper
  const unitSymbol = React.useMemo(() => {
    const foundUnit = units.find((u) => u.id === form.unitId)
    if (foundUnit) return foundUnit.symbol
    if (!currentDemo) return 'kg'
    const unitId = currentDemo.unit_id || currentConfig?.base_unit_id
    const defUnit = units.find((u) => u.id === unitId)
    return defUnit ? defUnit.symbol : 'kg'
  }, [form.unitId, units, currentDemo, currentConfig])

  // Determine current item status for badge
  const currentItemStatus: 'not_added' | 'added' | 'not_available' = React.useMemo(() => {
    if (!existingShopItem) return 'not_added'
    if (!existingShopItem.is_active || existingShopItem.status === 'hidden') return 'not_available'
    return 'added'
  }, [existingShopItem])

  // Mark dirty on edits
  const handleNameChange = (val: string) => {
    setForm((prev) => ({ ...prev, name: val }))
    setIsDirty(true)
  }

  const handleDescriptionChange = (val: string) => {
    setForm((prev) => ({ ...prev, description: val }))
    setIsDirty(true)
  }

  const handleCustomImageChange = (url: string) => {
    setForm((prev) => ({ ...prev, customImage: url }))
    setIsDirty(true)
  }

  const handleBasePriceChange = (val: string) => {
    setForm((prev) => ({ ...prev, basePrice: val }))
    setIsDirty(true)
  }

  const handleUnitChange = (unitId: string) => {
    setForm((prev) => ({ ...prev, unitId }))
    setIsDirty(true)
  }

  const handleVariantPriceChange = (idx: number, val: string) => {
    setForm((prev) => {
      const updated = [...prev.variants]
      if (updated[idx]) {
        updated[idx] = { ...updated[idx], price: val }
      }
      return { ...prev, variants: updated }
    })
    setIsDirty(true)
  }

  const handleVariantLabelChange = (idx: number, val: string) => {
    setForm((prev) => {
      const updated = [...prev.variants]
      if (updated[idx]) {
        updated[idx] = { ...updated[idx], label: val }
      }
      return { ...prev, variants: updated }
    })
    setIsDirty(true)
  }

  const handleRemoveVariant = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== idx)
    }))
    setIsDirty(true)
  }

  const handleAddVariant = () => {
    setForm((prev) => {
      const nextNum = prev.variants.length + 1
      const label = prev.variants.length === 0 ? 'Regular' : `Pack ${nextNum}`
      return {
        ...prev,
        variants: [
          ...prev.variants,
          {
            label,
            price: '',
            unitSymbol,
            value: 1,
            isDefault: prev.variants.length === 0
          }
        ]
      }
    })
    setIsDirty(true)
  }

  const handleConfidenceChange = (stars: number) => {
    setForm((prev) => ({ ...prev, confidence: stars }))
    setIsDirty(true)
  }

  const handleToggleNotAvailable = (notAvailable: boolean) => {
    setForm((prev) => ({ ...prev, isNotAvailable: notAvailable }))
    setIsDirty(true)
  }

  // Navigation Safeguard: prompt if dirty
  const attemptNavigation = useCallback(
    (action: () => void) => {
      if (isDirty) {
        setPendingAction(() => action)
        setShowUnsavedModal(true)
      } else {
        action()
      }
    },
    [isDirty]
  )

  const handleDiscardChanges = () => {
    setShowUnsavedModal(false)
    setIsDirty(false)
    if (pendingAction) {
      pendingAction()
      setPendingAction(null)
    }
  }

  const handleStayEditing = () => {
    setShowUnsavedModal(false)
    setPendingAction(null)
  }

  // Navigation handlers
  const handlePrevious = useCallback(() => {
    attemptNavigation(() => {
      if (currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1)
      }
    })
  }, [attemptNavigation, currentIndex])

  const handleNext = useCallback(() => {
    attemptNavigation(() => {
      if (currentIndex < demoItems.length - 1) {
        setCurrentIndex((prev) => prev + 1)
      } else {
        setIsCompleted(true)
      }
    })
  }, [attemptNavigation, currentIndex, demoItems.length])

  const handleSkip = useCallback(() => {
    attemptNavigation(() => {
      setSkippedCount((c) => c + 1)
      if (currentIndex < demoItems.length - 1) {
        setCurrentIndex((prev) => prev + 1)
      } else {
        setIsCompleted(true)
      }
    })
  }, [attemptNavigation, currentIndex, demoItems.length])

  // Keyboard navigation listener (disabled while focused on inputs/textareas)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement
      const isInputActive =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl instanceof HTMLSelectElement ||
        activeEl?.getAttribute('contenteditable') === 'true'

      if (isInputActive) return

      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handlePrevious()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        handleNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlePrevious, handleNext])

  // Save product logic
  const handleSaveAndNext = async () => {
    if (!currentDemo) return
    if (!form.name.trim()) {
      setErrorMessage('Product name cannot be empty')
      return
    }

    setIsSaving(true)
    setErrorMessage(null)

    try {
      const targetImage = form.customImage || currentDemo.default_image || null
      const isPublished = !form.isNotAvailable
      const statusValue = isPublished ? 'published' : 'hidden'
      const basePriceNum = form.basePrice ? Number(form.basePrice) : 0
      const effectiveUnitId = form.unitId || currentDemo.unit_id || currentConfig?.base_unit_id || null

      let savedItemId = existingShopItem ? existingShopItem.id : null

      if (existingShopItem) {
        // UPDATE EXISTING SHOP ITEM
        const updatePayload: any = {
          name: form.name.trim(),
          description: form.description.trim() || null,
          image_url: targetImage,
          is_active: isPublished,
          status: statusValue,
          availability_confidence: form.confidence,
          updated_at: new Date().toISOString()
        }

        // Try updating with availability_confidence; fallback if column doesn't exist yet
        let { error: updateErr } = await supabase
          .from('items')
          .update(updatePayload)
          .eq('id', existingShopItem.id)

        if (updateErr && updateErr.message?.includes('availability_confidence')) {
          delete updatePayload.availability_confidence
          const fallbackRes = await supabase
            .from('items')
            .update(updatePayload)
            .eq('id', existingShopItem.id)
          if (fallbackRes.error) throw fallbackRes.error
        } else if (updateErr) {
          throw updateErr
        }

        // Upsert sell config with conflict resolution on item_id
        const scRaw = (existingShopItem as any).item_sell_config
        const existingConfigId = Array.isArray(scRaw) ? scRaw[0]?.id : scRaw?.id

        const sellConfigPayload: any = {
          ...(existingConfigId ? { id: existingConfigId } : {}),
          item_id: existingShopItem.id,
          sell_mode: (currentDemo.sell_mode || 'Manual') as any,
          base_unit_id: effectiveUnitId,
          price_per_base_unit: basePriceNum,
          allow_custom_quantity: currentConfig ? currentConfig.allow_custom_quantity : true,
          max_price_increase_percent: currentConfig?.max_price_increase_percent ?? 15,
          max_price_limit: currentConfig?.max_price_limit ?? 0
        }
        await supabase.from('item_sell_config').upsert(sellConfigPayload, { onConflict: 'item_id' })

        // Update variants if applicable
        if (form.variants.length > 0) {
          await supabase.from('item_variants').delete().eq('item_id', existingShopItem.id)
          const varPayload = form.variants.map((v, idx) => ({
            item_id: existingShopItem.id,
            variant_type: (currentDemo.sell_mode || 'Manual') as any,
            label: v.label,
            price: v.price ? Number(v.price) : 0,
            value: v.value ?? 1,
            unit_id: v.unit_id || effectiveUnitId,
            is_default: idx === 0 || !!v.isDefault,
            is_active: isPublished
          }))
          await supabase.from('item_variants').insert(varPayload)
        } else if (currentDemo.sell_mode === 'Manual') {
          await supabase.from('item_variants').delete().eq('item_id', existingShopItem.id)
          await supabase.from('item_variants').insert([
            {
              item_id: existingShopItem.id,
              variant_type: 'Manual',
              label: 'Default',
              unit_id: effectiveUnitId,
              value: 1,
              price: basePriceNum,
              is_default: true,
              is_active: isPublished
            }
          ])
        }
      } else {
        // CREATE NEW SHOP ITEM FROM DEMO ITEM
        const rpcPayload: any = {
          shop_id: shopId,
          category_id: category.id,
          demo_item_id: currentDemo.id,
          name: form.name.trim(),
          description: form.description.trim() || null,
          status: statusValue,
          is_active: isPublished,
          availability_confidence: form.confidence,
          has_variants: form.variants.length > 0,
          image_url: targetImage,
          images: targetImage ? [{ image_url: targetImage, is_primary: true, sort_order: 0 }] : [],
          sell_config: {
            sell_mode: currentDemo.sell_mode || 'Manual',
            base_unit_id: effectiveUnitId,
            price_per_base_unit: basePriceNum,
            allow_custom_quantity: currentConfig ? currentConfig.allow_custom_quantity : true,
            max_price_increase_percent: currentConfig?.max_price_increase_percent ?? 15,
            max_price_limit: currentConfig?.max_price_limit ?? 0
          },
          variants:
            form.variants.length > 0
              ? form.variants.map((v, idx) => ({
                  variant_type: currentDemo.sell_mode || 'Manual',
                  label: v.label,
                  unit_id: v.unit_id || effectiveUnitId,
                  value: v.value ?? 1,
                  price: v.price ? Number(v.price) : 0,
                  is_default: idx === 0 || !!v.isDefault,
                  is_active: isPublished
                }))
              : currentDemo.sell_mode === 'Manual'
              ? [
                  {
                    variant_type: 'Manual',
                    label: 'Default',
                    unit_id: effectiveUnitId,
                    value: 1,
                    price: basePriceNum,
                    is_default: true,
                    is_active: isPublished
                  }
                ]
              : []
        }

        const { data: rpcData, error: rpcErr } = await supabase.rpc(
          'create_shop_item_transaction',
          { payload: rpcPayload }
        )

        if (rpcErr) {
          // If RPC failed due to availability_confidence column or payload, retry without it
          if (rpcErr.message?.includes('availability_confidence')) {
            delete rpcPayload.availability_confidence
            const retryRes = await supabase.rpc('create_shop_item_transaction', {
              payload: rpcPayload
            })
            if (retryRes.error) throw retryRes.error
            savedItemId = retryRes.data?.item_id
          } else {
            throw rpcErr
          }
        } else {
          savedItemId = rpcData?.item_id
        }
      }

      // Update local state map so UI updates instantly
      if (savedItemId) {
        const scRaw = (existingShopItem as any)?.item_sell_config
        const existingConfigId = Array.isArray(scRaw) ? scRaw[0]?.id : scRaw?.id
        const updatedShopItem: Item = {
          id: savedItemId,
          shop_id: shopId,
          category_id: category.id,
          demo_item_id: currentDemo.id,
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          status: statusValue as any,
          is_active: isPublished,
          has_variants: form.variants.length > 0,
          image_url: targetImage || undefined,
          item_sell_config: [
            {
              id: existingConfigId || '',
              item_id: savedItemId,
              sell_mode: (currentDemo.sell_mode || 'Manual') as any,
              base_unit_id: effectiveUnitId,
              price_per_base_unit: basePriceNum,
              allow_custom_quantity: true,
              max_price_increase_percent: 15,
              max_price_limit: 0
            }
          ] as any,
          item_variants: form.variants.map((v, idx) => ({
            id: v.id || `var-${idx}`,
            item_id: savedItemId,
            variant_type: (currentDemo.sell_mode || 'Manual') as any,
            label: v.label,
            price: v.price ? Number(v.price) : 0,
            value: v.value ?? 1,
            unit_id: (v as any).unit_id || effectiveUnitId,
            is_default: idx === 0 || !!v.isDefault,
            is_active: isPublished
          })) as any,
          updated_at: new Date().toISOString()
        }
        setShopItemsMap((prev) => {
          const next = new Map(prev)
          next.set(currentDemo.id, updatedShopItem)
          return next
        })
      }

      // Show brief Saved indicator
      setIsSavedJustNow(true)
      setIsDirty(false)
      setTimeout(() => {
        setIsSavedJustNow(false)
      }, 1200)

      // Advance to next product or completion
      if (currentIndex < demoItems.length - 1) {
        setCurrentIndex((prev) => prev + 1)
      } else {
        setIsCompleted(true)
      }
    } catch (err: any) {
      console.error('Error saving product in album:', err)
      setErrorMessage(err.message || 'Couldn’t save changes. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // Back click handler
  const handleBackToCategories = (e: React.MouseEvent) => {
    e.preventDefault()
    attemptNavigation(() => {
      router.push(`/${locale}/vendor/catalog`)
    })
  }

  // If no demo items in category
  if (demoItems.length === 0) {
    return (
      <div style={{ maxWidth: 700, margin: '2rem auto', textAlign: 'center' }}>
        <AlbumHeader
          categoryName={category.name}
          categoryId={category.id}
          currentIndex={0}
          totalItems={0}
          itemStatus="not_added"
          onBackClick={handleBackToCategories}
        />
        <div
          className="vp-card"
          style={{ padding: '3rem', borderRadius: '20px', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <p style={{ color: 'var(--text-muted)' }}>
            {t('vendor_album.category_empty') || 'No products found in this category'}
          </p>
        </div>
      </div>
    )
  }

  // Completion View
  if (isCompleted) {
    const totalAdded = shopItemsMap.size
    return (
      <CompletionView
        categoryName={category.name}
        categoryId={category.id}
        addedCount={totalAdded}
        skippedCount={skippedCount}
        totalCount={demoItems.length}
        onReviewAgain={() => {
          setIsCompleted(false)
          setCurrentIndex(0)
        }}
      />
    )
  }

  return (
    <div style={{ maxWidth: 750, margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <AlbumHeader
        categoryName={category.name}
        categoryId={category.id}
        currentIndex={currentIndex}
        totalItems={demoItems.length}
        itemStatus={currentItemStatus}
        onBackClick={handleBackToCategories}
      />

      {/* Error Alert */}
      {errorMessage && (
        <div
          style={{
            marginBottom: '1.25rem',
            padding: '1rem',
            borderRadius: '14px',
            background: 'rgba(239, 68, 68, 0.12)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.92rem'
          }}
        >
          <AlertCircle size={20} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Album Card: Product Editor */}
      <div
        className="vp-card album-card"
        id="product-album-card"
      >
        {/* Product Image, Name, Description */}
        <ProductCardArea
          shopId={shopId}
          name={form.name}
          onNameChange={handleNameChange}
          description={form.description}
          onDescriptionChange={handleDescriptionChange}
          catalogImage={currentDemo.default_image || ''}
          customImage={form.customImage}
          onCustomImageChange={handleCustomImageChange}
        />

        {/* Simplest Possible Price Editor */}
        <ProductPriceEditor
          hasMultipleVariants={
            currentDemo.sell_mode?.toLowerCase() === 'manual' ? false : true
          }
          basePrice={form.basePrice}
          unitSymbol={unitSymbol}
          units={units}
          selectedUnitId={form.unitId}
          onUnitChange={handleUnitChange}
          onBasePriceChange={handleBasePriceChange}
          variants={form.variants}
          onVariantPriceChange={handleVariantPriceChange}
          onVariantLabelChange={handleVariantLabelChange}
          onRemoveVariant={handleRemoveVariant}
          onAddVariant={handleAddVariant}
        />

        {/* 5-Star Availability Confidence + Not Available Toggle */}
        <AvailabilityRating
          confidence={form.confidence}
          isNotAvailable={form.isNotAvailable}
          onConfidenceChange={handleConfidenceChange}
          onToggleNotAvailable={handleToggleNotAvailable}
        />

        {/* Navigation & Primary Action Buttons */}
        <AlbumNavigation
          isFirst={currentIndex === 0}
          isLast={currentIndex === demoItems.length - 1}
          isSaving={isSaving}
          isSavedJustNow={isSavedJustNow}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onSkip={handleSkip}
          onSaveAndNext={handleSaveAndNext}
        />
      </div>

      {/* Unsaved Changes Confirmation Modal */}
      <UnsavedChangesModal
        isOpen={showUnsavedModal}
        onStay={handleStayEditing}
        onDiscard={handleDiscardChanges}
      />
    </div>
  )
}
