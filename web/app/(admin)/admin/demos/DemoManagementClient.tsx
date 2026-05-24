'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Settings } from 'lucide-react'
import Link from 'next/link'

type Demo     = { id: string; name: string; sell_mode: string; default_image?: string | null; category_id?: string | null; unit_id?: string | null }
type Category = { id: string; name: string }
type Unit     = { id: string; name: string; symbol: string }

const SELL_MODES = ['Manual', 'Fixed', 'Dynamic', 'Portion']

export default function DemoManagementClient({
  demos: initial,
  categories,
  units,
}: {
  demos: Demo[]
  categories: Category[]
  units: Unit[]
}) {
  const [demos, setDemos] = useState(initial)
  const [form, setForm] = useState({
    name: '',
    sell_mode: 'Manual',
    category_id: '',
    unit_id: '',
    default_image: '',
  })
  const [saving, setSaving] = useState(false)
  const [addErr, setAddErr] = useState('')

  async function addDemo() {
    if (!form.name.trim()) { setAddErr('Name is required.'); return }
    setSaving(true)
    setAddErr('')
    const supabase = createClient()
    const { data, error } = await supabase
      .from('demo_items')
      .insert({
        name:          form.name.trim(),
        sell_mode:     form.sell_mode,
        category_id:   form.category_id || null,
        unit_id:       form.unit_id || null,
        default_image: form.default_image.trim() || null,
      })
      .select('id, name, sell_mode, default_image, category_id, unit_id')
      .single()
    setSaving(false)
    if (error) { setAddErr(error.message); return }
    if (data) setDemos(prev => [...prev, data as Demo])
    setForm({ name: '', sell_mode: 'Manual', category_id: '', unit_id: '', default_image: '' })
  }

  async function deleteDemo(id: string) {
    if (!window.confirm('Delete this demo template?')) return
    const supabase = createClient()
    const { error } = await supabase.from('demo_items').delete().eq('id', id)
    if (!error) setDemos(prev => prev.filter(d => d.id !== id))
  }

  const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]))
  const unitMap = Object.fromEntries(units.map(u => [u.id, `${u.name} (${u.symbol})`]))

  return (
    <>
      {/* Add form */}
      <div className="card card-body" style={{ marginBottom: '1.25rem' }}>
        <p className="form-label" style={{ marginBottom: '.5rem', fontWeight: 700 }}>Add New Demo Template</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '.75rem' }}>
          <input
            id="demo-name"
            className="form-input"
            placeholder="Item name *"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />
          <select
            id="demo-sell-mode"
            className="form-input"
            value={form.sell_mode}
            onChange={e => setForm(f => ({ ...f, sell_mode: e.target.value }))}
          >
            {SELL_MODES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select
            id="demo-category"
            className="form-input"
            value={form.category_id}
            onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
          >
            <option value="">— Category —</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            id="demo-unit"
            className="form-input"
            value={form.unit_id}
            onChange={e => setForm(f => ({ ...f, unit_id: e.target.value }))}
          >
            <option value="">— Default Unit —</option>
            {units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>)}
          </select>
          <input
            id="demo-image"
            className="form-input"
            placeholder="Default image URL"
            value={form.default_image}
            onChange={e => setForm(f => ({ ...f, default_image: e.target.value }))}
          />
          <button
            id="add-demo-btn"
            className="btn btn-primary"
            disabled={saving || !form.name.trim()}
            onClick={addDemo}
            style={{ background: 'var(--wa-teal)', display: 'flex', alignItems: 'center', gap: '.4rem' }}
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
              <th>Sell Mode</th>
              <th>Category</th>
              <th>Default Unit</th>
              <th>Default Image</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {demos.map(d => (
              <tr key={d.id} id={`demo-row-${d.id}`}>
                <td className="font-medium">{d.name}</td>
                <td><span className="badge badge-info">{d.sell_mode}</span></td>
                <td className="text-sm text-muted">{d.category_id ? catMap[d.category_id] ?? '—' : '—'}</td>
                <td className="text-sm text-muted">{d.unit_id ? unitMap[d.unit_id] ?? '—' : '—'}</td>
                <td className="text-sm text-muted" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {d.default_image
                    ? <a href={d.default_image} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--wa-teal)' }}>View</a>
                    : '—'}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                    <Link
                      href={`/admin/demos/${d.id}`}
                      className="btn btn-sm btn-outline"
                      title="Manage Config & Variants"
                      style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}
                    >
                      <Settings size={14} /> Manage
                    </Link>
                    <button
                      id={`delete-demo-${d.id}`}
                      className="btn btn-sm"
                      style={{ background: 'rgba(239,68,68,.1)', color: 'var(--danger)', border: 'none', display: 'flex', alignItems: 'center' }}
                      onClick={() => deleteDemo(d.id)}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
