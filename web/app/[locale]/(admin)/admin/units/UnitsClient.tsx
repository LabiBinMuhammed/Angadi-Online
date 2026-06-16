'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2 } from 'lucide-react'
import type { Unit, UnitGroup } from '@/types'

export default function UnitsClient({ units: initial, groups }: { units: Unit[]; groups: UnitGroup[] }) {
  const [units, setUnits] = useState(initial)
  const [form, setForm] = useState({ name: '', symbol: '', group: '', multiplier: '1' })
  const [saving, setSaving] = useState(false)
  const [addErr, setAddErr] = useState('')

  async function addUnit() {
    if (!form.name || !form.symbol || !form.group) {
      setAddErr('Name, symbol, and group are required.')
      return
    }
    setSaving(true)
    setAddErr('')
    const supabase = createClient()
    const { data, error } = await supabase
      .from('units')
      .insert({
        name: form.name.trim(),
        symbol: form.symbol.trim(),
        unit_group_id: form.group,
        base_multiplier: parseFloat(form.multiplier) || 1,
      })
      .select('*')
      .single()
    setSaving(false)
    if (error) { setAddErr(error.message); return }
    if (data) setUnits(prev => [...prev, data as Unit])
    setForm({ name: '', symbol: '', group: '', multiplier: '1' })
  }

  async function deleteUnit(id: string) {
    if (!window.confirm('Delete this unit? Any items referencing it may be affected.')) return
    const supabase = createClient()
    const { error } = await supabase.from('units').delete().eq('id', id)
    if (!error) setUnits(prev => prev.filter(u => u.id !== id))
  }

  return (
    <>
      {/* Add form */}
      <div className="card card-body" style={{ marginBottom: '1.25rem' }}>
        <p className="form-label" style={{ marginBottom: '.5rem', fontWeight: 700 }}>Add New Unit</p>
        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
          <input
            id="new-unit-name"
            className="form-input"
            placeholder="Name (e.g. Kilogram) *"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            style={{ flex: 2, minWidth: 140 }}
          />
          <input
            id="new-unit-symbol"
            className="form-input"
            placeholder="Symbol (e.g. kg) *"
            value={form.symbol}
            onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))}
            style={{ flex: 1, minWidth: 90 }}
          />
          <select
            id="new-unit-group"
            className="form-input"
            value={form.group}
            onChange={e => setForm(f => ({ ...f, group: e.target.value }))}
            style={{ flex: 2, minWidth: 140 }}
          >
            <option value="">— Unit Group * —</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <input
            id="new-unit-multiplier"
            className="form-input"
            placeholder="Base Multiplier"
            type="number"
            min="0"
            step="any"
            value={form.multiplier}
            onChange={e => setForm(f => ({ ...f, multiplier: e.target.value }))}
            style={{ flex: 1, minWidth: 110 }}
          />
          <button
            id="add-unit-btn"
            className="btn btn-primary"
            disabled={saving}
            onClick={addUnit}
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
              <th>Symbol</th>
              <th>Group</th>
              <th>Base Multiplier</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {units.map(u => (
              <tr key={u.id} id={`unit-row-${u.id}`}>
                <td className="font-medium">{u.name}</td>
                <td><code style={{ background: 'var(--wa-bg)', padding: '.1rem .4rem', borderRadius: 4 }}>{u.symbol}</code></td>
                <td className="text-sm text-muted">{groups.find(g => g.id === u.unit_group_id)?.name ?? '—'}</td>
                <td className="text-sm">{u.base_multiplier}</td>
                <td className="text-sm text-muted">
                  {u.updated_at ? new Date(u.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </td>
                <td>
                  <button
                    id={`delete-unit-${u.id}`}
                    className="btn btn-sm"
                    style={{ background: 'rgba(239,68,68,.1)', color: 'var(--danger)', border: 'none' }}
                    onClick={() => deleteUnit(u.id)}
                    title="Delete unit"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
