'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
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
import {
  getCategoryColor,
  getCategoryEmoji,
  getCategoryMalayalamName
} from '@/lib/catalog/categoryImages'

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
  { value: 'All', label: 'All Types', emoji: '📦', color: '#94a3b8' },
  { value: 'Manual', label: 'Manual (By Weight ⚖️)', emoji: '⚖️', color: '#3b82f6' },
  { value: 'Fixed', label: 'Packed (Pre-Packed 📦)', emoji: '📦', color: '#10b981' },
  { value: 'Dynamic', label: 'Dynamic (Size-based 📐)', emoji: '📐', color: '#ec4899' },
  { value: 'Portion', label: 'Portion (By Piece 🔪)', emoji: '🔪', color: '#f59e0b' }
]

const ACTIVITY_MODES = [
  { value: 'All', label: 'All Activity', emoji: '🎯', color: '#94a3b8' },
  { value: 'WithImage', label: 'With Image (Active 🖼️)', emoji: '🖼️', color: '#10b981' },
  { value: 'NoImage', label: 'Missing Image (Draft ⚠️)', emoji: '⚠️', color: '#f59e0b' }
]

function renderCategoryIcon(name: string, size = 16) {
  const n = (name || '').toLowerCase()
  if (n.includes('veg') || n.includes('produce')) return <Carrot size={size} />
  if (n.includes('fruit')) return <Apple size={size} />
  if (n.includes('dairy') || n.includes('milk')) return <Milk size={size} />
  if (n.includes('grain') || n.includes('cereal') || n.includes('rice') || n.includes('flour') || n.includes('dry')) return <Wheat size={size} />
  if (n.includes('spice')) return <Flame size={size} />
  if (n.includes('bakery') || n.includes('bread') || n.includes('cake')) return <Croissant size={size} />
  if (n.includes('oil') || n.includes('cooking')) return <GlassWater size={size} />
  if (n.includes('meat') || n.includes('fish')) return <Fish size={size} />
  if (n.includes('household') || n.includes('clean')) return <Sparkles size={size} />
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

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Initialize Search and Filters State from URL searchParams
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All')
  const [selectedSellMode, setSelectedSellMode] = useState(searchParams.get('sell_mode') || 'All')
  const [selectedUnit, setSelectedUnit] = useState(searchParams.get('unit') || 'All')
  const [selectedActivity, setSelectedActivity] = useState(searchParams.get('activity') || 'All')

  // Pagination & View State
  const [pageSize, setPageSize] = useState<number>(searchParams.get('page_size') ? Number(searchParams.get('page_size')) : 24)
  const [currentPage, setCurrentPage] = useState<number>(searchParams.get('page') ? Number(searchParams.get('page')) : 1)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(searchParams.get('view') === 'table' ? 'table' : 'cards')

  const [isHydrated, setIsHydrated] = useState(false)

  // Rehydrate from sessionStorage if URL has no searchParams on initial mount
  useEffect(() => {
    const hasUrlParams = Boolean(
      searchParams.get('category') ||
      searchParams.get('sell_mode') ||
      searchParams.get('unit') ||
      searchParams.get('activity') ||
      searchParams.get('q') ||
      searchParams.get('page') ||
      searchParams.get('view') ||
      searchParams.get('page_size')
    )

    if (!hasUrlParams) {
      try {
        const saved = sessionStorage.getItem('angadi_demos_filter_state')
        if (saved) {
          const p = JSON.parse(saved)
          if (p.category) setSelectedCategory(p.category)
          if (p.sell_mode) setSelectedSellMode(p.sell_mode)
          if (p.unit) setSelectedUnit(p.unit)
          if (p.activity) setSelectedActivity(p.activity)
          if (p.q !== undefined) setSearchQuery(p.q)
          if (p.page) setCurrentPage(p.page)
          if (p.view) setViewMode(p.view)
          if (p.page_size !== undefined) setPageSize(p.page_size)
        }
      } catch (e) {
        console.error('Failed to load filter state from sessionStorage', e)
      }
    }
    setIsHydrated(true)
  }, [])

  // Sync to URL searchParams & sessionStorage whenever filter/pagination state updates
  const syncFilters = useCallback((
    cat: string,
    mode: string,
    unit: string,
    act: string,
    q: string,
    pg: number,
    vm: 'cards' | 'table',
    ps: number
  ) => {
    try {
      sessionStorage.setItem('angadi_demos_filter_state', JSON.stringify({
        category: cat,
        sell_mode: mode,
        unit,
        activity: act,
        q,
        page: pg,
        view: vm,
        page_size: ps
      }))
    } catch (e) {}

    const qs = new URLSearchParams()
    if (cat !== 'All') qs.set('category', cat)
    if (mode !== 'All') qs.set('sell_mode', mode)
    if (unit !== 'All') qs.set('unit', unit)
    if (act !== 'All') qs.set('activity', act)
    if (q.trim()) qs.set('q', q.trim())
    if (pg > 1) qs.set('page', pg.toString())
    if (vm !== 'cards') qs.set('view', vm)
    if (ps !== 24) qs.set('page_size', ps.toString())

    const queryString = qs.toString()
    const targetUrl = queryString ? `${pathname}?${queryString}` : pathname
    router.replace(targetUrl, { scroll: false })
  }, [pathname, router])

  useEffect(() => {
    if (!isHydrated) return
    syncFilters(
      selectedCategory,
      selectedSellMode,
      selectedUnit,
      selectedActivity,
      searchQuery,
      currentPage,
      viewMode,
      pageSize
    )
  }, [
    isHydrated,
    selectedCategory,
    selectedSellMode,
    selectedUnit,
    selectedActivity,
    searchQuery,
    currentPage,
    viewMode,
    pageSize,
    syncFilters
  ])

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

  // Query string for preserving filters when clicking into items
  const currentQueryString = useMemo(() => {
    const qs = new URLSearchParams()
    if (selectedCategory !== 'All') qs.set('category', selectedCategory)
    if (selectedSellMode !== 'All') qs.set('sell_mode', selectedSellMode)
    if (selectedUnit !== 'All') qs.set('unit', selectedUnit)
    if (selectedActivity !== 'All') qs.set('activity', selectedActivity)
    if (searchQuery.trim()) qs.set('q', searchQuery.trim())
    if (currentPage > 1) qs.set('page', currentPage.toString())
    if (viewMode !== 'cards') qs.set('view', viewMode)
    if (pageSize !== 24) qs.set('page_size', pageSize.toString())
    return qs.toString()
  }, [selectedCategory, selectedSellMode, selectedUnit, selectedActivity, searchQuery, currentPage, viewMode, pageSize])

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
    try {
      sessionStorage.removeItem('angadi_demos_filter_state')
    } catch (e) {}
    router.replace(pathname, { scroll: false })
  }

  const isFiltered = Boolean(
    searchQuery.trim() ||
    selectedCategory !== 'All' ||
    selectedSellMode !== 'All' ||
    selectedUnit !== 'All' ||
    selectedActivity !== 'All'
  )

  const activeCategory = categories.find(c => c.id === selectedCategory)
  const activeCategoryColor = activeCategory ? getCategoryColor(activeCategory.name) : '#3b82f6'
  const activeCategoryEmoji = activeCategory ? getCategoryEmoji(activeCategory.name) : '📦'

  const activeSellModeObj = SELL_MODES.find(m => m.value === selectedSellMode)
  const activeSellModeColor = activeSellModeObj?.color || '#3b82f6'

  const activeActivityObj = ACTIVITY_MODES.find(a => a.value === selectedActivity)
  const activeActivityColor = activeActivityObj?.color || '#3b82f6'


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
                <option value="Fixed" style={{ background: '#1e293b', color: '#10b981' }}>📦 Packed (Pre-Packed)</option>
                <option value="Manual" style={{ background: '#1e293b', color: '#3b82f6' }}>⚖️ Manual (By Weight)</option>
                <option value="Dynamic" style={{ background: '#1e293b', color: '#ec4899' }}>📐 Dynamic (Size-based)</option>
                <option value="Portion" style={{ background: '#1e293b', color: '#f59e0b' }}>🔪 Portion (By Piece)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Category</label>
              <select
                id="demo-category"
                className="form-input"
                value={form.category_id}
                onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                style={{
                  width: '100%',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(0,0,0,0.2)',
                  border: form.category_id ? `1.5px solid ${getCategoryColor(categories.find(c => c.id === form.category_id)?.name || '')}` : '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  padding: '0 0.75rem',
                  fontSize: '0.88rem'
                }}
              >
                <option value="" style={{ background: '#1e293b', color: '#94a3b8' }}>— Select Category —</option>
                {categories.map(c => {
                  const col = getCategoryColor(c.name)
                  const emo = getCategoryEmoji(c.name)
                  return (
                    <option key={c.id} value={c.id} style={{ background: '#1e293b', color: col }}>
                      {emo} {c.name}
                    </option>
                  )
                })}
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

      {/* ─── Visual Category Ribbon (Quick 1-Click Category Filter) ─── */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '16px',
        padding: '0.85rem 1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Filter size={14} style={{ color: '#60a5fa' }} />
            <span>Category Quick Filter</span>
            <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>
              (Click to isolate category)
            </span>
          </span>
          {selectedCategory !== 'All' && (
            <button
              type="button"
              onClick={() => handleFilterChange(setSelectedCategory, 'All')}
              style={{
                background: 'none',
                border: 'none',
                color: '#60a5fa',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <X size={12} /> Show All ({demos.length})
            </button>
          )}
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          overflowX: 'auto',
          paddingBottom: '0.35rem',
          scrollbarWidth: 'thin'
        }}>
          {/* All Categories Chip */}
          <button
            type="button"
            onClick={() => handleFilterChange(setSelectedCategory, 'All')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.42rem 0.8rem',
              borderRadius: '11px',
              fontSize: '0.8rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              border: selectedCategory === 'All' ? '1.5px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)',
              background: selectedCategory === 'All' ? '#3b82f6' : 'rgba(255,255,255,0.03)',
              color: selectedCategory === 'All' ? '#fff' : '#94a3b8',
              boxShadow: selectedCategory === 'All' ? '0 4px 12px rgba(59,130,246,0.35)' : 'none',
              transition: 'all 0.18s ease',
              flexShrink: 0
            }}
          >
            <span>📦</span>
            <span>{locale === 'ml' ? 'എല്ലാം' : 'All Items'}</span>
            <span style={{
              fontSize: '0.7rem',
              padding: '0.1rem 0.4rem',
              borderRadius: '7px',
              background: selectedCategory === 'All' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
              color: selectedCategory === 'All' ? '#fff' : '#64748b',
              fontWeight: 800
            }}>
              {demos.length}
            </span>
          </button>

          {/* 14 Category Chips */}
          {categories.map(c => {
            const isSelected = selectedCategory === c.id
            const catCol = getCategoryColor(c.name)
            const catEmo = getCategoryEmoji(c.name)
            const catMal = getCategoryMalayalamName(c.name)
            const count = demos.filter(d => d.category_id === c.id).length

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => handleFilterChange(setSelectedCategory, isSelected ? 'All' : c.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.42rem 0.8rem',
                  borderRadius: '11px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  border: isSelected ? `1.5px solid ${catCol}` : `1px solid ${catCol}33`,
                  background: isSelected ? catCol : `${catCol}10`,
                  color: isSelected ? '#fff' : '#e2e8f0',
                  boxShadow: isSelected ? `0 4px 14px ${catCol}55` : 'none',
                  transform: isSelected ? 'translateY(-1px)' : 'none',
                  transition: 'all 0.18s ease',
                  flexShrink: 0
                }}
              >
                <span>{catEmo}</span>
                <span>{locale === 'ml' ? catMal : c.name}</span>
                <span style={{
                  fontSize: '0.7rem',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '7px',
                  background: isSelected ? 'rgba(255,255,255,0.25)' : `${catCol}25`,
                  color: isSelected ? '#fff' : catCol,
                  fontWeight: 800
                }}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

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
            onKeyDown={e => {
              if (e.key === 'Escape') handleFilterChange(setSearchQuery, '')
            }}
            placeholder="Search templates by product name, code (e.g. ANG-SPI-0001), category, brand, alias... (Esc to clear)"
            style={{
              width: '100%',
              paddingLeft: '2.75rem',
              paddingRight: searchQuery ? '2.5rem' : '1rem',
              height: '46px',
              borderRadius: '14px',
              background: 'rgba(255,255,255,0.04)',
              border: searchQuery.trim() ? '1.5px solid rgba(59,130,246,0.5)' : '1px solid rgba(255,255,255,0.1)',
              boxShadow: searchQuery.trim() ? '0 0 10px rgba(59,130,246,0.2)' : 'none',
              color: '#fff',
              fontSize: '0.92rem'
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => handleFilterChange(setSearchQuery, '')}
              title="Clear search"
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Category
              </label>
              {selectedCategory !== 'All' && (
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: activeCategoryColor,
                  background: `${activeCategoryColor}18`,
                  padding: '0.1rem 0.4rem',
                  borderRadius: '6px',
                  border: `1px solid ${activeCategoryColor}40`
                }}>
                  {activeCategoryEmoji} Active
                </span>
              )}
            </div>
            <select
              id="filter-category"
              className="form-input"
              value={selectedCategory}
              onChange={e => handleFilterChange(setSelectedCategory, e.target.value)}
              style={{
                width: '100%',
                height: '40px',
                borderRadius: '10px',
                background: selectedCategory !== 'All' ? `${activeCategoryColor}18` : 'rgba(0,0,0,0.25)',
                border: selectedCategory !== 'All' ? `1.5px solid ${activeCategoryColor}` : '1px solid rgba(255,255,255,0.1)',
                boxShadow: selectedCategory !== 'All' ? `0 0 10px ${activeCategoryColor}33` : 'none',
                color: '#fff',
                padding: '0 0.65rem',
                fontSize: '0.82rem',
                transition: 'all 0.2s ease'
              }}
            >
              <option value="All" style={{ background: '#1e293b', color: '#fff' }}>
                📦 All Categories ({demos.length})
              </option>
              {categories.map(c => {
                const count = demos.filter(d => d.category_id === c.id).length
                const col = getCategoryColor(c.name)
                const emo = getCategoryEmoji(c.name)
                const mal = getCategoryMalayalamName(c.name)
                return (
                  <option key={c.id} value={c.id} style={{ background: '#1e293b', color: col, fontWeight: 600 }}>
                    {emo} {c.name} {locale === 'ml' ? `(${mal})` : ''} — {count}
                  </option>
                )
              })}
            </select>
          </div>

          {/* 2. Type / Sell Mode Filter */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Type / Sell Mode
              </label>
              {selectedSellMode !== 'All' && (
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: activeSellModeColor,
                  background: `${activeSellModeColor}18`,
                  padding: '0.1rem 0.4rem',
                  borderRadius: '6px',
                  border: `1px solid ${activeSellModeColor}40`
                }}>
                  {activeSellModeObj?.emoji} {selectedSellMode}
                </span>
              )}
            </div>
            <select
              id="filter-sell-mode"
              className="form-input"
              value={selectedSellMode}
              onChange={e => handleFilterChange(setSelectedSellMode, e.target.value)}
              style={{
                width: '100%',
                height: '40px',
                borderRadius: '10px',
                background: selectedSellMode !== 'All' ? `${activeSellModeColor}18` : 'rgba(0,0,0,0.25)',
                border: selectedSellMode !== 'All' ? `1.5px solid ${activeSellModeColor}` : '1px solid rgba(255,255,255,0.1)',
                boxShadow: selectedSellMode !== 'All' ? `0 0 10px ${activeSellModeColor}33` : 'none',
                color: '#fff',
                padding: '0 0.65rem',
                fontSize: '0.82rem',
                transition: 'all 0.2s ease'
              }}
            >
              {SELL_MODES.map(m => {
                const count = m.value === 'All'
                  ? demos.length
                  : demos.filter(d => d.sell_mode === m.value).length
                return (
                  <option key={m.value} value={m.value} style={{ background: '#1e293b', color: m.color, fontWeight: 600 }}>
                    {m.emoji} {m.label} ({count})
                  </option>
                )
              })}
            </select>
          </div>

          {/* 3. Unit Filter */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Default Unit
              </label>
              {selectedUnit !== 'All' && (
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: '#fbbf24',
                  background: 'rgba(245,158,11,0.15)',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(245,158,11,0.3)'
                }}>
                  {unitMap[selectedUnit]}
                </span>
              )}
            </div>
            <select
              id="filter-unit"
              className="form-input"
              value={selectedUnit}
              onChange={e => handleFilterChange(setSelectedUnit, e.target.value)}
              style={{
                width: '100%',
                height: '40px',
                borderRadius: '10px',
                background: selectedUnit !== 'All' ? 'rgba(245,158,11,0.15)' : 'rgba(0,0,0,0.25)',
                border: selectedUnit !== 'All' ? '1.5px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)',
                boxShadow: selectedUnit !== 'All' ? '0 0 10px rgba(245,158,11,0.25)' : 'none',
                color: '#fff',
                padding: '0 0.65rem',
                fontSize: '0.82rem',
                transition: 'all 0.2s ease'
              }}
            >
              <option value="All" style={{ background: '#1e293b', color: '#fff' }}>All Units</option>
              {units.map(u => {
                const count = demos.filter(d => d.unit_id === u.id).length
                if (count === 0) return null
                return (
                  <option key={u.id} value={u.id} style={{ background: '#1e293b', color: '#fbbf24' }}>
                    ⚖️ {u.name} ({u.symbol}) — {count}
                  </option>
                )
              })}
            </select>
          </div>

          {/* 4. Activity Filter */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Activity / Status
              </label>
              {selectedActivity !== 'All' && (
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: activeActivityColor,
                  background: `${activeActivityColor}18`,
                  padding: '0.1rem 0.4rem',
                  borderRadius: '6px',
                  border: `1px solid ${activeActivityColor}40`
                }}>
                  {activeActivityObj?.emoji} {selectedActivity}
                </span>
              )}
            </div>
            <select
              id="filter-activity"
              className="form-input"
              value={selectedActivity}
              onChange={e => handleFilterChange(setSelectedActivity, e.target.value)}
              style={{
                width: '100%',
                height: '40px',
                borderRadius: '10px',
                background: selectedActivity !== 'All' ? `${activeActivityColor}18` : 'rgba(0,0,0,0.25)',
                border: selectedActivity !== 'All' ? `1.5px solid ${activeActivityColor}` : '1px solid rgba(255,255,255,0.1)',
                boxShadow: selectedActivity !== 'All' ? `0 0 10px ${activeActivityColor}33` : 'none',
                color: '#fff',
                padding: '0 0.65rem',
                fontSize: '0.82rem',
                transition: 'all 0.2s ease'
              }}
            >
              {ACTIVITY_MODES.map(a => {
                const count = a.value === 'All'
                  ? demos.length
                  : a.value === 'WithImage'
                    ? demos.filter(d => Boolean(d.default_image)).length
                    : demos.filter(d => !d.default_image).length
                return (
                  <option key={a.value} value={a.value} style={{ background: '#1e293b', color: a.color, fontWeight: 600 }}>
                    {a.emoji} {a.label} ({count})
                  </option>
                )
              })}
            </select>
          </div>
        </div>

        {/* Active Filter Summary Bar & Dismissible Tags */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.6rem',
          paddingTop: '0.5rem',
          borderTop: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600 }}>
              Showing <strong style={{ color: '#60a5fa' }}>{totalItems}</strong> of {demos.length} templates
            </span>

            {searchQuery && (
              <button
                type="button"
                onClick={() => handleFilterChange(setSearchQuery, '')}
                title="Remove search filter"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '8px',
                  background: 'rgba(59,130,246,0.18)',
                  color: '#60a5fa',
                  border: '1px solid rgba(59,130,246,0.3)',
                  cursor: 'pointer'
                }}
              >
                <span>Search: &quot;{searchQuery}&quot;</span>
                <X size={12} />
              </button>
            )}

            {selectedCategory !== 'All' && (
              <button
                type="button"
                onClick={() => handleFilterChange(setSelectedCategory, 'All')}
                title="Remove category filter"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '8px',
                  background: `${activeCategoryColor}20`,
                  color: activeCategoryColor,
                  border: `1px solid ${activeCategoryColor}40`,
                  cursor: 'pointer'
                }}
              >
                <span>{activeCategoryEmoji} {catMap[selectedCategory] || 'Category'}</span>
                <X size={12} />
              </button>
            )}

            {selectedSellMode !== 'All' && (
              <button
                type="button"
                onClick={() => handleFilterChange(setSelectedSellMode, 'All')}
                title="Remove sell mode filter"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '8px',
                  background: `${activeSellModeColor}20`,
                  color: activeSellModeColor,
                  border: `1px solid ${activeSellModeColor}40`,
                  cursor: 'pointer'
                }}
              >
                <span>{activeSellModeObj?.emoji} {selectedSellMode}</span>
                <X size={12} />
              </button>
            )}

            {selectedUnit !== 'All' && (
              <button
                type="button"
                onClick={() => handleFilterChange(setSelectedUnit, 'All')}
                title="Remove unit filter"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '8px',
                  background: 'rgba(245,158,11,0.18)',
                  color: '#fbbf24',
                  border: '1px solid rgba(245,158,11,0.35)',
                  cursor: 'pointer'
                }}
              >
                <span>Unit: {unitMap[selectedUnit]}</span>
                <X size={12} />
              </button>
            )}

            {selectedActivity !== 'All' && (
              <button
                type="button"
                onClick={() => handleFilterChange(setSelectedActivity, 'All')}
                title="Remove activity filter"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '8px',
                  background: `${activeActivityColor}20`,
                  color: activeActivityColor,
                  border: `1px solid ${activeActivityColor}40`,
                  cursor: 'pointer'
                }}
              >
                <span>{activeActivityObj?.emoji} {selectedActivity === 'WithImage' ? 'With Image' : 'No Image'}</span>
                <X size={12} />
              </button>
            )}
          </div>

          {isFiltered && (
            <button
              type="button"
              onClick={resetAllFilters}
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: '#f87171',
                borderRadius: '8px',
                padding: '0.25rem 0.65rem',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                transition: 'all 0.15s ease'
              }}
            >
              <X size={13} /> Reset All Filters
            </button>
          )}
        </div>
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
            const itemCatColor = catName ? getCategoryColor(catName) : '#3b82f6'
            const itemCatEmoji = catName ? getCategoryEmoji(catName) : '📦'
            const itemCatMal = catName ? getCategoryMalayalamName(catName) : ''

            const modeColor =
              d.sell_mode === 'Manual' ? '#3b82f6' :
              d.sell_mode === 'Fixed' ? '#10b981' :
              d.sell_mode === 'Dynamic' ? '#ec4899' : '#f59e0b'

            const modeLabel =
              d.sell_mode === 'Manual' ? 'By Weight ⚖️' :
              d.sell_mode === 'Fixed' ? 'Pre-Packed 📦' :
              d.sell_mode === 'Dynamic' ? 'Dynamic 📐' :
              d.sell_mode === 'Portion' ? 'Portion 🔪' : d.sell_mode

            return (
              <div
                key={d.id}
                id={`demo-card-${d.id}`}
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderTop: `3px solid ${itemCatColor}`,
                  borderRadius: '16px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.borderColor = itemCatColor
                  e.currentTarget.style.transform = 'translateY(-3px)'
                  e.currentTarget.style.boxShadow = `0 6px 20px ${itemCatColor}22`
                }}
                onMouseOut={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                  e.currentTarget.style.borderTop = `3px solid ${itemCatColor}`
                  e.currentTarget.style.transform = 'none'
                  e.currentTarget.style.boxShadow = 'none'
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

                  {/* Missing Image Warning Badge */}
                  {!d.default_image && (
                    <span style={{
                      position: 'absolute',
                      bottom: '8px',
                      left: '8px',
                      fontSize: '0.66rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.45rem',
                      borderRadius: '6px',
                      background: 'rgba(245,158,11,0.9)',
                      color: '#000',
                      backdropFilter: 'blur(4px)'
                    }}>
                      ⚠️ Needs Image
                    </span>
                  )}

                  {/* Code Tag */}
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
                    {/* Category pill with distinct category color */}
                    {catName && (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        color: itemCatColor,
                        background: `${itemCatColor}18`,
                        border: `1px solid ${itemCatColor}35`,
                        padding: '0.2rem 0.55rem',
                        borderRadius: '8px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        marginBottom: '0.35rem'
                      }}>
                        <span>{itemCatEmoji}</span>
                        <span>{locale === 'ml' ? itemCatMal : catName}</span>
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
                      href={`/${locale}/admin/demos/${d.id}${currentQueryString ? `?${currentQueryString}` : ''}`}
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
              {paginatedDemos.map(d => {
                const catName = d.category_id ? catMap[d.category_id] : null
                const catCol = catName ? getCategoryColor(catName) : '#94a3b8'
                const catEmo = catName ? getCategoryEmoji(catName) : '📦'
                const catMal = catName ? getCategoryMalayalamName(catName) : ''

                const modeColor =
                  d.sell_mode === 'Manual' ? '#3b82f6' :
                  d.sell_mode === 'Fixed' ? '#10b981' :
                  d.sell_mode === 'Dynamic' ? '#ec4899' : '#f59e0b'

                const modeLabel =
                  d.sell_mode === 'Manual' ? 'By Weight ⚖️' :
                  d.sell_mode === 'Fixed' ? 'Pre-Packed 📦' :
                  d.sell_mode === 'Dynamic' ? 'Dynamic 📐' :
                  d.sell_mode === 'Portion' ? 'Portion 🔪' : d.sell_mode

                return (
                  <tr key={d.id} id={`demo-row-${d.id}`}>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                      {d.code || '—'}
                    </td>
                    <td className="font-medium" style={{ color: '#fff' }}>
                      <div>{d.name}</div>
                      {locale === 'ml' && findCatalogProduct(d.name)?.malayalam && (
                        <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>
                          {findCatalogProduct(d.name)?.malayalam}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{
                        fontSize: '0.72rem',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        fontWeight: 700,
                        background: `${modeColor}18`,
                        color: modeColor,
                        border: `1px solid ${modeColor}33`
                      }}>
                        {modeLabel}
                      </span>
                    </td>
                    <td>
                      {catName ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          background: `${catCol}15`,
                          color: catCol,
                          border: `1px solid ${catCol}35`
                        }}>
                          <span>{catEmo}</span>
                          <span>{locale === 'ml' ? catMal : catName}</span>
                        </span>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: '0.78rem' }}>—</span>
                      )}
                    </td>
                    <td className="text-sm text-muted">{d.unit_id ? unitMap[d.unit_id] ?? '—' : '—'}</td>
                    <td>
                      {d.default_image ? (
                        <a href={d.default_image} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          View <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span style={{ color: '#f59e0b', fontSize: '0.76rem', fontWeight: 600 }}>⚠️ Needs Image</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: '1rem' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                        <Link
                          href={`/${locale}/admin/demos/${d.id}${currentQueryString ? `?${currentQueryString}` : ''}`}
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
                )
              })}
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
