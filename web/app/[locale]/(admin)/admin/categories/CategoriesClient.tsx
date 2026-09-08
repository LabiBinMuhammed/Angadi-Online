'use client'

import { useState, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Plus, Search, Edit3, Trash2, ToggleLeft, ToggleRight,
  LayoutGrid, List, Layers, Percent, Package, Sparkles,
  UploadCloud, X, Check, Image as ImageIcon, ExternalLink,
  RefreshCw, CheckCircle2, AlertCircle
} from 'lucide-react'
import type { Category } from '@/types'
import {
  getCategoryImageUrl,
  getCategoryEmoji,
  getCategoryMalayalamName,
  CATEGORY_VISUALS
} from '@/lib/catalog/categoryImages'

export default function CategoriesClient({ categories: initial }: { categories: Category[] }) {
  const [categories, setCategories] = useState<Category[]>(initial)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')

  // Modal / Drawer state
  const [modalOpen, setModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentId, setCurrentId] = useState<string | null>(null)

  // Form Fields
  const [formName, setFormName] = useState('')
  const [formMalayalam, setFormMalayalam] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formOrder, setFormOrder] = useState('')
  const [formCommission, setFormCommission] = useState('4.0')
  const [formIsActive, setFormIsActive] = useState(true)
  const [formImageUrl, setFormImageUrl] = useState('')

  // Upload state
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [formSaving, setFormSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  function showToast(msg: string) {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter(cat => {
      // Status filter
      if (statusFilter === 'active' && !cat.is_active) return false
      if (statusFilter === 'inactive' && cat.is_active) return false

      // Search filter
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase().trim()
      const mlName = (
        cat.category_translations?.find(t => t.language_code === 'ml')?.name ||
        getCategoryMalayalamName(cat.name)
      ).toLowerCase()

      return (
        cat.name.toLowerCase().includes(q) ||
        (cat.description || '').toLowerCase().includes(q) ||
        mlName.includes(q)
      )
    })
  }, [categories, searchQuery, statusFilter])

  // Aggregate stats
  const totalProducts = useMemo(() => {
    return categories.reduce((sum, c) => sum + (c.item_count || 0), 0)
  }, [categories])

  const activeCount = useMemo(() => {
    return categories.filter(c => c.is_active).length
  }, [categories])

  const avgCommission = useMemo(() => {
    if (categories.length === 0) return 4.0
    const total = categories.reduce((sum, c) => sum + (c.commission_percentage ?? 4.0), 0)
    return (total / categories.length).toFixed(1)
  }, [categories])

  // Open Create Modal
  function handleOpenCreate() {
    setIsEditing(false)
    setCurrentId(null)
    setFormName('')
    setFormMalayalam('')
    setFormDesc('')
    setFormOrder((categories.length + 1).toString())
    setFormCommission('4.0')
    setFormIsActive(true)
    setFormImageUrl('')
    setFormError('')
    setUploadError('')
    setModalOpen(true)
  }

  // Open Edit Modal
  function handleOpenEdit(cat: Category) {
    setIsEditing(true)
    setCurrentId(cat.id)
    setFormName(cat.name)
    const existingMl = cat.category_translations?.find(t => t.language_code === 'ml')?.name || getCategoryMalayalamName(cat.name)
    setFormMalayalam(existingMl)
    setFormDesc(cat.description || '')
    setFormOrder(cat.display_order !== undefined && cat.display_order !== null ? cat.display_order.toString() : '')
    setFormCommission((cat.commission_percentage ?? 4.0).toString())
    setFormIsActive(cat.is_active)
    setFormImageUrl(cat.image_url || getCategoryImageUrl(cat.name, cat.image_url))
    setFormError('')
    setUploadError('')
    setModalOpen(true)
  }

  // Image Upload handler
  async function handleImageFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    setUploadError('')

    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() || 'jpg'
      const fileName = `categories/cat_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`

      const { data, error: uploadErr } = await supabase.storage
        .from('item-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: true })

      if (uploadErr) {
        throw uploadErr
      }

      const { data: publicUrlData } = supabase.storage
        .from('item-images')
        .getPublicUrl(fileName)

      if (publicUrlData?.publicUrl) {
        setFormImageUrl(publicUrlData.publicUrl)
        showToast('Image uploaded successfully!')
      }
    } catch (err: any) {
      console.error('Error uploading image:', err)
      setUploadError(err.message || 'Failed to upload image. You can also paste an image URL.')
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Save (Create or Update)
  async function handleSaveCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!formName.trim()) {
      setFormError('Category name is required.')
      return
    }

    setFormSaving(true)
    setFormError('')

    const supabase = createClient()
    const parsedOrder = formOrder ? parseInt(formOrder, 10) : null
    const parsedCommission = formCommission ? parseFloat(formCommission) : 4.0

    try {
      if (isEditing && currentId) {
        // 1. Try updating categories table with image_url & commission_percentage
        const payloadWithAll: any = {
          name: formName.trim(),
          description: formDesc.trim() || null,
          display_order: parsedOrder,
          commission_percentage: parsedCommission,
          is_active: formIsActive,
          image_url: formImageUrl.trim() || null
        }

        let { error: updateErr } = await supabase
          .from('categories')
          .update(payloadWithAll)
          .eq('id', currentId)

        // If column does not exist yet, fallback to update without image_url/commission_percentage
        if (updateErr && (updateErr.message.includes('image_url') || updateErr.message.includes('commission_percentage'))) {
          const fallbackPayload: any = {
            name: formName.trim(),
            description: formDesc.trim() || null,
            display_order: parsedOrder,
            is_active: formIsActive
          }
          const { error: fbErr } = await supabase
            .from('categories')
            .update(fallbackPayload)
            .eq('id', currentId)
          if (fbErr) throw fbErr
        } else if (updateErr) {
          throw updateErr
        }

        // 2. Save Malayalam translation
        if (formMalayalam.trim()) {
          await supabase
            .from('category_translations')
            .upsert({
              category_id: currentId,
              language_code: 'ml',
              name: formMalayalam.trim()
            }, { onConflict: 'category_id,language_code' })
        }

        // 3. Update local state
        setCategories(prev => {
          return prev.map(c => {
            if (c.id !== currentId) return c
            const existingTrans = c.category_translations || []
            const updatedTrans = [
              ...existingTrans.filter(t => t.language_code !== 'ml'),
              { language_code: 'ml', name: formMalayalam.trim() }
            ]
            return {
              ...c,
              name: formName.trim(),
              description: formDesc.trim() || undefined,
              display_order: parsedOrder !== null ? parsedOrder : undefined,
              commission_percentage: parsedCommission,
              is_active: formIsActive,
              image_url: formImageUrl.trim() || undefined,
              category_translations: updatedTrans
            }
          }).sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999))
        })

        showToast(`Category "${formName.trim()}" updated successfully!`)
        setModalOpen(false)
      } else {
        // CREATE new category
        const payload: any = {
          name: formName.trim(),
          description: formDesc.trim() || null,
          display_order: parsedOrder,
          commission_percentage: parsedCommission,
          is_active: formIsActive,
          image_url: formImageUrl.trim() || null
        }

        let { data, error: insertErr } = await supabase
          .from('categories')
          .insert(payload)
          .select('*')
          .single()

        if (insertErr && (insertErr.message.includes('image_url') || insertErr.message.includes('commission_percentage'))) {
          const fallbackPayload: any = {
            name: formName.trim(),
            description: formDesc.trim() || null,
            display_order: parsedOrder,
            is_active: formIsActive
          }
          const { data: fbData, error: fbErr } = await supabase
            .from('categories')
            .insert(fallbackPayload)
            .select('*')
            .single()
          if (fbErr) throw fbErr
          data = fbData
        } else if (insertErr) {
          throw insertErr
        }

        if (data) {
          // Save Malayalam translation
          if (formMalayalam.trim()) {
            await supabase
              .from('category_translations')
              .upsert({
                category_id: data.id,
                language_code: 'ml',
                name: formMalayalam.trim()
              }, { onConflict: 'category_id,language_code' })
          }

          const newCat: Category = {
            ...data,
            image_url: formImageUrl.trim() || undefined,
            commission_percentage: parsedCommission,
            category_translations: formMalayalam.trim() ? [{ language_code: 'ml', name: formMalayalam.trim() }] : [],
            item_count: 0
          }

          setCategories(prev => {
            const list = [...prev, newCat]
            return list.sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999))
          })

          showToast(`New category "${formName.trim()}" created!`)
          setModalOpen(false)
        }
      }
    } catch (err: any) {
      console.error('Error saving category:', err)
      setFormError(err.message || 'Failed to save category.')
    } finally {
      setFormSaving(false)
    }
  }

  // Toggle Active/Inactive
  async function toggleCategory(cat: Category) {
    const supabase = createClient()
    const next = !cat.is_active
    await supabase.from('categories').update({ is_active: next }).eq('id', cat.id)
    setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, is_active: next } : c))
    showToast(`${cat.name} is now ${next ? 'Active' : 'Inactive'}`)
  }

  // Delete Category
  async function deleteCategory(id: string, name: string) {
    if (!window.confirm(`Delete category "${name}"?\nItems referencing it will be detached safely.`)) return
    const supabase = createClient()
    try {
      await supabase.from('items').update({ category_id: null }).eq('category_id', id)
      await supabase.from('demo_items').update({ category_id: null }).eq('category_id', id)
      await supabase.from('category_unit_groups').delete().eq('category_id', id)
      await supabase.from('category_translations').delete().eq('category_id', id)
      
      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (!error) {
        setCategories(prev => prev.filter(c => c.id !== id))
        showToast(`Category "${name}" deleted.`)
      } else {
        alert('Error deleting category: ' + error.message)
      }
    } catch (e: any) {
      alert('Error deleting category: ' + (e.message || e))
    }
  }

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: '#064e3b',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 9999,
          fontWeight: 600,
          fontSize: '0.95rem'
        }}>
          <CheckCircle2 size={20} color="#34d399" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Main Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div>
          <h1 className="panel-page-title" style={{ margin: 0, fontSize: '1.85rem', fontWeight: 800 }}>
            Category Management
          </h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Curate master store departments, cover photography, Malayalam localizations, and platform fees.
          </p>
        </div>

        <button
          id="add-new-category-btn"
          className="btn btn-primary"
          onClick={handleOpenCreate}
          style={{
            background: 'var(--wa-green-dark, #075e54)',
            color: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '0.95rem',
            boxShadow: '0 4px 12px rgba(7, 94, 84, 0.25)',
            cursor: 'pointer',
            border: 'none'
          }}
        >
          <Plus size={18} />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Metric Summary Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div className="card card-body" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
            <Layers size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, lineHeight: 1.1 }}>{categories.length}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>Total Categories</div>
          </div>
        </div>

        <div className="card card-body" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
            <Package size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, lineHeight: 1.1 }}>{totalProducts}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>Master Blueprint Items</div>
          </div>
        </div>

        <div className="card card-body" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
            <Sparkles size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, lineHeight: 1.1 }}>{activeCount} / {categories.length}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>Active in Mobile & Web</div>
          </div>
        </div>

        <div className="card card-body" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7' }}>
            <Percent size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, lineHeight: 1.1 }}>{avgCommission}%</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>Average Commission Fee</div>
          </div>
        </div>
      </div>

      {/* Search & View Controls Bar */}
      <div className="card card-body" style={{
        padding: '14px 18px',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '480px' }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            id="category-search-input"
            type="text"
            className="form-input"
            placeholder="Search categories by English, മലയാളം, or description..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '40px',
              paddingRight: searchQuery ? '36px' : '12px',
              height: '42px',
              borderRadius: '10px',
              border: '1.5px solid var(--border-color, #e2e8f0)',
              fontSize: '0.9rem',
              backgroundColor: 'var(--bg-surface)'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: 4
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Status Filters & View Mode */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: 'var(--bg-muted, #f1f5f9)', padding: 3, borderRadius: 8 }}>
            <button
              className="btn btn-sm"
              onClick={() => setStatusFilter('all')}
              style={{
                background: statusFilter === 'all' ? '#ffffff' : 'transparent',
                color: statusFilter === 'all' ? 'var(--text-base)' : 'var(--text-muted)',
                fontWeight: statusFilter === 'all' ? 700 : 500,
                border: 'none',
                boxShadow: statusFilter === 'all' ? '0 2px 5px rgba(0,0,0,0.06)' : 'none',
                borderRadius: 6,
                padding: '6px 12px'
              }}
            >
              All ({categories.length})
            </button>
            <button
              className="btn btn-sm"
              onClick={() => setStatusFilter('active')}
              style={{
                background: statusFilter === 'active' ? '#ffffff' : 'transparent',
                color: statusFilter === 'active' ? '#10b981' : 'var(--text-muted)',
                fontWeight: statusFilter === 'active' ? 700 : 500,
                border: 'none',
                boxShadow: statusFilter === 'active' ? '0 2px 5px rgba(0,0,0,0.06)' : 'none',
                borderRadius: 6,
                padding: '6px 12px'
              }}
            >
              Active ({activeCount})
            </button>
            <button
              className="btn btn-sm"
              onClick={() => setStatusFilter('inactive')}
              style={{
                background: statusFilter === 'inactive' ? '#ffffff' : 'transparent',
                color: statusFilter === 'inactive' ? '#ef4444' : 'var(--text-muted)',
                fontWeight: statusFilter === 'inactive' ? 700 : 500,
                border: 'none',
                boxShadow: statusFilter === 'inactive' ? '0 2px 5px rgba(0,0,0,0.06)' : 'none',
                borderRadius: 6,
                padding: '6px 12px'
              }}
            >
              Inactive ({categories.length - activeCount})
            </button>
          </div>

          <div style={{ display: 'flex', background: 'var(--bg-muted, #f1f5f9)', padding: 3, borderRadius: 8 }}>
            <button
              id="view-mode-cards"
              onClick={() => setViewMode('cards')}
              title="Cards Grid View"
              style={{
                background: viewMode === 'cards' ? '#ffffff' : 'transparent',
                color: viewMode === 'cards' ? 'var(--wa-green-dark, #075e54)' : 'var(--text-muted)',
                border: 'none',
                borderRadius: 6,
                padding: '6px 10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              id="view-mode-table"
              onClick={() => setViewMode('table')}
              title="Table View"
              style={{
                background: viewMode === 'table' ? '#ffffff' : 'transparent',
                color: viewMode === 'table' ? 'var(--wa-green-dark, #075e54)' : 'var(--text-muted)',
                border: 'none',
                borderRadius: 6,
                padding: '6px 10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredCategories.length === 0 && (
        <div className="card card-body" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <Layers size={48} style={{ color: 'var(--text-muted)', opacity: 0.5, margin: '0 auto 1rem' }} />
          <h3 style={{ margin: 0, fontWeight: 700 }}>No categories found</h3>
          <p style={{ color: 'var(--text-muted)', margin: '6px 0 1.5rem', fontSize: '0.9rem' }}>
            {searchQuery ? `No results matching "${searchQuery}"` : 'There are no categories matching the selected filter.'}
          </p>
          {searchQuery && (
            <button className="btn btn-outline" onClick={() => setSearchQuery('')}>
              Clear Search Query
            </button>
          )}
        </div>
      )}

      {/* CARDS GRID VIEW */}
      {viewMode === 'cards' && filteredCategories.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
          gap: '1.25rem'
        }}>
          {filteredCategories.map(cat => {
            const displayImg = getCategoryImageUrl(cat.name, cat.image_url)
            const emoji = getCategoryEmoji(cat.name)
            const mlName = cat.category_translations?.find(t => t.language_code === 'ml')?.name || getCategoryMalayalamName(cat.name)

            return (
              <div
                key={cat.id}
                id={`cat-card-${cat.id}`}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  border: '1.5px solid var(--border-color, rgba(0,0,0,0.08))',
                  position: 'relative'
                }}
              >
                {/* Card Cover Image Header */}
                <div style={{
                  position: 'relative',
                  width: '100%',
                  height: '170px',
                  backgroundColor: '#f1f5f9',
                  overflow: 'hidden'
                }}>
                  <img
                    src={displayImg}
                    alt={cat.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      transition: 'transform 0.3s ease'
                    }}
                    onError={(e) => {
                      // Fallback if image fails to load
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80'
                    }}
                  />
                  
                  {/* Subtle Gradient Overlay for contrast */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.65) 100%)'
                  }} />

                  {/* Top Bar inside Image: Display Order & Status Pill */}
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    right: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.65)',
                      backdropFilter: 'blur(6px)',
                      color: '#ffffff',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '4px 8px',
                      borderRadius: '8px',
                      letterSpacing: '0.5px'
                    }}>
                      #{cat.display_order ?? '—'}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleCategory(cat)
                      }}
                      title={cat.is_active ? 'Click to deactivate' : 'Click to activate'}
                      style={{
                        backgroundColor: cat.is_active ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)',
                        backdropFilter: 'blur(6px)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '20px',
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <span style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor: '#ffffff'
                      }} />
                      {cat.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  {/* Bottom Bar inside Image: Emoji & Malayalam Badge */}
                  <div style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      width: 38,
                      height: 38,
                      borderRadius: '50%',
                      backgroundColor: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                    }}>
                      {emoji}
                    </div>

                    <span style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      color: '#0f172a',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '8px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                    }}>
                      {mlName}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-base)' }}>
                      {cat.name}
                    </h3>
                  </div>

                  <p style={{
                    margin: '0 0 16px 0',
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    lineHeight: '1.45',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    flex: 1
                  }}>
                    {cat.description || 'Essential department items and retail staples.'}
                  </p>

                  {/* Metric Chips */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-muted, #f8fafc)',
                    marginBottom: '16px',
                    fontSize: '0.82rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-base)', fontWeight: 600 }}>
                      <Package size={15} color="var(--wa-green-dark, #075e54)" />
                      <span>{cat.item_count || 0} Blueprint Products</span>
                    </div>

                    <div style={{
                      backgroundColor: 'rgba(59, 130, 246, 0.12)',
                      color: '#2563eb',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '6px'
                    }}>
                      {cat.commission_percentage ?? 4.0}% Fee
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                    <button
                      id={`edit-cat-${cat.id}`}
                      className="btn btn-outline"
                      onClick={() => handleOpenEdit(cat)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        borderColor: 'var(--border-color, #cbd5e1)'
                      }}
                    >
                      <Edit3 size={15} />
                      <span>Edit & Image</span>
                    </button>

                    <button
                      id={`delete-cat-${cat.id}`}
                      onClick={() => deleteCategory(cat.id, cat.name)}
                      title="Delete Category"
                      style={{
                        width: '38px',
                        height: '38px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* COMPACT TABLE VIEW */}
      {viewMode === 'table' && filteredCategories.length > 0 && (
        <div style={{ overflowX: 'auto' }} className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>Image</th>
                <th style={{ width: 60 }}>Order</th>
                <th>Category Name</th>
                <th>മലയാളം (Malayalam)</th>
                <th>Commission %</th>
                <th>Blueprint Items</th>
                <th>Description</th>
                <th>Status</th>
                <th style={{ width: 120 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map(cat => {
                const displayImg = getCategoryImageUrl(cat.name, cat.image_url)
                const mlName = cat.category_translations?.find(t => t.language_code === 'ml')?.name || getCategoryMalayalamName(cat.name)

                return (
                  <tr key={cat.id} id={`cat-row-${cat.id}`}>
                    <td>
                      <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
                        <img
                          src={displayImg}
                          alt={cat.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    </td>
                    <td className="font-semibold" style={{ textAlign: 'center' }}>
                      #{cat.display_order ?? '—'}
                    </td>
                    <td className="font-medium">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{getCategoryEmoji(cat.name)}</span>
                        <span style={{ fontWeight: 700 }}>{cat.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#334155', fontWeight: 700 }}>
                        {mlName}
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#2563eb', fontWeight: 800 }}>
                        {cat.commission_percentage ?? 4.0}%
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--text-base)' }}>
                        {cat.item_count || 0} items
                      </span>
                    </td>
                    <td className="text-sm text-muted" style={{ maxWidth: 260, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {cat.description || '—'}
                    </td>
                    <td>
                      <span className={`badge ${cat.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {cat.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => handleOpenEdit(cat)}
                          title="Edit Category & Image"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => toggleCategory(cat)}
                          title={cat.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {cat.is_active ? <ToggleRight size={18} style={{ color: 'var(--wa-green-dark)' }} /> : <ToggleLeft size={18} />}
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{ background: 'rgba(239,68,68,.1)', color: 'var(--danger)', border: 'none' }}
                          onClick={() => deleteCategory(cat.id, cat.name)}
                          title="Delete"
                        >
                          <Trash2 size={14} />
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

      {/* EDIT / CREATE MODAL */}
      {modalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-surface, #ffffff)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '620px',
            maxHeight: '92vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1.5px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'sticky',
              top: 0,
              backgroundColor: 'var(--bg-surface, #ffffff)',
              zIndex: 10
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>
                  {isEditing ? 'Edit Category & Cover Image' : 'Create New Category'}
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Updates take effect across Web and Flutter mobile applications instantly.
                </p>
              </div>

              <button
                onClick={() => setModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '8px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCategory} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {formError && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#dc2626',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={18} />
                  <span>{formError}</span>
                </div>
              )}

              {/* IMAGE MANAGER SECTION */}
              <div>
                <label className="form-label" style={{ fontWeight: 700, marginBottom: '8px', display: 'block' }}>
                  Category Cover Image
                </label>

                <div style={{
                  display: 'flex',
                  gap: '16px',
                  flexWrap: 'wrap',
                  alignItems: 'flex-start'
                }}>
                  {/* Image Preview Box */}
                  <div style={{
                    width: '160px',
                    height: '110px',
                    borderRadius: '12px',
                    backgroundColor: '#f1f5f9',
                    overflow: 'hidden',
                    position: 'relative',
                    border: '1.5px solid var(--border-color, #cbd5e1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {formImageUrl ? (
                      <img
                        src={formImageUrl}
                        alt="Category Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80'
                        }}
                      />
                    ) : (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '8px' }}>
                        <ImageIcon size={28} style={{ opacity: 0.5, margin: '0 auto 4px' }} />
                        <span style={{ fontSize: '0.75rem', display: 'block' }}>No image set</span>
                      </div>
                    )}

                    {uploadingImage && (
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        gap: 6
                      }}>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Uploading...</span>
                      </div>
                    )}
                  </div>

                  {/* Upload and URL Controls */}
                  <div style={{ flex: 1, minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageFileChange}
                        accept="image/*"
                        style={{ display: 'none' }}
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontWeight: 700,
                          padding: '8px 14px',
                          borderRadius: '8px'
                        }}
                      >
                        <UploadCloud size={16} />
                        <span>Upload New Image</span>
                      </button>

                      {formImageUrl && (
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => setFormImageUrl('')}
                          style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            color: '#dc2626',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            fontSize: '0.8rem',
                            fontWeight: 600
                          }}
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Or paste an image URL (https://...)"
                        value={formImageUrl}
                        onChange={e => setFormImageUrl(e.target.value)}
                        style={{
                          width: '100%',
                          fontSize: '0.85rem',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1.5px solid var(--border-color, #cbd5e1)'
                        }}
                      />
                    </div>

                    {uploadError && (
                      <p style={{ margin: 0, color: '#dc2626', fontSize: '0.78rem' }}>
                        {uploadError}
                      </p>
                    )}

                    {/* Preset Picker */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Presets:</span>
                      {Object.keys(CATEGORY_VISUALS).slice(0, 5).map(catName => (
                        <button
                          key={catName}
                          type="button"
                          onClick={() => setFormImageUrl(CATEGORY_VISUALS[catName].imageUrl)}
                          style={{
                            background: 'none',
                            border: '1px dashed var(--border-color, #cbd5e1)',
                            borderRadius: '6px',
                            padding: '2px 6px',
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                            color: 'var(--text-base)'
                          }}
                        >
                          {CATEGORY_VISUALS[catName].emoji} {catName.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* NAME FIELDS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700, marginBottom: '6px', display: 'block' }}>
                    Category Name (English) *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. Fresh Vegetables"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid var(--border-color, #cbd5e1)',
                      fontSize: '0.92rem'
                    }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 700, marginBottom: '6px', display: 'block' }}>
                    മലയാളം പേര് (Malayalam Name)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. പച്ചക്കറികൾ"
                    value={formMalayalam}
                    onChange={e => setFormMalayalam(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid var(--border-color, #cbd5e1)',
                      fontSize: '0.92rem'
                    }}
                  />
                </div>
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="form-label" style={{ fontWeight: 700, marginBottom: '6px', display: 'block' }}>
                  Description
                </label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Department summary and category scope..."
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border-color, #cbd5e1)',
                    fontSize: '0.9rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* ORDER, COMMISSION & ACTIVE */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700, marginBottom: '6px', display: 'block' }}>
                    Display Order
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 1"
                    value={formOrder}
                    onChange={e => setFormOrder(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid var(--border-color, #cbd5e1)',
                      fontSize: '0.92rem'
                    }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 700, marginBottom: '6px', display: 'block' }}>
                    Commission Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    placeholder="e.g. 4.0"
                    value={formCommission}
                    onChange={e => setFormCommission(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid var(--border-color, #cbd5e1)',
                      fontSize: '0.92rem'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <label style={{ fontWeight: 700, marginBottom: '6px', display: 'block', fontSize: '0.85rem' }}>
                    Visibility
                  </label>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}>
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={e => setFormIsActive(e.target.checked)}
                      style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--wa-green-dark, #075e54)' }}
                    />
                    <span>Active in Market</span>
                  </label>
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                marginTop: '1rem',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-color, #e2e8f0)'
              }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setModalOpen(false)}
                  style={{ borderRadius: '8px', padding: '9px 18px', fontWeight: 600 }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={formSaving || uploadingImage}
                  style={{
                    backgroundColor: 'var(--wa-green-dark, #075e54)',
                    color: '#ffffff',
                    borderRadius: '8px',
                    padding: '9px 22px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Check size={16} />
                  <span>{formSaving ? 'Saving...' : isEditing ? 'Update Category' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
