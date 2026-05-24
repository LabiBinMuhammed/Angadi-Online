'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { DemoItem, DemoSellConfig, DemoVariant, Unit } from '@/types'
import { Save, Plus, Trash2, AlertCircle } from 'lucide-react'

type Props = {
  demo: DemoItem
  initialConfig: DemoSellConfig | null
  initialVariants: DemoVariant[]
  units: Unit[]
}

export default function DemoDetailClient({ demo, initialConfig, initialVariants, units }: Props) {
  const [activeTab, setActiveTab] = useState<'config' | 'variants'>('config')

  // Sell Config State
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

  // Variants State
  const [variants, setVariants] = useState<Partial<DemoVariant>[]>(initialVariants)
  const [savingVariants, setSavingVariants] = useState(false)
  const [variantsMsg, setVariantsMsg] = useState({ type: '', text: '' })

  async function saveConfig(e: React.FormEvent) {
    e.preventDefault()
    setSavingConfig(true)
    setConfigMsg({ type: '', text: '' })
    
    // Strict Validation
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

    const supabase = createClient()
    const payload = {
      demo_item_id: demo.id,
      sell_mode: demo.sell_mode,
      base_unit_id: config.base_unit_id || null,
      allow_custom_quantity: config.allow_custom_quantity || false,
      price_per_base_unit: config.price_per_base_unit ? Number(config.price_per_base_unit) : 0,
      max_price_increase_percent: config.max_price_increase_percent ? Number(config.max_price_increase_percent) : 0,
      max_price_limit: config.max_price_limit ? Number(config.max_price_limit) : 0,
    }

    if (initialConfig) {
      const { error } = await supabase.from('demo_sell_config').update(payload).eq('id', initialConfig.id)
      if (error) setConfigMsg({ type: 'error', text: error.message })
      else setConfigMsg({ type: 'success', text: 'Sell configuration updated securely.' })
    } else {
      const { data, error } = await supabase.from('demo_sell_config').insert(payload).select().single()
      if (error) setConfigMsg({ type: 'error', text: error.message })
      else {
        setConfigMsg({ type: 'success', text: 'Sell configuration created securely.' })
        setConfig(data) // now it has an id
      }
    }
    setSavingConfig(false)
  }

  async function saveVariants() {
    setSavingVariants(true)
    setVariantsMsg({ type: '', text: '' })
    
    // Validation
    if (variants.some(v => !v.label)) {
      setVariantsMsg({ type: 'error', text: 'All variants must have a label.' })
      setSavingVariants(false)
      return
    }
    if (variants.length > 5) {
      setVariantsMsg({ type: 'error', text: 'Maximum 5 variants allowed to prevent frontend explosion.' })
      setSavingVariants(false)
      return
    }

    const supabase = createClient()
    
    // Simplest approach: Delete existing and re-insert to avoid complex diffing
    await supabase.from('demo_variants').delete().eq('demo_item_id', demo.id)
    
    if (variants.length > 0) {
      const payload = variants.map(v => ({
        demo_item_id: demo.id,
        variant_type: demo.sell_mode,
        label: v.label,
        unit_id: v.unit_id || null,
        value: v.value ? Number(v.value) : 1,
        price: v.price ? Number(v.price) : 0,
        is_default: v.is_default || false,
        is_active: v.is_active ?? true
      }))
      
      const { error } = await supabase.from('demo_variants').insert(payload)
      if (error) setVariantsMsg({ type: 'error', text: error.message })
      else setVariantsMsg({ type: 'success', text: 'Variants successfully updated.' })
    } else {
      setVariantsMsg({ type: 'success', text: 'All variants cleared.' })
    }
    setSavingVariants(false)
  }

  function addVariant() {
    if (variants.length >= 5) {
      setVariantsMsg({ type: 'error', text: 'Maximum 5 variants allowed.' })
      return
    }
    setVariants([...variants, {
      demo_item_id: demo.id,
      variant_type: demo.sell_mode,
      label: '',
      unit_id: demo.unit_id || '',
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
    
    // Ensure only one default
    if (key === 'is_default' && val === true) {
      newVars.forEach((v, i) => { if (i !== index) v.is_default = false })
    }
    
    setVariants(newVars)
  }

  function removeVariant(index: number) {
    const newVars = [...variants]
    newVars.splice(index, 1)
    if (newVars.length > 0 && variants[index].is_default) {
      newVars[0].is_default = true
    }
    setVariants(newVars)
  }

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '2rem' }}>
        <button 
          className="btn-ghost"
          style={{ 
            padding: '1rem', 
            fontWeight: activeTab === 'config' ? 700 : 400,
            borderBottom: activeTab === 'config' ? '2px solid var(--wa-green-dark)' : '2px solid transparent',
            color: activeTab === 'config' ? 'var(--wa-green-dark)' : 'inherit'
          }}
          onClick={() => setActiveTab('config')}
        >
          Sell Configuration
        </button>
        <button 
          className="btn-ghost"
          style={{ 
            padding: '1rem', 
            fontWeight: activeTab === 'variants' ? 700 : 400,
            borderBottom: activeTab === 'variants' ? '2px solid var(--wa-green-dark)' : '2px solid transparent',
            color: activeTab === 'variants' ? 'var(--wa-green-dark)' : 'inherit'
          }}
          onClick={() => setActiveTab('variants')}
        >
          Variants ({variants.length})
        </button>
      </div>

      {/* Sell Config Tab */}
      {activeTab === 'config' && (
        <form onSubmit={saveConfig} className="card card-body" style={{ maxWidth: 800 }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.5rem', background: 'rgba(234, 179, 8, 0.1)', padding: '1rem', borderRadius: '8px', color: '#854d0e', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
            <AlertCircle size={20} />
            <div className="text-sm">
              <p><b>Dangerous Form:</b> Modifying these settings alters the pricing engine behavior for all future items created from this template. Strict validation applies.</p>
              {demo.sell_mode === 'Manual' && (
                <p style={{ marginTop: '0.5rem', fontWeight: 600 }}>Note: For Manual Mode, "Base Unit" and "Default Price per Base Unit" are the primary pricing settings. Variants are not used.</p>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Base Unit</label>
              <select className="form-input" value={config.base_unit_id} onChange={e => setConfig({...config, base_unit_id: e.target.value})}>
                <option value="">— Select Unit —</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Default Price per Base Unit</label>
              <input type="number" step="0.01" min="0" className="form-input" value={config.price_per_base_unit} onChange={e => setConfig({...config, price_per_base_unit: Number(e.target.value)})} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Max Price Increase (%)</label>
              <input type="number" step="1" min="0" max="100" className="form-input" value={config.max_price_increase_percent} onChange={e => setConfig({...config, max_price_increase_percent: Number(e.target.value)})} />
            </div>
            <div className="form-group">
              <label className="form-label">Hard Price Limit (Max Price)</label>
              <input type="number" step="0.01" min="0" className="form-input" value={config.max_price_limit} onChange={e => setConfig({...config, max_price_limit: Number(e.target.value)})} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={config.allow_custom_quantity} onChange={e => setConfig({...config, allow_custom_quantity: e.target.checked})} style={{ width: 18, height: 18, accentColor: 'var(--wa-green-dark)' }} />
              <span className="font-medium">Allow Custom Quantity Checkout</span>
            </label>
            <p className="text-sm text-muted" style={{ marginLeft: '1.9rem', marginTop: '0.25rem' }}>If enabled, buyers can type exact amounts (e.g. 1.25kg) if the unit supports it.</p>
          </div>

          {configMsg.text && (
            <div style={{ padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', background: configMsg.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', color: configMsg.type === 'error' ? 'var(--danger)' : 'var(--wa-green-dark)' }}>
              {configMsg.text}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={savingConfig} style={{ background: 'var(--wa-green-dark)' }}>
            <Save size={18} /> {savingConfig ? 'Saving...' : 'Save Configuration'}
          </button>
        </form>
      )}

      {/* Variants Tab */}
      {activeTab === 'variants' && (
        <div className="card card-body" style={{ maxWidth: 800 }}>
          {demo.sell_mode === 'Manual' ? (
            <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--bg-muted)', borderRadius: '12px' }}>
              <AlertCircle size={48} color="var(--wa-green-dark)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <h3 style={{ marginBottom: '0.5rem' }}>Variants Not Available</h3>
              <p className="text-muted">Manual mode does not use variants. Pricing is strictly based on the Base Unit and Price defined in the Sell Configuration.</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <p className="form-label">Standard Variants (Max 5)</p>
                {variants.length < 5 && (
                  <button onClick={addVariant} className="btn btn-sm btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Plus size={14} /> Add Variant
                  </button>
                )}
              </div>

              {variants.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--bg-muted)', borderRadius: '12px' }}>
                  <p className="text-muted">No variants configured. Vendors will have to create them manually.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {variants.map((v, i) => (
                    <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '1.5rem', background: 'var(--bg-muted)', borderRadius: '12px', position: 'relative' }}>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div className="form-group">
                            <label className="form-label">Label (e.g. 500g, Large)</label>
                            <input className="form-input" value={v.label} onChange={e => updateVariant(i, 'label', e.target.value)} placeholder="Variant Label" required />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Default Price</label>
                            <input type="number" step="0.01" min="0" className="form-input" value={v.price} onChange={e => updateVariant(i, 'price', e.target.value)} />
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input type="radio" checked={v.is_default} onChange={() => updateVariant(i, 'is_default', true)} style={{ accentColor: 'var(--wa-green-dark)' }} />
                            <span className="text-sm font-medium">Default Option</span>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={v.is_active} onChange={e => updateVariant(i, 'is_active', e.target.checked)} style={{ accentColor: 'var(--wa-green-dark)' }} />
                            <span className="text-sm font-medium">Active</span>
                          </label>
                        </div>

                      </div>
                      
                      <button onClick={() => removeVariant(i)} className="btn-ghost" style={{ color: 'var(--danger)', padding: '0.5rem' }} title="Remove variant">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {variantsMsg.text && (
                <div style={{ padding: '1rem', borderRadius: '8px', marginTop: '1.5rem', background: variantsMsg.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', color: variantsMsg.type === 'error' ? 'var(--danger)' : 'var(--wa-green-dark)' }}>
                  {variantsMsg.text}
                </div>
              )}

              <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                <button onClick={saveVariants} className="btn btn-primary" disabled={savingVariants} style={{ background: 'var(--wa-green-dark)' }}>
                  <Save size={18} /> {savingVariants ? 'Saving...' : 'Save Variants'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
