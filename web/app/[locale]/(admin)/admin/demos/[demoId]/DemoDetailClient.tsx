'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { DemoItem, DemoSellConfig, DemoVariant, Unit, SellMode } from '@/types'
import {
  Save, Plus, Trash2, Info, CheckCircle2, AlertCircle,
  Layers, Settings2, Package, Tag, Scale, Image as ImageIcon,
  UploadCloud, RefreshCw, X, ArrowLeft, Eye, ExternalLink,
  ShieldAlert, Sparkles, Check
} from 'lucide-react'
import {
  updateDemoDetailsAction,
  saveDemoConfigAction,
  saveDemoVariantsAction,
  deleteDemoTemplateAction,
  uploadDemoImageAction
} from './actions'

import { getCategoryColor, getCategoryEmoji } from '@/lib/catalog/categoryImages'

type CategoryOption = {
  id: string
  name: string
}

type Props = {
  demo: DemoItem
  initialConfig: DemoSellConfig | null
  initialVariants: DemoVariant[]
  units: Unit[]
  categories: CategoryOption[]
  initialMalayalam?: string
  locale?: string
  returnQuery?: string
}

export default function DemoDetailClient({
  demo,
  initialConfig,
  initialVariants,
  units,
  categories,
  initialMalayalam = '',
  locale = 'en',
  returnQuery = ''
}: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'details' | 'config' | 'variants'>('details')


  // Top Banner / Header state
  const [currentDemo, setCurrentDemo] = useState<DemoItem>(demo)
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null)

  function showToast(msg: string, isError = false) {
    setToastMessage({ text: msg, isError })
    setTimeout(() => setToastMessage(null), 3500)
  }

  // ─────────────────────────────────────────────────────────────
  // 1. TEMPLATE DETAILS & MEDIA STATE
  // ─────────────────────────────────────────────────────────────
  const [name, setName] = useState(demo.name)
  const [code, setCode] = useState(demo.code || '')
  const [categoryId, setCategoryId] = useState(demo.category_id || '')
  const [unitId, setUnitId] = useState(demo.unit_id || '')
  const [sellMode, setSellMode] = useState<SellMode>(demo.sell_mode)
  const [displayOrder, setDisplayOrder] = useState(demo.display_order?.toString() || '')
  const [malayalamName, setMalayalamName] = useState(initialMalayalam)
  const [defaultImage, setDefaultImage] = useState(demo.default_image || '')

  const [savingDetails, setSavingDetails] = useState(false)
  const [detailsMsg, setDetailsMsg] = useState({ type: '', text: '' })
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // ─────────────────────────────────────────────────────────────
  // 2. SELL CONFIG STATE
  // ─────────────────────────────────────────────────────────────
  const [config, setConfig] = useState<Partial<DemoSellConfig>>(initialConfig || {
    demo_item_id: demo.id,
    sell_mode: demo.sell_mode,
    base_unit_id: demo.unit_id || '',
    allow_custom_quantity: false,
    price_per_base_unit: 0,
    max_price_increase_percent: 0,
    max_price_limit: 0,
  })
  const [savingConfig, setSavingConfig] = useState(false)
  const [configMsg, setConfigMsg] = useState({ type: '', text: '' })

  // ─────────────────────────────────────────────────────────────
  // 3. VARIANTS STATE
  // ─────────────────────────────────────────────────────────────
  const [variants, setVariants] = useState<Partial<DemoVariant>[]>(initialVariants)
  const [savingVariants, setSavingVariants] = useState(false)
  const [variantsMsg, setVariantsMsg] = useState({ type: '', text: '' })

  // ─────────────────────────────────────────────────────────────
  // 4. DELETE MODAL STATE
  // ─────────────────────────────────────────────────────────────
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Activity calculation
  const hasImage = Boolean(defaultImage && defaultImage.trim().length > 5)
  const categoryObj = categories.find(c => c.id === categoryId)

  // ─────────────────────────────────────────────────────────────
  const [isDragging, setIsDragging] = useState(false)
  const dragCounterRef = useRef(0)

  // ─────────────────────────────────────────────────────────────
  // IMAGE UPLOAD & DRAG/DROP HANDLERS
  // ─────────────────────────────────────────────────────────────
  async function processImageFile(file: File) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setUploadError('Please drop or select a valid image file (PNG, JPG, WebP).')
      return
    }

    setUploadingImage(true)
    setUploadError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await uploadDemoImageAction(formData)
      if (!res.success || !res.publicUrl) {
        throw new Error(res.error || 'Failed to upload image')
      }

      setDefaultImage(res.publicUrl)
      showToast('Template image uploaded and applied successfully!')
    } catch (err: any) {
      console.error('Upload error:', err)
      setUploadError(err.message || 'Failed to upload image. You can also paste an image URL.')
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDropEvent(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current = 0
    setIsDragging(false)

    // 1. Check for dropped local file
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      if (file) {
        await processImageFile(file)
        return
      }
    }

    // 2. Check for dragged HTML image or web image URL
    const html = e.dataTransfer.getData('text/html')
    if (html) {
      const match = html.match(/src=["'](https?:\/\/[^"']+)["']/i)
      if (match && match[1]) {
        setDefaultImage(match[1])
        showToast('Image URL applied to template!')
        return
      }
    }

    const uri = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain')
    if (uri && (uri.startsWith('http://') || uri.startsWith('https://') || uri.startsWith('data:image/'))) {
      setDefaultImage(uri.trim())
      showToast('Image URL applied to template!')
      return
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) await processImageFile(file)
  }

  // ─────────────────────────────────────────────────────────────
  // SAVE TEMPLATE DETAILS & MEDIA
  // ─────────────────────────────────────────────────────────────
  async function saveDetails(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setDetailsMsg({ type: 'error', text: 'Product name cannot be blank.' })
      return
    }

    setSavingDetails(true)
    setDetailsMsg({ type: '', text: '' })

    const parsedOrder = displayOrder ? parseInt(displayOrder, 10) : null

    try {
      const res = await updateDemoDetailsAction({
        demoId: demo.id,
        locale: locale || 'en',
        name: name.trim(),
        code: code.trim() || null,
        category_id: categoryId || null,
        unit_id: unitId || null,
        sell_mode: sellMode,
        display_order: Number.isNaN(parsedOrder) ? null : parsedOrder,
        default_image: defaultImage.trim() || null,
        malayalamName: malayalamName.trim()
      })

      if (!res.success) {
        throw new Error(res.error || 'Failed to update template details.')
      }

      if (res.item) {
        setCurrentDemo(prev => ({
          ...prev,
          ...res.item
        }))
      }

      // Sync sellConfig sell_mode and base_unit_id
      setConfig(prev => ({
        ...prev,
        sell_mode: sellMode,
        base_unit_id: unitId
      }))

      setDetailsMsg({ type: 'success', text: 'Template details and media saved successfully.' })
      showToast('Template details updated!')
    } catch (err: any) {
      console.error('Error saving template details:', err)
      setDetailsMsg({ type: 'error', text: err.message || 'Failed to update template details.' })
    } finally {
      setSavingDetails(false)
    }
  }

  // ─────────────────────────────────────────────────────────────
  // SAVE SELL CONFIG
  // ─────────────────────────────────────────────────────────────
  async function saveConfig(e: React.FormEvent) {
    e.preventDefault()
    setSavingConfig(true)
    setConfigMsg({ type: '', text: '' })

    if (config.price_per_base_unit && config.price_per_base_unit < 0) {
      setConfigMsg({ type: 'error', text: 'Price per base unit cannot be negative.' })
      setSavingConfig(false)
      return
    }
    if (config.max_price_increase_percent && (config.max_price_increase_percent < 0 || config.max_price_increase_percent > 100)) {
      setConfigMsg({ type: 'error', text: 'Max price increase percent must be between 0 and 100.' })
      setSavingConfig(false)
      return
    }

    try {
      const res = await saveDemoConfigAction({
        demoId: demo.id,
        locale: locale || 'en',
        configId: config.id,
        sell_mode: sellMode,
        base_unit_id: config.base_unit_id || unitId || null,
        allow_custom_quantity: Boolean(config.allow_custom_quantity),
        price_per_base_unit: config.price_per_base_unit ? Number(config.price_per_base_unit) : 0,
        max_price_increase_percent: config.max_price_increase_percent ? Number(config.max_price_increase_percent) : null,
        max_price_limit: config.max_price_limit ? Number(config.max_price_limit) : null,
      })

      if (!res.success) {
        throw new Error(res.error || 'Failed to save configuration.')
      }

      if (res.config) {
        setConfig(res.config)
      }

      setConfigMsg({ type: 'success', text: 'Template configuration updated. Future vendor items will clone these defaults.' })
      showToast('Sell configuration saved!')
    } catch (err: any) {
      console.error('Error saving config:', err)
      setConfigMsg({ type: 'error', text: err.message || 'Failed to save configuration.' })
    } finally {
      setSavingConfig(false)
    }
  }

  // ─────────────────────────────────────────────────────────────
  // SAVE VARIANTS
  // ─────────────────────────────────────────────────────────────
  async function saveVariants() {
    setSavingVariants(true)
    setVariantsMsg({ type: '', text: '' })

    if (variants.some(v => !v.label?.trim())) {
      setVariantsMsg({ type: 'error', text: 'All variants must have a label (e.g. 500g, 1kg).' })
      setSavingVariants(false)
      return
    }
    if (variants.length > 12) {
      setVariantsMsg({ type: 'error', text: 'Maximum 12 pack variants allowed.' })
      setSavingVariants(false)
      return
    }

    try {
      const formattedVariants = variants.map(v => ({
        label: (v.label || '').trim(),
        unit_id: v.unit_id || unitId || null,
        value: v.value ? Number(v.value) : 1,
        price: v.price ? Number(v.price) : 0,
        is_default: Boolean(v.is_default),
        is_active: v.is_active ?? true
      }))

      const res = await saveDemoVariantsAction({
        demoId: demo.id,
        locale: locale || 'en',
        sellMode,
        defaultUnitId: unitId || null,
        variants: formattedVariants
      })

      if (!res.success) {
        throw new Error(res.error || 'Failed to save pack variants.')
      }

      if (res.variants) {
        setVariants(res.variants)
      }

      setVariantsMsg({ type: 'success', text: 'Template pack variants updated. New vendor items will offer these pack options.' })
      showToast('Pack variants updated!')
    } catch (err: any) {
      console.error('Error saving variants:', err)
      setVariantsMsg({ type: 'error', text: err.message || 'Failed to save variants.' })
    } finally {
      setSavingVariants(false)
    }
  }

  function addVariant() {
    if (variants.length >= 12) {
      setVariantsMsg({ type: 'error', text: 'Maximum 12 pack variants allowed.' })
      return
    }
    setVariants([...variants, {
      demo_item_id: demo.id,
      variant_type: sellMode,
      label: '',
      unit_id: unitId || '',
      value: 1,
      price: 0,
      is_default: variants.length === 0,
      is_active: true
    }])
    setVariantsMsg({ type: '', text: '' })
  }

  function updateVariant(index: number, key: string, val: any) {
    const newVars = [...variants]
    newVars[index] = { ...newVars[index], [key]: val }
    if (key === 'is_default' && val === true) {
      newVars.forEach((v, i) => {
        if (i !== index) v.is_default = false
      })
    }
    setVariants(newVars)
  }

  function removeVariant(index: number) {
    const newVars = variants.filter((_, i) => i !== index)
    if (newVars.length > 0 && !newVars.some(v => v.is_default)) {
      newVars[0].is_default = true
    }
    setVariants(newVars)
  }

  // ─────────────────────────────────────────────────────────────
  // DELETE BLUEPRINT TEMPLATE
  // ─────────────────────────────────────────────────────────────
  async function handleDeleteTemplate() {
    setDeleting(true)
    try {
      const res = await deleteDemoTemplateAction(demo.id, locale || 'en')
      if (!res.success) {
        throw new Error(res.error || 'Failed to delete template')
      }

      showToast('Template deleted successfully. Redirecting...')
      setTimeout(() => {
        router.push(`/${locale || 'en'}/admin/demos${returnQuery ? `?${returnQuery}` : ''}`)
        router.refresh()
      }, 700)
    } catch (err: any) {
      console.error('Error deleting template:', err)
      showToast('Failed to delete template: ' + err.message, true)
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  return (
    <div>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: toastMessage.isError ? '#7f1d1d' : '#064e3b',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 9999,
          fontWeight: 600,
          fontSize: '0.95rem'
        }}>
          {toastMessage.isError ? <AlertCircle size={20} color="#f87171" /> : <CheckCircle2 size={20} color="#34d399" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* TOP HERO CARD WITH ACTIVE STATE & DELETE BUTTON */}
      <div className="card" style={{
        padding: '20px 24px',
        marginBottom: '1.5rem',
        borderRadius: '16px',
        border: '1.5px solid var(--border-color, rgba(255,255,255,0.08))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.25rem',
        background: 'var(--bg-surface)'
      }}>
        {/* Left: Thumbnail & Title Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', minWidth: '280px' }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '14px',
            overflow: 'hidden',
            backgroundColor: '#f1f5f9',
            border: '2px solid var(--border-color, #cbd5e1)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            {defaultImage ? (
              <img
                src={defaultImage}
                alt={currentDemo.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80'
                }}
              />
            ) : (
              <Package size={32} style={{ opacity: 0.4, color: 'var(--text-muted)' }} />
            )}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-base)' }}>
                {currentDemo.name}
              </h1>
              {currentDemo.code && (
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: 'rgba(99, 102, 241, 0.15)',
                  color: '#6366f1'
                }}>
                  {currentDemo.code}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-muted, #f1f5f9)',
                color: 'var(--text-muted)'
              }}>
                {categoryObj?.name || 'Category'}
              </span>

              <span style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: sellMode === 'Manual' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                color: sellMode === 'Manual' ? '#2563eb' : '#059669'
              }}>
                {sellMode === 'Manual' ? '⚖️ By Weight' : '📦 Pre-Packed'}
              </span>

              {/* Activity Badge */}
              <span style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                padding: '2px 10px',
                borderRadius: '20px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: hasImage ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: hasImage ? '#059669' : '#d97706'
              }}>
                <span style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: hasImage ? '#10b981' : '#f59e0b'
                }} />
                {hasImage ? 'Active (Live)' : 'Draft (No Image)'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions (Back to Catalog & Delete Button) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => {
              router.push(`/${locale || 'en'}/admin/demos${returnQuery ? `?${returnQuery}` : ''}`)
            }}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              color: '#cbd5e1',
              border: '1.5px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              padding: '9px 16px',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Catalog</span>
          </button>

          <button
            id="delete-template-header-btn"
            onClick={() => setShowDeleteModal(true)}
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#dc2626',
              border: '1.5px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '10px',
              padding: '9px 16px',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background-color 0.15s ease'
            }}
          >
            <Trash2 size={16} />
            <span>Delete Template</span>
          </button>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
        marginBottom: '1.5rem',
        flexWrap: 'wrap'
      }}>
        <button
          id="tab-details"
          onClick={() => setActiveTab('details')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'details' ? '2px solid var(--wa-green-dark, #075e54)' : '2px solid transparent',
            color: activeTab === 'details' ? 'var(--wa-green-dark, #075e54)' : 'var(--text-muted)',
            fontWeight: activeTab === 'details' ? 700 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.95rem'
          }}
        >
          <Layers size={18} />
          <span>Template Details & Media</span>
        </button>

        <button
          id="tab-config"
          onClick={() => setActiveTab('config')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'config' ? '2px solid var(--wa-green-dark, #075e54)' : '2px solid transparent',
            color: activeTab === 'config' ? 'var(--wa-green-dark, #075e54)' : 'var(--text-muted)',
            fontWeight: activeTab === 'config' ? 700 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.95rem'
          }}
        >
          <Settings2 size={18} />
          <span>Sell Configuration</span>
        </button>

        <button
          id="tab-variants"
          onClick={() => setActiveTab('variants')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'variants' ? '2px solid var(--wa-green-dark, #075e54)' : '2px solid transparent',
            color: activeTab === 'variants' ? 'var(--wa-green-dark, #075e54)' : 'var(--text-muted)',
            fontWeight: activeTab === 'variants' ? 700 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.95rem'
          }}
        >
          <Package size={18} />
          <span>Pack Size Variants ({variants.length})</span>
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 1: TEMPLATE DETAILS & MEDIA                               */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'details' && (
        <div className="card" style={{ padding: '24px', borderRadius: '16px' }}>
          <form onSubmit={saveDetails} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {detailsMsg.text && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '10px',
                backgroundColor: detailsMsg.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                color: detailsMsg.type === 'error' ? '#dc2626' : '#059669',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {detailsMsg.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                <span>{detailsMsg.text}</span>
              </div>
            )}

            {/* SECTION: COVER IMAGE */}
            <div>
              <label className="form-label" style={{ fontWeight: 700, marginBottom: '8px', display: 'block', fontSize: '0.95rem' }}>
                Template Cover Photography
              </label>

              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                {/* Large Preview & Drag Drop Zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    e.dataTransfer.dropEffect = 'copy'
                    setIsDragging(true)
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    dragCounterRef.current += 1
                    setIsDragging(true)
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    dragCounterRef.current -= 1
                    if (dragCounterRef.current <= 0) {
                      dragCounterRef.current = 0
                      setIsDragging(false)
                    }
                  }}
                  onDrop={handleDropEvent}
                  style={{
                    width: '200px',
                    height: '140px',
                    borderRadius: '14px',
                    backgroundColor: isDragging ? 'rgba(16, 185, 129, 0.15)' : '#f1f5f9',
                    overflow: 'hidden',
                    border: isDragging ? '2px dashed #10b981' : '2px solid var(--border-color, #cbd5e1)',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.2s ease',
                    boxShadow: isDragging ? '0 0 15px rgba(16, 185, 129, 0.4)' : 'none'
                  }}
                >
                  {defaultImage ? (
                    <img
                      src={defaultImage}
                      alt={name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80'
                      }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', color: isDragging ? '#10b981' : 'var(--text-muted)', padding: '12px', pointerEvents: 'none' }}>
                      <ImageIcon size={32} style={{ opacity: isDragging ? 1 : 0.4, margin: '0 auto 4px' }} />
                      <span style={{ fontSize: '0.78rem', display: 'block', fontWeight: isDragging ? 700 : 500 }}>
                        {isDragging ? 'Drop here!' : 'No image assigned'}
                      </span>
                    </div>
                  )}

                  {uploadingImage && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: 'rgba(0,0,0,0.65)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      gap: 6,
                      pointerEvents: 'none'
                    }}>
                      <RefreshCw size={18} className="animate-spin" />
                      <span>Uploading...</span>
                    </div>
                  )}

                  {isDragging && !uploadingImage && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: 'rgba(16, 185, 129, 0.85)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      gap: 4,
                      pointerEvents: 'none'
                    }}>
                      <UploadCloud size={28} />
                      <span>Drop Image</span>
                    </div>
                  )}
                </div>

                {/* Upload, Drag & Drop, and URL Controls */}
                <div style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />

                  {/* Drag & Drop Area */}
                  <div
                    id="image-dropzone"
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      e.dataTransfer.dropEffect = 'copy'
                      setIsDragging(true)
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      dragCounterRef.current += 1
                      setIsDragging(true)
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      dragCounterRef.current -= 1
                      if (dragCounterRef.current <= 0) {
                        dragCounterRef.current = 0
                        setIsDragging(false)
                      }
                    }}
                    onDrop={handleDropEvent}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: isDragging ? '2px dashed #10b981' : '2px dashed var(--border-color, rgba(255,255,255,0.2))',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      backgroundColor: isDragging ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-muted, rgba(255,255,255,0.02))',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: isDragging ? '0 0 16px rgba(16, 185, 129, 0.25)' : 'none'
                    }}
                  >
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      backgroundColor: isDragging ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isDragging ? '#10b981' : '#3b82f6',
                      transition: 'all 0.2s ease',
                      pointerEvents: 'none'
                    }}>
                      <UploadCloud size={22} />
                    </div>
                    <div style={{ pointerEvents: 'none' }}>
                      <span style={{ fontSize: '0.92rem', fontWeight: 700, color: isDragging ? '#10b981' : 'var(--text-base)' }}>
                        {isDragging ? '⚡ Drop Image Here to Upload Instantly' : 'Drag & Drop Image Here, or Click to Browse'}
                      </span>
                      <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Drop local file or web image. Automatically uploads to storage & updates the input.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.85rem'
                      }}
                    >
                      <UploadCloud size={16} />
                      <span>{defaultImage ? 'Replace Image' : 'Choose File'}</span>
                    </button>

                    {defaultImage && (
                      <button
                        type="button"
                        onClick={() => setDefaultImage('')}
                        style={{
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          color: '#dc2626',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 14px',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Remove Image
                      </button>
                    )}
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Image Input (Populated automatically on drop / upload, or paste URL directly):
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Image URL appears here automatically on upload..."
                      value={defaultImage}
                      onChange={e => setDefaultImage(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        fontSize: '0.88rem',
                        border: '1.5px solid var(--border-color, #cbd5e1)'
                      }}
                    />
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Connected to Master Catalog Engine. Dropping or uploading immediately sets this URL input.
                    </p>
                  </div>

                  {uploadError && (
                    <p style={{ margin: 0, color: '#dc2626', fontSize: '0.82rem', fontWeight: 600 }}>{uploadError}</p>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION: NAMES & CODES */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 700, marginBottom: '6px', display: 'block' }}>
                  Canonical Product Name (English) *
                </label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. Turmeric Powder"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid var(--border-color, #cbd5e1)', fontSize: '0.95rem' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700, marginBottom: '6px', display: 'block' }}>
                  മലയാളം പേര് (Malayalam Translation)
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. മഞ്ഞൾപ്പൊടി"
                  value={malayalamName}
                  onChange={e => setMalayalamName(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid var(--border-color, #cbd5e1)', fontSize: '0.95rem' }}
                />
              </div>
            </div>

            {/* SECTION: CATEGORY, BASE UNIT, CODE */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 700, marginBottom: '6px', display: 'block' }}>
                  Category *
                </label>
                <select
                  className="form-input"
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: categoryObj ? `2px solid ${getCategoryColor(categoryObj.name)}` : '1.5px solid var(--border-color, #cbd5e1)',
                    fontSize: '0.92rem',
                    background: 'var(--bg-card, #1e293b)',
                    color: '#fff'
                  }}
                >
                  <option value="">Select Category</option>
                  {categories.map(c => {
                    const col = getCategoryColor(c.name)
                    const emo = getCategoryEmoji(c.name)
                    return (
                      <option key={c.id} value={c.id} style={{ color: col, background: '#1e293b' }}>
                        {emo} {c.name}
                      </option>
                    )
                  })}
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700, marginBottom: '6px', display: 'block' }}>
                  Default Base Unit *
                </label>
                <select
                  className="form-input"
                  value={unitId}
                  onChange={e => setUnitId(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid var(--border-color, #cbd5e1)', fontSize: '0.92rem' }}
                >
                  <option value="">Select Base Unit</option>
                  {units.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700, marginBottom: '6px', display: 'block' }}>
                  Master Blueprint Code
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. ANG-SPI-0022"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid var(--border-color, #cbd5e1)', fontSize: '0.92rem', fontFamily: 'monospace' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700, marginBottom: '6px', display: 'block' }}>
                  Display Order
                </label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 1"
                  value={displayOrder}
                  onChange={e => setDisplayOrder(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid var(--border-color, #cbd5e1)', fontSize: '0.92rem' }}
                />
              </div>
            </div>

            {/* SECTION: SELLING MODE PILLS */}
            <div>
              <label className="form-label" style={{ fontWeight: 700, marginBottom: '8px', display: 'block' }}>
                Selling Mode Blueprint
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                {[
                  { mode: 'Fixed' as SellMode, label: 'Pre-Packed (Fixed)', icon: '📦', desc: 'Pre-packaged products sold at fixed pack sizes (g, ml, pack).' },
                  { mode: 'Manual' as SellMode, label: 'By Weight (Manual)', icon: '⚖️', desc: 'Sold by weight (kg/g) measured by vendor scale at fulfillment.' },
                  { mode: 'Dynamic' as SellMode, label: 'Dynamic Pricing', icon: '⚡', desc: 'Price determined dynamically by variable weight calculations.' },
                  { mode: 'Portion' as SellMode, label: 'Cut Portion / Size', icon: '🍰', desc: 'Sold in slices, portions, halves, or quarter pieces.' },
                ].map(item => {
                  const isSelected = sellMode === item.mode
                  return (
                    <div
                      key={item.mode}
                      onClick={() => setSellMode(item.mode)}
                      style={{
                        padding: '14px',
                        borderRadius: '12px',
                        border: isSelected ? '2px solid var(--wa-green-dark, #075e54)' : '1.5px solid var(--border-color, #cbd5e1)',
                        backgroundColor: isSelected ? 'rgba(7, 94, 84, 0.06)' : 'var(--bg-muted, #f8fafc)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                        <span style={{ fontWeight: 700, fontSize: '0.92rem', color: isSelected ? 'var(--wa-green-dark, #075e54)' : 'var(--text-base)' }}>
                          {item.label}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                        {item.desc}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* SAVE BUTTON */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-color, #e2e8f0)' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={savingDetails || uploadingImage}
                style={{
                  backgroundColor: 'var(--wa-green-dark, #075e54)',
                  color: '#ffffff',
                  padding: '10px 24px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(7, 94, 84, 0.25)',
                  cursor: 'pointer',
                  border: 'none'
                }}
              >
                <Save size={18} />
                <span>{savingDetails ? 'Saving Changes...' : 'Save Template Details & Media'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 2: SELL CONFIGURATION                                     */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'config' && (
        <div>
          {/* Blueprint Architecture Info Box */}
          <div style={{
            padding: '1.25rem',
            borderRadius: '12px',
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            marginBottom: '1.5rem',
            display: 'flex',
            gap: '1rem',
            alignItems: 'flex-start'
          }}>
            <Info size={22} style={{ color: '#3b82f6', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ margin: '0 0 0.4rem 0', color: '#60a5fa', fontSize: '0.95rem', fontWeight: 700 }}>
                Master Blueprint Architecture
              </h4>
              <p style={{ margin: 0, color: 'var(--text-muted, #94a3b8)', fontSize: '0.85rem', lineHeight: '1.5' }}>
                Settings configured here serve as the <strong>master baseline</strong> for vendor onboarding. When a vendor adds this product to their shop catalog, the system creates an <strong>isolated clone</strong> with its own unique primary key. Modifying these blueprint defaults will never retroactively overwrite or tamper with live vendor inventory.
              </p>
            </div>
          </div>

          <div className="card" style={{ padding: '24px', borderRadius: '16px' }}>
            <form onSubmit={saveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {configMsg.text && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  backgroundColor: configMsg.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                  color: configMsg.type === 'error' ? '#dc2626' : '#059669',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {configMsg.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                  <span>{configMsg.text}</span>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700, marginBottom: '6px', display: 'block' }}>
                    Base Unit for Pricing
                  </label>
                  <select
                    className="form-input"
                    value={config.base_unit_id || ''}
                    onChange={e => setConfig({ ...config, base_unit_id: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid var(--border-color, #cbd5e1)' }}
                  >
                    <option value="">Select Unit</option>
                    {units.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 700, marginBottom: '6px', display: 'block' }}>
                    Baseline Reference Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="e.g. 0.00"
                    value={config.price_per_base_unit || ''}
                    onChange={e => setConfig({ ...config, price_per_base_unit: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid var(--border-color, #cbd5e1)' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Leave 0 for vendor-determined pricing.</span>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 700, marginBottom: '6px', display: 'block' }}>
                    Max Price Increase (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    placeholder="e.g. 20"
                    value={config.max_price_increase_percent || ''}
                    onChange={e => setConfig({ ...config, max_price_increase_percent: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid var(--border-color, #cbd5e1)' }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 700, marginBottom: '6px', display: 'block' }}>
                    Max Price Ceiling Limit (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="e.g. 500"
                    value={config.max_price_limit || ''}
                    onChange={e => setConfig({ ...config, max_price_limit: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid var(--border-color, #cbd5e1)' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={config.allow_custom_quantity || false}
                    onChange={e => setConfig({ ...config, allow_custom_quantity: e.target.checked })}
                    style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--wa-green-dark, #075e54)' }}
                  />
                  <span>Allow customers to request custom fractional quantities (e.g. 350g)</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid var(--border-color, #e2e8f0)' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingConfig}
                  style={{
                    backgroundColor: 'var(--wa-green-dark, #075e54)',
                    color: '#ffffff',
                    padding: '10px 24px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Save size={18} />
                  <span>{savingConfig ? 'Saving...' : 'Save Sell Configuration'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 3: PACK SIZE VARIANTS                                     */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'variants' && (
        <div className="card" style={{ padding: '24px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: 800 }}>
                Master Pack Size Variants
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Define recommended standard pack sizes (e.g. 50g, 100g, 250g, 500g, 1kg) available when vendors adopt this template.
              </p>
            </div>

            <button
              id="add-variant-btn"
              type="button"
              className="btn btn-sm btn-outline"
              onClick={addVariant}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, borderRadius: '8px', padding: '8px 14px' }}
            >
              <Plus size={16} /> Add Pack Variant
            </button>
          </div>

          {variantsMsg.text && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '10px',
              backgroundColor: variantsMsg.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              color: variantsMsg.type === 'error' ? '#dc2626' : '#059669',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '1rem'
            }}>
              {variantsMsg.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
              <span>{variantsMsg.text}</span>
            </div>
          )}

          {variants.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', backgroundColor: 'var(--bg-muted, #f8fafc)', borderRadius: '12px' }}>
              <Package size={40} style={{ opacity: 0.4, margin: '0 auto 8px' }} />
              <p style={{ fontWeight: 700, margin: '0 0 4px 0' }}>No pack size variants defined</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>Click below to add standard pack offerings for this master item.</p>
              <button className="btn btn-primary" onClick={addVariant} style={{ backgroundColor: 'var(--wa-green-dark, #075e54)' }}>
                Add First Variant
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {variants.map((v, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr)) 44px',
                    gap: '10px',
                    alignItems: 'center',
                    padding: '12px 16px',
                    backgroundColor: 'var(--bg-muted, #f8fafc)',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color, #e2e8f0)'
                  }}
                >
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 2 }}>
                      Variant Label *
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 500g"
                      value={v.label || ''}
                      onChange={e => updateVariant(idx, 'label', e.target.value)}
                      style={{ width: '100%', padding: '6px 10px', fontSize: '0.88rem', borderRadius: 6 }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 2 }}>
                      Quantity Value
                    </label>
                    <input
                      type="number"
                      step="any"
                      className="form-input"
                      placeholder="e.g. 500"
                      value={v.value || ''}
                      onChange={e => updateVariant(idx, 'value', parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', padding: '6px 10px', fontSize: '0.88rem', borderRadius: 6 }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 2 }}>
                      Unit
                    </label>
                    <select
                      className="form-input"
                      value={v.unit_id || ''}
                      onChange={e => updateVariant(idx, 'unit_id', e.target.value)}
                      style={{ width: '100%', padding: '6px 10px', fontSize: '0.88rem', borderRadius: 6 }}
                    >
                      <option value="">Select Unit</option>
                      {units.map(u => (
                        <option key={u.id} value={u.id}>{u.symbol}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 2 }}>
                      Ref Price (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      placeholder="0.00"
                      value={v.price || ''}
                      onChange={e => updateVariant(idx, 'price', parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', padding: '6px 10px', fontSize: '0.88rem', borderRadius: 6 }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 16 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input
                        type="radio"
                        name="default_variant"
                        checked={v.is_default || false}
                        onChange={() => updateVariant(idx, 'is_default', true)}
                      />
                      <span>Default</span>
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeVariant(idx)}
                    title="Remove Variant"
                    style={{
                      marginTop: 14,
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      padding: 6,
                      borderRadius: 6
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid var(--border-color, #e2e8f0)', marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={saveVariants}
                  disabled={savingVariants}
                  style={{
                    backgroundColor: 'var(--wa-green-dark, #075e54)',
                    color: '#ffffff',
                    padding: '10px 24px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Save size={18} />
                  <span>{savingVariants ? 'Saving...' : 'Save Pack Variants'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* DELETE CONFIRMATION MODAL                                     */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-surface, #ffffff)',
            borderRadius: '18px',
            width: '100%',
            maxWidth: '480px',
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            border: '1.5px solid rgba(239, 68, 68, 0.3)'
          }}>
            <div style={{ width: 50, height: 50, borderRadius: 12, backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <ShieldAlert size={28} />
            </div>

            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-base)' }}>
              Delete Blueprint Template?
            </h3>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5, margin: '0 0 20px 0' }}>
              Are you sure you want to permanently delete <strong>&quot;{currentDemo.name}&quot;</strong> ({currentDemo.code || 'No Code'})?
              This will remove the blueprint template, sell configurations, and default pack sizes.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                style={{ borderRadius: 8, padding: '9px 18px', fontWeight: 600 }}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteTemplate}
                disabled={deleting}
                style={{
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '9px 20px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Trash2 size={16} />
                <span>{deleting ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
