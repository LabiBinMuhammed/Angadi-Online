'use client'

import { useState, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Plus,
  Trash2,
  Settings,
  Search,
  X,
  Filter,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Package,
  Carrot,
  Apple,
  Milk,
  Wheat,
  Flame,
  Croissant,
  GlassWater,
  Fish,
  Sparkles,
  PenTool,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react'
import Link from 'next/link'
import { findCatalogProduct } from '@/lib/catalog/brandRegistry'
import { uploadDemoImageAction } from './[demoId]/actions'

export type Demo = {
  id: string
  name: string
  sell_mode: string
  category_id?: string | null
  unit_id?: string | null
  code?: string | null
  default_image?: string | null
  display_order?: number | null
}

export type Category = {
  id: string
  name: string
  is_active?: boolean
}

export type Unit = {
  id: string
  name: string
  symbol: string
}

const SELL_MODES = [
  { value: 'All', label: 'All Types' },
  { value: 'Manual', label: 'Manual (By Weight ⚖️)' },
  { value: 'Fixed', label: 'Packed (Pre-Packed 📦)' },
  { value: 'Dynamic', label: 'Dynamic (Size-based)' },
  { value: 'Portion', label: 'Portion (By Piece 🔪)' }
]

const ACTIVITY_MODES = [
  { value: 'All', label: 'All Activity' },
  { value: 'WithImage', label: 'With Image (Active 🖼️)' },
  { value: 'NoImage', label: 'Missing Image (Draft ⚠️)' }
]

function renderCategoryIcon(name: string, size = 16) {
  const n = (name || '').toLowerCase()
  if (n.includes('veg') || n.includes('produce')) return <Carrot size={size} />
  if (n.includes('fruit')) return <Apple size={size} />
  if (n.includes('dairy') || n.includes('milk')) return <Milk size={size} />
  if (n.includes('grain') || n.includes('cereal') || n.includes('rice')) return <Wheat size={size} />
  if (n.includes('spice')) return <Flame size={size} />
  if (n.includes('bakery') || n.includes('bread')) return <Croissant size={size} />
  if (n.includes('oil')) return <GlassWater size={size} />
  if (n.includes('meat') || n.includes('fish')) return <Fish size={size} />
  if (n.includes('household') || n.includes('essentials') || n.includes('clean')) return <Sparkles size={size} />
  if (n.includes('stationery') || n.includes('pen')) return <PenTool size={size} />
  return <Package size={size} />
}

export default function DemoManagementClient({
  demos: initial,
  categories,
  units,
  locale = 'en'
}: {
  demos: Demo[]
  categories: Category[]
  units: Unit[]
  locale?: string
}) {
  const [demos, setDemos] = useState(initial)
  const [showAddForm, setShowAddForm] = useState(false)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')

  // Search and Filters State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedSellMode, setSelectedSellMode] = useState('All')
  const [selectedUnit, setSelectedUnit] = useState('All')
  const [selectedActivity, setSelectedActivity] = useState('All')

  // Pagination State
  const [pageSize, setPageSize] = useState<number>(24)
  const [currentPage, setCurrentPage] = useState<number>(1)

  // Add Form State
  const [form, setForm] = useState({
    name: '',
    sell_mode: 'Fixed',
    category_id: '',
    unit_id: '',
    default_image: '',
    code: ''
  })
  const [saving, setSaving] = useState(false)
  const [addErr, setAddErr] = useState('')
  const [uploadingNewImage, setUploadingNewImage] = useState(false)
  const [isDraggingNew, setIsDraggingNew] = useState(false)
  const newDragCounterRef = useRef(0)
  const newFileInputRef = useRef<HTMLInputElement | null>(null)

  async function processNewImageFile(file: File) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setAddErr('Please drop or select a valid image file (PNG, JPG, WebP).')
      return
    }
    setUploadingNewImage(true)
    setAddErr('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('prefix', 'demos')

      const res = await uploadDemoImageAction(formData)
      if (!res.success || !res.publicUrl) {
        throw new Error(res.error || 'Failed to upload image.')
      }

      setForm(f => ({ ...f, default_image: res.publicUrl }))
    } catch (err: any) {
      console.error('Error uploading image:', err)
      setAddErr(err.message || 'Failed to upload image.')
    } finally {
      setUploadingNewImage(false)
      if (newFileInputRef.current) newFileInputRef.current.value = ''
    }
  }

  async function handleNewDropEvent(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    newDragCounterRef.current = 0
    setIsDraggingNew(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      if (file) {
        await processNewImageFile(file)
        return
      }
    }

    // 2. Check for dragged HTML image or web image URL
    const html = e.dataTransfer.getData('text/html')
    if (html) {
      const match = html.match(/src=["'](https?:\/\/[^"']+)["']/i)
      if (match && match[1]) {
        setForm(f => ({ ...f, default_image: match[1] }))
        return
      }
    }

    const uri = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain')
    if (uri && (uri.startsWith('http://') || uri.startsWith('https://') || uri.startsWith('data:image/'))) {
      setForm(f => ({ ...f, default_image: uri.trim() }))
    }
  }

  const catMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c.name])), [categories])
  const unitMap = useMemo(() => Object.fromEntries(units.map(u => [u.id, u.symbol || u.name])), [units])

  // Filtered Demos
  const filteredDemos = useMemo(() => {
    return demos.filter(d => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const qTokens = q.split(/\s+/).filter(Boolean)
        const dName = d.name.toLowerCase()
        const dCode = (d.code || '').toLowerCase()
        const dCat = (d.category_id ? catMap[d.category_id] || '' : '').toLowerCase()
        const dUnit = (d.unit_id ? unitMap[d.unit_id] || '' : '').toLowerCase()

        // Brand Registry lookup for aliases/brands
        const reg = findCatalogProduct(d.name)
        const regMal = (reg?.malayalam || '').toLowerCase()
        const regAliases = (reg?.aliases || []).map(a => a.toLowerCase())
        const regBrands = (reg?.brands || []).map(b => b.toLowerCase())

        const matches = qTokens.every(tok =>
          dName.includes(tok) ||
          dCode.includes(tok) ||
          dCat.includes(tok) ||
          dUnit.includes(tok) ||
          regMal.includes(tok) ||
          regAliases.some(a => a.includes(tok)) ||
          regBrands.some(b => b.includes(tok))
        )
        if (!matches) return false
      }

      // 2. Category Filter
      if (selectedCategory !== 'All' && d.category_id !== selectedCategory) {
        return false
      }

      // 3. Sell Mode / Type Filter
      if (selectedSellMode !== 'All' && d.sell_mode !== selectedSellMode) {
        return false
      }

      // 4. Unit Filter
      if (selectedUnit !== 'All' && d.unit_id !== selectedUnit) {
        return false
      }

      // 5. Activity Filter
      if (selectedActivity === 'WithImage' && !d.default_image) {
        return false
      }
      if (selectedActivity === 'NoImage' && d.default_image) {
        return false
      }

      return true
    })
  }, [demos, searchQuery, selectedCategory, selectedSellMode, selectedUnit, selectedActivity, catMap, unitMap])

  // Pagination calculation
  const totalItems = filteredDemos.length
  const totalPages = pageSize === 0 ? 1 : Math.ceil(totalItems / pageSize)
  const paginatedDemos = useMemo(() => {
    if (pageSize === 0) return filteredDemos
    const start = (currentPage - 1) * pageSize
    return filteredDemos.slice(start, start + pageSize)
  }, [filteredDemos, currentPage, pageSize])

  // Reset page when filters change
  function handleFilterChange<T>(setter: (val: T) => void, val: T) {
    setter(val)
    setCurrentPage(1)
  }

  function resetAllFilters() {
    setSearchQuery('')
    setSelectedCategory('All')
    setSelectedSellMode('All')
    setSelectedUnit('All')
    setSelectedActivity('All')
    setCurrentPage(1)
  }

  const isFiltered = Boolean(
    searchQuery.trim() ||
    selectedCategory !== 'All' ||
    selectedSellMode !== 'All' ||
    selectedUnit !== 'All' ||
    selectedActivity !== 'All'
  )

  async function addDemo() {
    if (!form.name.trim()) { setAddErr('Item name is required.'); return }
    setSaving(true)
    setAddErr('')
    const supabase = createClient()
    const { data, error } = await supabase
      .from('demo_items')
      .insert({
        name: form.name.trim(),
        sell_mode: form.sell_mode,
        category_id: form.category_id || null,
        unit_id: form.unit_id || null,
        default_image: form.default_image.trim() || null,
        code: form.code.trim() || null
      })
      .select('id, name, sell_mode, default_image, category_id, unit_id, code, display_order')
      .single()
    setSaving(false)
    if (error) { setAddErr(error.message); return }
    if (data) {
      setDemos(prev => [data as Demo, ...prev])
      setForm({ name: '', sell_mode: 'Fixed', category_id: '', unit_id: '', default_image: '', code: '' })
      setShowAddForm(false)
    }
  }

  async function deleteDemo(id: string, name: string) {
    if (!window.confirm(`Delete demo template "${name}"?\n\nThis will remove the master template configuration.`)) return
    const supabase = createClient()
    const { error } = await supabase.from('demo_items').delete().eq('id', id)
    if (!error) {
      setDemos(prev => prev.filter(d => d.id !== id))
    } else {
      alert(`Could not delete: ${error.message}`)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '3rem' }}>
      {/* ─── Top Controls & Header ─── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: 'rgba(59,130,246,0.15)',
              color: '#60a5fa'
            }}>
              <Package size={18} />
            </span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              Master Catalog Templates
            </h2>
            <span style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              padding: '0.2rem 0.6rem',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.08)',
              color: '#94a3b8'
            }}>
              {totalItems} {totalItems === 1 ? 'item' : 'items'}
            </span>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: '0.35rem 0 0 0' }}>
            Manage the centralized Kerala-first master product catalog and pre-packed variants.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {/* View Mode Toggle */}
          <div style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '3px',
            border: '1px solid rgba(255,255,255,0.08)'
          }}>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              title="Cards Grid View"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.4rem 0.75rem',
                borderRadius: '9px',
                fontSize: '0.82rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: viewMode === 'cards' ? '#3b82f6' : 'transparent',
                color: viewMode === 'cards' ? '#fff' : '#94a3b8',
                transition: 'all 0.2s ease'
              }}
            >
              <LayoutGrid size={15} /> Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              title="List View"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.4rem 0.75rem',
                borderRadius: '9px',
                fontSize: '0.82rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: viewMode === 'table' ? '#3b82f6' : 'transparent',
                color: viewMode === 'table' ? '#fff' : '#94a3b8',
                transition: 'all 0.2s ease'
              }}
            >
              <List size={15} /> Table
            </button>
          </div>

          {/* Add Template Button */}
          <button
            type="button"
            onClick={() => setShowAddForm(prev => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.55rem 1.1rem',
              borderRadius: '12px',
              fontSize: '0.88rem',
              fontWeight: 700,
              background: showAddForm ? 'rgba(255,255,255,0.1)' : '#10b981',
              color: '#fff',
              border: showAddForm ? '1px solid rgba(255,255,255,0.2)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {showAddForm ? <X size={16} /> : <Plus size={16} />}
            {showAddForm ? 'Close Form' : 'New Template'}
          </button>
        </div>
      </div>

      {/* ─── Add New Template Form Drawer ─── */}
      {showAddForm && (
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '18px',
          padding: '1.25rem',
          backdropFilter: 'blur(10px)',
          animation: 'fadeIn 0.2s ease'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: '0 0 0.85rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} style={{ color: '#10b981' }} /> Create Master Demo Item
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Product Name *</label>
              <input
                id="demo-name"
                className="form-input"
                placeholder="e.g. Turmeric Powder"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                style={{ width: '100%', height: '38px', borderRadius: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0 0.75rem', fontSize: '0.88rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Selling Type *</label>
              <select
                id="demo-sell-mode"
                className="form-input"
                value={form.sell_mode}
                onChange={e => setForm(f => ({ ...f, sell_mode: e.target.value }))}
                style={{ width: '100%', height: '38px', borderRadius: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0 0.75rem', fontSize: '0.88rem' }}
              >
                <option value="Fixed">Packed (Pre-Packed)</option>
                <option value="Manual">Manual (By Weight)</option>
                <option value="Dynamic">Dynamic (Size-based)</option>
                <option value="Portion">Portion (By Piece)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Category</label>
              <select
                id="demo-category"
                className="form-input"
                value={form.category_id}
                onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                style={{ width: '100%', height: '38px', borderRadius: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0 0.75rem', fontSize: '0.88rem' }}
              >
                <option value="">— Select Category —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Base Unit</label>
              <select
                id="demo-unit"
                className="form-input"
                value={form.unit_id}
                onChange={e => setForm(f => ({ ...f, unit_id: e.target.value }))}
                style={{ width: '100%', height: '38px', borderRadius: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0 0.75rem', fontSize: '0.88rem' }}
              >
                <option value="">— Default Unit —</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Code (Optional)</label>
              <input
                id="demo-code"
                className="form-input"
                placeholder="e.g. ANG-SPI-0001"
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                style={{ width: '100%', height: '38px', borderRadius: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0 0.75rem', fontSize: '0.88rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                Cover Image (URL or Drag & Drop File)
              </label>
              <input
                type="file"
                ref={newFileInputRef}
                accept="image/*"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) processNewImageFile(f)
                }}
                style={{ display: 'none' }}
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  id="demo-image"
                  className="form-input"
                  placeholder="https://... or drag image below"
                  value={form.default_image}
                  onChange={e => setForm(f => ({ ...f, default_image: e.target.value }))}
                  style={{ flex: 1, height: '38px', borderRadius: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0 0.75rem', fontSize: '0.88rem' }}
                />
                <button
                  type="button"
                  onClick={() => newFileInputRef.current?.click()}
                  disabled={uploadingNewImage}
                  style={{
                    padding: '0 0.75rem',
                    borderRadius: '10px',
                    background: 'rgba(59,130,246,0.15)',
                    border: '1px solid rgba(59,130,246,0.3)',
                    color: '#60a5fa',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.8rem',
                    fontWeight: 700
                  }}
                >
                  <UploadCloud size={15} />
                  <span>{uploadingNewImage ? 'Uploading...' : 'Browse'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Drag & Drop Zone for New Template */}
          <div
            onDragOver={(e) => {
              e.preventDefault()
              e.stopPropagation()
              e.dataTransfer.dropEffect = 'copy'
              setIsDraggingNew(true)
            }}
            onDragEnter={(e) => {
              e.preventDefault()
              e.stopPropagation()
              newDragCounterRef.current += 1
              setIsDraggingNew(true)
            }}
            onDragLeave={(e) => {
              e.preventDefault()
              e.stopPropagation()
              newDragCounterRef.current -= 1
              if (newDragCounterRef.current <= 0) {
                newDragCounterRef.current = 0
                setIsDraggingNew(false)
              }
            }}
            onDrop={handleNewDropEvent}
            onClick={() => newFileInputRef.current?.click()}
            style={{
              marginTop: '0.85rem',
              border: isDraggingNew ? '2px dashed #10b981' : '1.5px dashed rgba(255,255,255,0.15)',
              borderRadius: '12px',
              padding: '12px 16px',
              background: isDraggingNew ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255,255,255,0.02)',
              cursor: 'pointer',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: isDraggingNew ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isDraggingNew ? '#10b981' : '#94a3b8',
              pointerEvents: 'none'
            }}>
              {uploadingNewImage ? <RefreshCw size={16} className="animate-spin" /> : <UploadCloud size={16} />}
            </div>
            <div style={{ textAlign: 'left', pointerEvents: 'none' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: isDraggingNew ? '#10b981' : '#fff' }}>
                {uploadingNewImage ? 'Uploading image to storage...' : isDraggingNew ? 'Drop image here now!' : 'Drag and drop an image file here to upload directly to the input'}
              </span>
              <span style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8' }}>
                PNG, JPG, or WebP. Automatically uploads to Supabase storage and populates Image URL.
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setShowAddForm(false)}
              style={{ borderRadius: '10px', height: '36px' }}
            >
              Cancel
            </button>
            <button
              id="add-demo-btn"
              type="button"
              className="btn btn-primary btn-sm"
              disabled={saving || !form.name.trim()}
              onClick={addDemo}
              style={{ borderRadius: '10px', height: '36px', background: '#10b981', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Plus size={15} /> {saving ? 'Adding…' : 'Save Template'}
            </button>
          </div>
          {addErr && <p style={{ color: '#ef4444', fontSize: '0.82rem', marginTop: '0.5rem', margin: 0 }}>{addErr}</p>}
        </div>
      )}

      {/* ─── Search & Filters Bar ─── */}
      <div style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '18px',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem'
      }}>
        {/* Search Input */}
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            id="admin-demo-search"
            type="text"
            className="form-input"
            value={searchQuery}
            onChange={e => handleFilterChange(setSearchQuery, e.target.value)}
            placeholder="Search templates by product name, code (e.g. ANG-SPI-0001), category, brand, alias..."
            style={{
              width: '100%',
              paddingLeft: '2.75rem',
              paddingRight: searchQuery ? '2.5rem' : '1rem',
              height: '46px',
              borderRadius: '14px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              fontSize: '0.92rem'
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => handleFilterChange(setSearchQuery, '')}
              style={{
                position: 'absolute',
                right: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '0.2rem'
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* 4 Dedicated Filters Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem' }}>
          {/* 1. Category Filter */}
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Category
            </label>
            <select
              id="filter-category"
              className="form-input"
              value={selectedCategory}
              onChange={e => handleFilterChange(setSelectedCategory, e.target.value)}
              style={{ width: '100%', height: '38px', borderRadius: '10px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0 0.65rem', fontSize: '0.82rem' }}
            >
              <option value="All">All Categories ({demos.length})</option>
              {categories.map(c => {
                const count = demos.filter(d => d.category_id === c.id).length
                return (
                  <option key={c.id} value={c.id}>
                    {c.name} ({count})
                  </option>
                )
              })}
            </select>
          </div>

          {/* 2. Type / Sell Mode Filter */}
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Type / Sell Mode
            </label>
            <select
              id="filter-sell-mode"
              className="form-input"
              value={selectedSellMode}
              onChange={e => handleFilterChange(setSelectedSellMode, e.target.value)}
              style={{ width: '100%', height: '38px', borderRadius: '10px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0 0.65rem', fontSize: '0.82rem' }}
            >
              {SELL_MODES.map(m => {
                const count = m.value === 'All'
                  ? demos.length
                  : demos.filter(d => d.sell_mode === m.value).length
                return (
                  <option key={m.value} value={m.value}>
                    {m.label} ({count})
                  </option>
                )
              })}
            </select>
          </div>

          {/* 3. Unit Filter */}
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Default Unit
            </label>
            <select
              id="filter-unit"
              className="form-input"
              value={selectedUnit}
              onChange={e => handleFilterChange(setSelectedUnit, e.target.value)}
              style={{ width: '100%', height: '38px', borderRadius: '10px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0 0.65rem', fontSize: '0.82rem' }}
            >
              <option value="All">All Units</option>
              {units.map(u => {
                const count = demos.filter(d => d.unit_id === u.id).length
                if (count === 0) return null
                return (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.symbol}) — {count}
                  </option>
                )
              })}
            </select>
          </div>

          {/* 4. Activity Filter */}
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Activity / Status
            </label>
            <select
              id="filter-activity"
              className="form-input"
              value={selectedActivity}
              onChange={e => handleFilterChange(setSelectedActivity, e.target.value)}
              style={{ width: '100%', height: '38px', borderRadius: '10px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0 0.65rem', fontSize: '0.82rem' }}
            >
              {ACTIVITY_MODES.map(a => {
                const count = a.value === 'All'
                  ? demos.length
                  : a.value === 'WithImage'
                    ? demos.filter(d => Boolean(d.default_image)).length
                    : demos.filter(d => !d.default_image).length
                return (
                  <option key={a.value} value={a.value}>
                    {a.label} ({count})
                  </option>
                )
              })}
            </select>
          </div>
        </div>

        {/* Active Filter Pills & Reset Action */}
        {isFiltered && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Active Filters:</span>
              {searchQuery && (
                <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '8px', background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>
                  Search: &quot;{searchQuery}&quot;
                </span>
              )}
              {selectedCategory !== 'All' && (
                <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '8px', background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>
                  {catMap[selectedCategory] || 'Category'}
                </span>
              )}
              {selectedSellMode !== 'All' && (
                <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '8px', background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>
                  {selectedSellMode}
                </span>
              )}
              {selectedUnit !== 'All' && (
                <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '8px', background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>
                  Unit: {unitMap[selectedUnit]}
                </span>
              )}
              {selectedActivity !== 'All' && (
                <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '8px', background: 'rgba(168,85,247,0.15)', color: '#c084fc' }}>
                  {selectedActivity === 'WithImage' ? 'With Image' : 'No Image'}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={resetAllFilters}
              style={{
                background: 'none',
                border: 'none',
                color: '#f87171',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <X size={14} /> Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* ─── Cards Grid Layout (Designed like Add Product Step 2) ─── */}
      {viewMode === 'cards' && paginatedDemos.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
          gap: '1rem'
        }}>
          {paginatedDemos.map(d => {
            const catName = d.category_id ? catMap[d.category_id] : null
            const unitSymbol = d.unit_id ? unitMap[d.unit_id] : null
            const reg = findCatalogProduct(d.name)

            const modeColor =
              d.sell_mode === 'Manual' ? '#3b82f6' :
              d.sell_mode === 'Fixed' ? '#10b981' :
              d.sell_mode === 'Dynamic' ? '#ec4899' : '#f59e0b'

            const modeLabel =
              d.sell_mode === 'Manual' ? 'By Weight' :
              d.sell_mode === 'Fixed' ? 'Pre-Packed' : d.sell_mode

            return (
              <div
                key={d.id}
                id={`demo-card-${d.id}`}
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.borderColor = 'rgba(59,130,246,0.35)'
                  e.currentTarget.style.transform = 'translateY(-3px)'
                }}
                onMouseOut={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                  e.currentTarget.style.transform = 'none'
                }}
              >
                {/* Image & Badges Banner */}
                <div style={{ height: '140px', width: '100%', position: 'relative', overflow: 'hidden', background: 'rgba(0,0,0,0.35)' }}>
                  <img
                    src={d.default_image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500'}
                    alt={d.name}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500'
                    }}
                  />
                  {/* Sell Mode Badge */}
                  <span style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.5rem',
                    borderRadius: '6px',
                    background: modeColor,
                    color: '#fff',
                    backdropFilter: 'blur(4px)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }}>
                    {modeLabel}
                  </span>

                  {/* Code Tag or Image Status */}
                  {d.code && (
                    <span style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.5rem',
                      borderRadius: '6px',
                      background: 'rgba(0,0,0,0.75)',
                      color: '#cbd5e1',
                      border: '1px solid rgba(255,255,255,0.15)'
                    }}>
                      {d.code}
                    </span>
                  )}
                </div>

                {/* Card Body */}
                <div style={{ padding: '0.9rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', gap: '0.75rem' }}>
                  <div>
                    {/* Category pill */}
                    {catName && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#60a5fa', fontSize: '0.72rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                        {renderCategoryIcon(catName, 13)}
                        <span>{catName}</span>
                      </div>
                    )}

                    {/* Product Name */}
                    <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: '#fff', lineHeight: '1.35', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {d.name}
                    </h4>

                    {/* Malayalam translation if available */}
                    {reg?.malayalam && (
                      <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                        {reg.malayalam}
                      </p>
                    )}

                    {/* Brands Badge */}
                    {reg && reg.brands && reg.brands.length > 0 && (
                      <div style={{ marginTop: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', borderRadius: '6px', background: 'rgba(59,130,246,0.12)', color: '#93c5fd', fontWeight: 600 }}>
                          Brands: {reg.brands.slice(0, 3).join(', ')}{reg.brands.length > 3 ? ` +${reg.brands.length - 3}` : ''}
                        </span>
                      </div>
                    )}

                    {/* Base Unit */}
                    {unitSymbol && (
                      <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'inline-block', marginTop: '0.4rem' }}>
                        Base: 1 {unitSymbol}
                      </span>
                    )}
                  </div>

                  {/* Actions Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '0.65rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <Link
                      href={`/${locale}/admin/demos/${d.id}`}
                      style={{
                        flex: 1,
                        height: '34px',
                        borderRadius: '9px',
                        background: 'rgba(59,130,246,0.12)',
                        border: '1px solid rgba(59,130,246,0.25)',
                        color: '#60a5fa',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        textDecoration: 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Settings size={14} /> Manage Config
                    </Link>

                    <button
                      id={`delete-demo-${d.id}`}
                      type="button"
                      onClick={() => deleteDemo(d.id, d.name)}
                      title="Delete Master Template"
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '9px',
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        color: '#f87171',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ─── Table View ─── */}
      {viewMode === 'table' && paginatedDemos.length > 0 && (
        <div style={{ overflowX: 'auto', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px' }}>
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ padding: '0.85rem 1rem' }}>Code</th>
                <th>Name</th>
                <th>Sell Mode</th>
                <th>Category</th>
                <th>Default Unit</th>
                <th>Image</th>
                <th style={{ textAlign: 'right', paddingRight: '1rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedDemos.map(d => (
                <tr key={d.id} id={`demo-row-${d.id}`}>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                    {d.code || '—'}
                  </td>
                  <td className="font-medium" style={{ color: '#fff' }}>
                    {d.name}
                  </td>
                  <td>
                    <span style={{
                      fontSize: '0.72rem',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '6px',
                      fontWeight: 700,
                      background: d.sell_mode === 'Manual' ? 'rgba(59,130,246,0.15)' : 'rgba(16,185,129,0.15)',
                      color: d.sell_mode === 'Manual' ? '#60a5fa' : '#34d399'
                    }}>
                      {d.sell_mode === 'Manual' ? 'By Weight' : 'Pre-Packed'}
                    </span>
                  </td>
                  <td className="text-sm text-muted">{d.category_id ? catMap[d.category_id] ?? '—' : '—'}</td>
                  <td className="text-sm text-muted">{d.unit_id ? unitMap[d.unit_id] ?? '—' : '—'}</td>
                  <td>
                    {d.default_image ? (
                      <a href={d.default_image} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        View <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span style={{ color: '#64748b', fontSize: '0.8rem' }}>None</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: '1rem' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                      <Link
                        href={`/${locale}/admin/demos/${d.id}`}
                        className="btn btn-sm btn-outline"
                        style={{ height: '30px', padding: '0 0.65rem', borderRadius: '8px', display: 'flex', gap: '0.3rem', alignItems: 'center', fontSize: '0.78rem' }}
                      >
                        <Settings size={13} /> Manage
                      </Link>
                      <button
                        id={`delete-demo-${d.id}`}
                        className="btn btn-sm"
                        style={{ height: '30px', padding: '0 0.55rem', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', color: '#f87171', border: 'none', display: 'flex', alignItems: 'center' }}
                        onClick={() => deleteDemo(d.id, d.name)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Empty State ─── */}
      {paginatedDemos.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '20px',
          border: '1px dashed rgba(255,255,255,0.1)'
        }}>
          <Package size={46} style={{ color: '#475569', margin: '0 auto 0.85rem auto' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', margin: '0 0 0.4rem 0' }}>
            No Demo Templates Found
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
            No products match your current search &quot;{searchQuery}&quot; or filter combinations.
          </p>
          <button
            type="button"
            onClick={resetAllFilters}
            style={{
              padding: '0.6rem 1.4rem',
              borderRadius: '12px',
              background: '#3b82f6',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.88rem',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* ─── Pagination Footer ─── */}
      {totalItems > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
              Showing {pageSize === 0 ? 1 : (currentPage - 1) * pageSize + 1} to{' '}
              {pageSize === 0 ? totalItems : Math.min(currentPage * pageSize, totalItems)} of {totalItems} items
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Per page:</span>
              <select
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(1)
                }}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.78rem',
                  padding: '0.2rem 0.4rem',
                  cursor: 'pointer'
                }}
              >
                <option value={24}>24</option>
                <option value={48}>48</option>
                <option value={96}>96</option>
                <option value={0}>All</option>
              </select>
            </div>
          </div>

          {pageSize > 0 && totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: currentPage <= 1 ? '#475569' : '#fff',
                  cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  fontSize: '0.8rem'
                }}
              >
                <ChevronLeft size={16} /> Prev
              </button>

              <span style={{ fontSize: '0.82rem', color: '#cbd5e1', padding: '0 0.5rem', fontWeight: 600 }}>
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: currentPage >= totalPages ? '#475569' : '#fff',
                  cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  fontSize: '0.8rem'
                }}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
