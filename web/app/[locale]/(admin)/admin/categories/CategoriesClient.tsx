'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, X, Edit2, Check, Trash2 } from 'lucide-react'
import type { Category } from '@/types'

export default function CategoriesClient({ categories: initial }: { categories: Category[] }) {
  const [categories, setCategories] = useState(initial)

  // Add form
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [saving, setSaving]   = useState(false)
  const [addErr, setAddErr]   = useState('')

  // Edit inline
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [editName, setEditName]     = useState('')
  const [editDesc, setEditDesc]     = useState('')
  const [editSaving, setEditSaving] = useState(false)

  async function addCategory() {
    if (!newName.trim()) return
    setSaving(true)
    setAddErr('')
    const supabase = createClient()
    const { data, error } = await supabase
      .from('categories')
      .insert({ name: newName.trim(), description: newDesc.trim() || null, is_active: true })
      .select('*')
      .single()
    setSaving(false)
    if (error) { setAddErr(error.message); return }
    if (data) setCategories(prev => [...prev, data as Category])
    setNewName('')
    setNewDesc('')
  }

  async function toggleCategory(cat: Category) {
    const supabase = createClient()
    const next = !cat.is_active
    await supabase.from('categories').update({ is_active: next }).eq('id', cat.id)
    setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, is_active: next } : c))
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id)
    setEditName(cat.name)
    setEditDesc(cat.description ?? '')
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return
    setEditSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('categories')
      .update({ name: editName.trim(), description: editDesc.trim() || null })
      .eq('id', id)
    setEditSaving(false)
    if (error) return
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name: editName.trim(), description: editDesc.trim() || undefined } as Category : c))
    setEditingId(null)
  }

  async function deleteCategory(id: string) {
    if (!window.confirm('Delete this category? Items using it will lose their category.')) return
    const supabase = createClient()
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (!error) setCategories(prev => prev.filter(c => c.id !== id))
  }

  return (
    <>
      {/* Add form */}
      <div className="card card-body" style={{ marginBottom: '1.25rem' }}>
        <p className="form-label" style={{ marginBottom: '.5rem', fontWeight: 700 }}>Add New Category</p>
        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
          <input
            id="new-cat-name"
            className="form-input"
            value={newName}
            placeholder="Category name *"
            onChange={e => setNewName(e.target.value)}
            style={{ flex: 1, minWidth: 160 }}
          />
          <input
            id="new-cat-desc"
            className="form-input"
            value={newDesc}
            placeholder="Description (optional)"
            onChange={e => setNewDesc(e.target.value)}
            style={{ flex: 2, minWidth: 200 }}
          />
          <button
            id="add-category-btn"
            className="btn btn-primary"
            disabled={saving || !newName.trim()}
            onClick={addCategory}
            style={{ background: 'var(--wa-green-dark)', display: 'flex', alignItems: 'center', gap: '.4rem' }}
          >
            <Plus size={16} />{saving ? 'Adding…' : 'Add'}
          </button>
        </div>
        {addErr && <p className="form-error" style={{ marginTop: '.5rem' }}>{addErr}</p>}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Status</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => (
              <tr key={cat.id} id={`cat-row-${cat.id}`}>
                {editingId === cat.id ? (
                  <>
                    <td>
                      <input
                        className="form-input"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        style={{ padding: '.4rem .6rem', fontSize: '.9rem' }}
                        autoFocus
                      />
                    </td>
                    <td>
                      <input
                        className="form-input"
                        value={editDesc}
                        onChange={e => setEditDesc(e.target.value)}
                        style={{ padding: '.4rem .6rem', fontSize: '.9rem' }}
                      />
                    </td>
                    <td colSpan={2} />
                    <td>
                      <div style={{ display: 'flex', gap: '.4rem' }}>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => saveEdit(cat.id)}
                          disabled={editSaving}
                          style={{ background: 'var(--wa-green-dark)' }}
                        >
                          <Check size={14} />
                        </button>
                        <button className="btn btn-sm btn-outline" onClick={() => setEditingId(null)}>
                          <X size={14} />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="font-medium">{cat.name}</td>
                    <td className="text-sm text-muted">{cat.description ?? '—'}</td>
                    <td>
                      <span className={`badge ${cat.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {cat.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-sm text-muted">
                      {cat.updated_at ? new Date(cat.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '.4rem' }}>
                        <button
                          id={`edit-cat-${cat.id}`}
                          className="btn btn-sm btn-outline"
                          onClick={() => startEdit(cat)}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          id={`toggle-cat-${cat.id}`}
                          className="btn btn-sm btn-outline"
                          onClick={() => toggleCategory(cat)}
                        >
                          {cat.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          id={`delete-cat-${cat.id}`}
                          className="btn btn-sm"
                          style={{ background: 'rgba(239,68,68,.1)', color: 'var(--danger)', border: 'none' }}
                          onClick={() => deleteCategory(cat.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
