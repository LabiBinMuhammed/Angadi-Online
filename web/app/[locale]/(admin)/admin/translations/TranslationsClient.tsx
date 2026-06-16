'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Languages, Search, Sparkles, Save, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'

interface TranslationRow {
  language_code: string
  name?: string
  description?: string
  label?: string
}

interface Category {
  id: string
  name: string
  category_translations?: TranslationRow[]
}

interface DemoItem {
  id: string
  name: string
  demo_item_translations?: TranslationRow[]
}

interface Item {
  id: string
  name: string
  description?: string
  image_url?: string
  item_translations?: TranslationRow[]
  item_variants?: Variant[]
}

interface Variant {
  id: string
  label: string
  variant_translations?: TranslationRow[]
}

interface Props {
  initialCategories: Category[]
  initialDemoItems: DemoItem[]
  locale: string
}

type Tab = 'categories' | 'demo_items' | 'items'

export default function TranslationsClient({ initialCategories, initialDemoItems, locale }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('categories')
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [demoItems, setDemoItems] = useState<DemoItem[]>(initialDemoItems)
  const [items, setItems] = useState<Item[]>([])
  
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingItems, setLoadingItems] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [translatingId, setTranslatingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  
  // Expanded states for items to display their variants
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null)

  const supabase = createClient()

  // Input states for translations (holds edited values before saving)
  const [inputs, setInputs] = useState<Record<string, Record<string, string>>>({})

  // Initialize input states for categories & demo items
  useEffect(() => {
    const newInputs: Record<string, Record<string, string>> = {}
    
    categories.forEach(cat => {
      newInputs[cat.id] = {
        ml: cat.category_translations?.find(t => t.language_code === 'ml')?.name || '',
        hi: cat.category_translations?.find(t => t.language_code === 'hi')?.name || '',
        ar: cat.category_translations?.find(t => t.language_code === 'ar')?.name || '',
      }
    })

    demoItems.forEach(demo => {
      newInputs[demo.id] = {
        ml: demo.demo_item_translations?.find(t => t.language_code === 'ml')?.name || '',
        hi: demo.demo_item_translations?.find(t => t.language_code === 'hi')?.name || '',
        ar: demo.demo_item_translations?.find(t => t.language_code === 'ar')?.name || '',
      }
    })

    setInputs(prev => ({ ...prev, ...newInputs }))
  }, [categories, demoItems])

  // Search/fetch items
  const handleItemSearch = async (query: string) => {
    setLoadingItems(true)
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*, item_translations(*), item_variants(*, variant_translations(*))')
        .ilike('name', `%${query}%`)
        .limit(20)

      if (error) throw error
      
      setItems(data || [])
      
      // Load inputs for items and their variants
      const newInputs: Record<string, Record<string, string>> = {}
      data?.forEach((item: any) => {
        newInputs[item.id] = {
          ml_name: item.item_translations?.find((t: any) => t.language_code === 'ml')?.name || '',
          ml_desc: item.item_translations?.find((t: any) => t.language_code === 'ml')?.description || '',
          hi_name: item.item_translations?.find((t: any) => t.language_code === 'hi')?.name || '',
          hi_desc: item.item_translations?.find((t: any) => t.language_code === 'hi')?.description || '',
          ar_name: item.item_translations?.find((t: any) => t.language_code === 'ar')?.name || '',
          ar_desc: item.item_translations?.find((t: any) => t.language_code === 'ar')?.description || '',
        }
        item.item_variants?.forEach((v: any) => {
          newInputs[v.id] = {
            ml: v.variant_translations?.find((t: any) => t.language_code === 'ml')?.label || '',
            hi: v.variant_translations?.find((t: any) => t.language_code === 'hi')?.label || '',
            ar: v.variant_translations?.find((t: any) => t.language_code === 'ar')?.label || '',
          }
        })
      })
      setInputs(prev => ({ ...prev, ...newInputs }))
    } catch (e: any) {
      console.error(e)
      setMessage({ text: `Failed to load items: ${e.message}`, type: 'error' })
    } finally {
      setLoadingItems(false)
    }
  }

  // Trigger search on query change
  useEffect(() => {
    if (activeTab === 'items') {
      const timer = setTimeout(() => {
        handleItemSearch(searchQuery)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [searchQuery, activeTab])

  // Save manual inputs to database
  const saveCategoryTranslation = async (categoryId: string) => {
    setSavingId(categoryId)
    setMessage(null)
    const vals = inputs[categoryId] || {}
    try {
      for (const lang of ['ml', 'hi', 'ar']) {
        const nameVal = vals[lang]?.trim()
        if (nameVal) {
          const { error } = await supabase
            .from('category_translations')
            .upsert({
              category_id: categoryId,
              language_code: lang,
              name: nameVal
            }, {
              onConflict: 'category_id,language_code'
            })
          if (error) throw error
        }
      }
      setMessage({ text: 'Category translations saved successfully!', type: 'success' })
    } catch (e: any) {
      setMessage({ text: `Save failed: ${e.message}`, type: 'error' })
    } finally {
      setSavingId(null)
    }
  }

  const saveDemoItemTranslation = async (demoId: string) => {
    setSavingId(demoId)
    setMessage(null)
    const vals = inputs[demoId] || {}
    try {
      for (const lang of ['ml', 'hi', 'ar']) {
        const nameVal = vals[lang]?.trim()
        if (nameVal) {
          const { error } = await supabase
            .from('demo_item_translations')
            .upsert({
              demo_item_id: demoId,
              language_code: lang,
              name: nameVal
            }, {
              onConflict: 'demo_item_id,language_code'
            })
          if (error) throw error
        }
      }
      setMessage({ text: 'Template translations saved successfully!', type: 'success' })
    } catch (e: any) {
      setMessage({ text: `Save failed: ${e.message}`, type: 'error' })
    } finally {
      setSavingId(null)
    }
  }

  const saveItemTranslation = async (itemId: string, item: Item) => {
    setSavingId(itemId)
    setMessage(null)
    const vals = inputs[itemId] || {}
    try {
      // 1. Save product translations
      for (const lang of ['ml', 'hi', 'ar']) {
        const nameVal = vals[`${lang}_name`]?.trim()
        const descVal = vals[`${lang}_desc`]?.trim()
        
        if (nameVal || descVal) {
          const { error } = await supabase
            .from('item_translations')
            .upsert({
              item_id: itemId,
              language_code: lang,
              name: nameVal || item.name,
              description: descVal || ''
            }, {
              onConflict: 'item_id,language_code'
            })
          if (error) throw error
        }
      }

      // 2. Save variant translations if any
      if (item.item_variants) {
        for (const v of item.item_variants) {
          const varVals = inputs[v.id] || {}
          for (const lang of ['ml', 'hi', 'ar']) {
            const labelVal = varVals[lang]?.trim()
            if (labelVal) {
              const { error } = await supabase
                .from('variant_translations')
                .upsert({
                  variant_id: v.id,
                  language_code: lang,
                  label: labelVal
                }, {
                  onConflict: 'variant_id,language_code'
                })
              if (error) throw error
            }
          }
        }
      }

      setMessage({ text: 'Product & variant translations saved successfully!', type: 'success' })
    } catch (e: any) {
      setMessage({ text: `Save failed: ${e.message}`, type: 'error' })
    } finally {
      setSavingId(null)
    }
  }

  // Trigger AI Auto-Translation API
  const handleAiTranslate = async (type: Tab | 'variant', id: string, name: string, description?: string) => {
    setTranslatingId(id)
    setMessage(null)
    
    // Map tab type to API type
    const apiType = type === 'demo_items' ? 'demo_item' : type === 'categories' ? 'category' : type === 'items' ? 'item' : type

    try {
      const fields = apiType === 'variant'
        ? { label: name }
        : { name, description: description || '' }

      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: apiType,
          id,
          fields
        })
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'API call failed')

      setMessage({ text: 'AI Translations generated and saved!', type: 'success' })
      
      // Update inputs state locally with translated values
      const trans = result.translations
      const newInputs = { ...inputs }

      if (apiType === 'category' || apiType === 'demo_item') {
        newInputs[id] = {
          ml: trans.ml.name,
          hi: trans.hi.name,
          ar: trans.ar.name,
        }
      } else if (apiType === 'item') {
        newInputs[id] = {
          ml_name: trans.ml.name,
          ml_desc: trans.ml.description,
          hi_name: trans.hi.name,
          hi_desc: trans.hi.description,
          ar_name: trans.ar.name,
          ar_desc: trans.ar.description,
        }
      } else if (apiType === 'variant') {
        newInputs[id] = {
          ml: trans.ml.label,
          hi: trans.hi.label,
          ar: trans.ar.label,
        }
      }
      setInputs(newInputs)
    } catch (e: any) {
      setMessage({ text: `AI Translation failed: ${e.message}`, type: 'error' })
    } finally {
      setTranslatingId(null)
    }
  }

  const updateInput = (id: string, key: string, value: string) => {
    setInputs(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [key]: value
      }
    }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', padding: '1.5rem 0' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
            <Languages size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0 }}>Translation Settings</h1>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>Review and manage multilingual translations across Malayalam, Hindi, and Arabic</p>
          </div>
        </div>
      </div>

      {message && (
        <div style={{
          padding: '1rem',
          borderRadius: '12px',
          background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          color: message.type === 'success' ? '#34d399' : '#f87171',
          border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.9rem'
        }}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.35rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <button onClick={() => { setActiveTab('categories'); setMessage(null) }}
          style={{ flex: 1, padding: '0.65rem 1rem', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', border: 'none', background: activeTab === 'categories' ? 'rgba(255,255,255,0.08)' : 'transparent', color: activeTab === 'categories' ? '#fff' : '#94a3b8' }}>
          Categories ({categories.length})
        </button>
        <button onClick={() => { setActiveTab('demo_items'); setMessage(null) }}
          style={{ flex: 1, padding: '0.65rem 1rem', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', border: 'none', background: activeTab === 'demo_items' ? 'rgba(255,255,255,0.08)' : 'transparent', color: activeTab === 'demo_items' ? '#fff' : '#94a3b8' }}>
          Demo Templates ({demoItems.length})
        </button>
        <button onClick={() => { setActiveTab('items'); setMessage(null) }}
          style={{ flex: 1, padding: '0.65rem 1rem', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', border: 'none', background: activeTab === 'items' ? 'rgba(255,255,255,0.08)' : 'transparent', color: activeTab === 'items' ? '#fff' : '#94a3b8' }}>
          Product Items
        </button>
      </div>

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {categories.map(cat => {
            const vals = inputs[cat.id] || {}
            const isSaving = savingId === cat.id
            const isTranslating = translatingId === cat.id

            return (
              <div key={cat.id} style={{ background: 'rgba(20,20,25,0.4)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: '#fff', fontSize: '1.05rem' }}>{cat.name}</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleAiTranslate('categories', cat.id, cat.name)} disabled={isTranslating}
                      style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(139, 92, 246, 0.12)', color: '#a78bfa', border: '1px solid rgba(139, 92, 246, 0.2)', cursor: 'pointer' }}>
                      <Sparkles size={14} /> {isTranslating ? 'Translating...' : 'AI Translate'}
                    </button>
                    <button onClick={() => saveCategoryTranslation(cat.id)} disabled={isSaving}
                      style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer' }}>
                      <Save size={14} /> {isSaving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Malayalam (ml)</label>
                    <input className="vp-input" value={vals.ml || ''} onChange={e => updateInput(cat.id, 'ml', e.target.value)} placeholder="മലയാളം പേര്" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '0.9rem', padding: '0.5rem 0.75rem' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Hindi (hi)</label>
                    <input className="vp-input" value={vals.hi || ''} onChange={e => updateInput(cat.id, 'hi', e.target.value)} placeholder="हिंदी नाम" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '0.9rem', padding: '0.5rem 0.75rem' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Arabic (ar)</label>
                    <input className="vp-input" value={vals.ar || ''} onChange={e => updateInput(cat.id, 'ar', e.target.value)} placeholder="الاسم بالعربية" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '0.9rem', padding: '0.5rem 0.75rem' }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Demo Templates Tab */}
      {activeTab === 'demo_items' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {demoItems.map(demo => {
            const vals = inputs[demo.id] || {}
            const isSaving = savingId === demo.id
            const isTranslating = translatingId === demo.id

            return (
              <div key={demo.id} style={{ background: 'rgba(20,20,25,0.4)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: '#fff', fontSize: '1.05rem' }}>{demo.name}</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleAiTranslate('demo_items', demo.id, demo.name)} disabled={isTranslating}
                      style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(139, 92, 246, 0.12)', color: '#a78bfa', border: '1px solid rgba(139, 92, 246, 0.2)', cursor: 'pointer' }}>
                      <Sparkles size={14} /> {isTranslating ? 'Translating...' : 'AI Translate'}
                    </button>
                    <button onClick={() => saveDemoItemTranslation(demo.id)} disabled={isSaving}
                      style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer' }}>
                      <Save size={14} /> {isSaving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Malayalam (ml)</label>
                    <input className="vp-input" value={vals.ml || ''} onChange={e => updateInput(demo.id, 'ml', e.target.value)} placeholder="മലയാളം പേര്" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '0.9rem', padding: '0.5rem 0.75rem' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Hindi (hi)</label>
                    <input className="vp-input" value={vals.hi || ''} onChange={e => updateInput(demo.id, 'hi', e.target.value)} placeholder="हिंदी नाम" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '0.9rem', padding: '0.5rem 0.75rem' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Arabic (ar)</label>
                    <input className="vp-input" value={vals.ar || ''} onChange={e => updateInput(demo.id, 'ar', e.target.value)} placeholder="الاسم بالعربية" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '0.9rem', padding: '0.5rem 0.75rem' }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Product Items Tab */}
      {activeTab === 'items' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: '1rem', color: '#64748b', display: 'flex', alignItems: 'center' }}>
              <Search size={18} />
            </span>
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search product items..."
              style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '0.95rem', padding: '0.75rem 1rem 0.75rem 2.5rem', color: '#fff', outline: 'none' }} />
          </div>

          {loadingItems ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Loading products...</div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', background: 'rgba(255,255,255,0.01)', borderRadius: '12px' }}>
              No product items found. Try searching above.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {items.map(item => {
                const vals = inputs[item.id] || {}
                const isSaving = savingId === item.id
                const isTranslating = translatingId === item.id
                const isExpanded = expandedItemId === item.id

                return (
                  <div key={item.id} style={{ background: 'rgba(20,20,25,0.4)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 40, height: 40, borderRadius: '8px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {item.image_url ? <img src={item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Languages size={18} />}
                        </div>
                        <div>
                          <span style={{ fontWeight: 700, color: '#fff', fontSize: '1.05rem', display: 'block' }}>{item.name}</span>
                          {item.description && <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.description.slice(0, 50)}...</span>}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {item.item_variants && item.item_variants.length > 0 && (
                          <button onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                            style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: 'none', cursor: 'pointer' }}>
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />} Variants ({item.item_variants.length})
                          </button>
                        )}
                        <button onClick={() => handleAiTranslate('items', item.id, item.name, item.description)} disabled={isTranslating}
                          style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(139, 92, 246, 0.12)', color: '#a78bfa', border: '1px solid rgba(139, 92, 246, 0.2)', cursor: 'pointer' }}>
                          <Sparkles size={14} /> {isTranslating ? 'Translating...' : 'AI Translate'}
                        </button>
                        <button onClick={() => saveItemTranslation(item.id, item)} disabled={isSaving}
                          style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer' }}>
                          <Save size={14} /> {isSaving ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '1rem' }}>
                      {/* Malayalam */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>Malayalam (ml)</span>
                        <input className="vp-input" value={vals.ml_name || ''} onChange={e => updateInput(item.id, 'ml_name', e.target.value)} placeholder="മലയാളം പേര്" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '0.85rem', padding: '0.5rem' }} />
                        <textarea className="vp-textarea" rows={2} value={vals.ml_desc || ''} onChange={e => updateInput(item.id, 'ml_desc', e.target.value)} placeholder="മലയാളം വിവരണം" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '0.8rem', padding: '0.5rem', resize: 'none' }} />
                      </div>
                      
                      {/* Hindi */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>Hindi (hi)</span>
                        <input className="vp-input" value={vals.hi_name || ''} onChange={e => updateInput(item.id, 'hi_name', e.target.value)} placeholder="हिंदी नाम" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '0.85rem', padding: '0.5rem' }} />
                        <textarea className="vp-textarea" rows={2} value={vals.hi_desc || ''} onChange={e => updateInput(item.id, 'hi_desc', e.target.value)} placeholder="हिंदी विवरण" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '0.8rem', padding: '0.5rem', resize: 'none' }} />
                      </div>

                      {/* Arabic */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>Arabic (ar)</span>
                        <input className="vp-input" value={vals.ar_name || ''} onChange={e => updateInput(item.id, 'ar_name', e.target.value)} placeholder="الاسم بالعربية" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '0.85rem', padding: '0.5rem' }} />
                        <textarea className="vp-textarea" rows={2} value={vals.ar_desc || ''} onChange={e => updateInput(item.id, 'ar_desc', e.target.value)} placeholder="التفاصيل بالعربية" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '0.8rem', padding: '0.5rem', resize: 'none' }} />
                      </div>
                    </div>

                    {/* Variant Translations (Nested panel) */}
                    {isExpanded && item.item_variants && item.item_variants.length > 0 && (
                      <div style={{ borderTop: '1px dashed rgba(255,255,255,0.08)', marginTop: '0.75rem', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '12px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>Variant Option Labels</span>
                        
                        {item.item_variants.map(v => {
                          const varVals = inputs[v.id] || {}
                          const isVarTranslating = translatingId === v.id
                          
                          return (
                            <div key={v.id} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr 0.4fr', gap: '0.75rem', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>{v.label} (Base)</span>
                              <input value={varVals.ml || ''} onChange={e => {
                                setInputs(prev => ({
                                  ...prev,
                                  [v.id]: { ...(prev[v.id] || {}), ml: e.target.value }
                                }))
                              }} placeholder="Malayalam label" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', fontSize: '0.8rem', padding: '0.4rem' }} />
                              
                              <input value={varVals.hi || ''} onChange={e => {
                                setInputs(prev => ({
                                  ...prev,
                                  [v.id]: { ...(prev[v.id] || {}), hi: e.target.value }
                                }))
                              }} placeholder="Hindi label" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', fontSize: '0.8rem', padding: '0.4rem' }} />
                              
                              <input value={varVals.ar || ''} onChange={e => {
                                setInputs(prev => ({
                                  ...prev,
                                  [v.id]: { ...(prev[v.id] || {}), ar: e.target.value }
                                }))
                              }} placeholder="Arabic label" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', fontSize: '0.8rem', padding: '0.4rem' }} />
                              
                              <button onClick={() => handleAiTranslate('variant', v.id, v.label)} disabled={isVarTranslating}
                                style={{ padding: '0.4rem', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(139, 92, 246, 0.1)', color: '#c084fc', border: '1px solid rgba(139, 92, 246, 0.15)', cursor: 'pointer' }} title="AI Translate Variant">
                                <Sparkles size={12} />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
