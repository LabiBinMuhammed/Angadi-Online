'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, AlertCircle, Camera, Trash2, Plus, Minus } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/I18nContext'
import { uploadImageAction } from '@/components/ImageUploaderActions'
import { createReplacementRequestAction } from '@/app/actions/replacements'

interface OrderItem {
  id: string
  item_id: string
  items: { name: string } | null
  item_variants: { label: string } | null
  requested_value: number
  actual_value: number | null
  estimated_price: number
  final_price: number | null
}

interface Props {
  order: any
  orderItems: OrderItem[]
  locale: string
}

export default function ReplacementRequestClient({ order, orderItems, locale }: Props) {
  const { t } = useTranslation()
  const router = useRouter()

  // Selected items state
  // Map of order_item_id -> quantity to replace
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({})
  const [reason, setReason] = useState('wrong_item')
  const [description, setDescription] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [success, setSuccess] = useState(false)

  // Toggle selection
  function handleToggleSelect(itemId: string, maxQty: number) {
    setSelectedItems(prev => {
      const copy = { ...prev }
      if (copy[itemId]) {
        delete copy[itemId]
      } else {
        copy[itemId] = 1
      }
      return copy
    })
  }

  // Adjust quantity
  function handleUpdateQty(itemId: string, change: number, maxQty: number) {
    setSelectedItems(prev => {
      const copy = { ...prev }
      if (!copy[itemId]) return prev
      const nextQty = copy[itemId] + change
      if (nextQty >= 1 && nextQty <= maxQty) {
        copy[itemId] = nextQty
      }
      return copy
    })
  }

  // Image Upload
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setErrorMsg('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const path = `replacements/${order.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
      const url = await uploadImageAction(formData, path)
      
      setImageUrls(prev => [...prev, url])
    } catch (err: any) {
      setErrorMsg(err.message || 'Image upload failed.')
    } finally {
      setUploading(false)
    }
  }

  // Remove uploaded image
  function handleRemoveImage(index: number) {
    setImageUrls(prev => prev.filter((_, i) => i !== index))
  }

  // Submit Request
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const itemPayload = Object.entries(selectedItems).map(([orderItemId, quantity]) => ({
      orderItemId,
      quantity
    }))

    if (itemPayload.length === 0) {
      setErrorMsg(t('replacements.select_items'))
      return
    }

    setSubmitting(true)
    setErrorMsg('')

    try {
      // Reason value mapping
      const mappedReason = reason === 'wrong_item' ? 'Wrong Item'
                         : reason === 'damaged' ? 'Damaged'
                         : reason === 'poor_quality' ? 'Poor Quality'
                         : reason === 'expired' ? 'Expired'
                         : reason === 'missing_item' ? 'Missing Item'
                         : 'Other'

      const res = await createReplacementRequestAction(
        order.id,
        mappedReason as any,
        description,
        imageUrls,
        itemPayload
      )

      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setSuccess(true)
        setTimeout(() => {
          router.push(`/${locale}/orders/${order.id}`)
          router.refresh()
        }, 2000)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Submission failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        body { background: var(--bg-base); }
        .page-container { width: 100%; max-width: 600px; margin: 0 auto; padding: 24px 24px 100px; }
        .header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
        .back-btn { width: 44px; height: 44px; border-radius: 50%; background: var(--bg-surface); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; color: var(--text-base); transition: all 0.2s; }
        .back-btn:hover { background: var(--bg-muted); }
        .title { font-size: 24px; font-weight: 800; color: var(--text-base); margin: 0; letter-spacing: -0.5px; }
        
        .card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 24px; padding: 24px; box-shadow: 0 8px 30px rgba(0,0,0,0.02); margin-bottom: 20px; }
        .card-title { font-size: 16px; font-weight: 800; color: var(--text-base); margin: 0 0 16px; display: flex; align-items: center; gap: 8px; }
        
        .item-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border); }
        .item-row:last-child { border-bottom: none; }
        
        .item-info { display: flex; align-items: center; gap: 12px; }
        .item-checkbox { width: 20px; height: 20px; border-radius: 6px; border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
        .item-checkbox.selected { background: var(--wa-green); border-color: var(--wa-green); color: #fff; }
        
        .qty-controls { display: flex; align-items: center; gap: 12px; background: var(--bg-base); padding: 4px 8px; border-radius: 20px; border: 1px solid var(--border); }
        .qty-btn { width: 28px; height: 28px; border-radius: 50%; border: none; background: var(--bg-surface); display: flex; align-items: center; justify-content: center; color: var(--text-base); cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        .qty-btn:active { transform: scale(0.95); }
        
        .form-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
        .form-label { font-size: 14px; font-weight: 700; color: var(--text-base); }
        .form-select, .form-input, .form-textarea { width: 100%; padding: 14px 16px; border-radius: 16px; border: 1px solid var(--border); background: var(--bg-base); color: var(--text-base); font-size: 15px; outline: none; transition: border-color 0.2s; }
        .form-select:focus, .form-input:focus, .form-textarea:focus { border-color: var(--wa-green); }
        
        .photo-upload-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 8px; }
        .photo-box { aspect-ratio: 1; border-radius: 16px; border: 1px solid var(--border); display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--bg-base); color: var(--text-muted); cursor: pointer; position: relative; overflow: hidden; transition: all 0.2s; }
        .photo-box:hover { border-color: var(--wa-green); color: var(--wa-green); }
        
        .photo-preview { width: 100%; height: 100%; object-fit: cover; }
        .remove-photo-btn { position: absolute; top: 4px; right: 4px; background: rgba(239, 68, 68, 0.9); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        
        .submit-btn { width: 100%; background: var(--wa-green); color: white; border: none; border-radius: 24px; padding: 16px; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 15px rgba(34, 197, 94, 0.2); }
        .submit-btn:hover { background: var(--wa-green-dark); }
        .submit-btn:disabled { background: var(--border); color: var(--text-muted); cursor: not-allowed; box-shadow: none; }
        
        .form-error { display: flex; align-items: center; gap: 8px; background: #fef2f2; color: #ef4444; padding: 12px 16px; border-radius: 16px; font-size: 14px; font-weight: 600; margin-bottom: 20px; border: 1px solid #fee2e2; }
        
        .success-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: var(--bg-base); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; z-index: 100; animation: fadeIn 0.3s ease-out; }
      ` }} />

      {success && (
        <div className="success-overlay">
          <CheckCircle2 size={64} color="var(--wa-green)" />
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: 'var(--text-base)' }}>
            {t('replacements.request_success')}
          </h2>
        </div>
      )}

      <div className="page-container">
        <div className="header">
          <Link href={`/${locale}/orders/${order.id}`} className="back-btn">
            <ArrowLeft size={20} />
          </</Link>
          <h1 className="title">{t('replacements.request_replacement')}</h1>
        </div>

        {errorMsg && (
          <div className="form-error">
            <AlertCircle size={20} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="card">
            <h2 className="card-title">{t('replacements.select_items')}</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {orderItems.map(item => {
                const maxQty = item.actual_value ?? item.requested_value
                const isSelected = !!selectedItems[item.id]
                const itemQty = selectedItems[item.id] || 1

                return (
                  <div key={item.id} className="item-row">
                    <div className="item-info">
                      <div 
                        className={`item-checkbox ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleToggleSelect(item.id, maxQty)}
                      >
                        {isSelected && '✓'}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '15px', color: 'var(--text-base)' }}>
                          {item.items?.name}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-light)' }}>
                          {item.item_variants?.label || `${maxQty} units`}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="qty-controls">
                        <button 
                          type="button" 
                          className="qty-btn"
                          onClick={() => handleUpdateQty(item.id, -1, maxQty)}
                          disabled={itemQty <= 1}
                        >
                          <Minus size={14} />
                        </button>
                        <span style={{ fontWeight: 700, minWidth: '16px', textAlign: 'center', color: 'var(--text-base)' }}>
                          {itemQty}
                        </span>
                        <button 
                          type="button" 
                          className="qty-btn"
                          onClick={() => handleUpdateQty(item.id, 1, maxQty)}
                          disabled={itemQty >= maxQty}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="card">
            <div className="form-group">
              <label className="form-label">{t('replacements.reason_label')}</label>
              <select 
                className="form-select"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <option value="wrong_item">{t('replacements.wrong_item')}</option>
                <option value="damaged">{t('replacements.damaged')}</option>
                <option value="poor_quality">{t('replacements.poor_quality')}</option>
                <option value="expired">{t('replacements.expired')}</option>
                <option value="missing_item">{t('replacements.missing_item')}</option>
                <option value="other">{t('replacements.other')}</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{t('replacements.description_label')}</label>
              <textarea 
                className="form-textarea"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('replacements.description_placeholder')}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('replacements.upload_photos')}</label>
              <div className="photo-upload-grid">
                {imageUrls.map((url, index) => (
                  <div key={index} className="photo-box">
                    <img src={url} alt={`proof-${index}`} className="photo-preview" />
                    <button 
                      type="button" 
                      className="remove-photo-btn"
                      onClick={() => handleRemoveImage(index)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                
                {imageUrls.length < 4 && (
                  <label className="photo-box" style={{ cursor: uploading ? 'not-allowed' : 'pointer' }}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                      disabled={uploading}
                    />
                    {uploading ? (
                      <span className="spinner" style={{ width: 20, height: 20 }} />
                    ) : (
                      <>
                        <Camera size={24} />
                        <span style={{ fontSize: '11px', marginTop: '4px', fontWeight: 600 }}>
                          Add Photo
                        </span>
                      </>
                    )}
                  </label>
                )}
              </div>
            </div>
          </div>

          {order.shops?.replacement_policy && (
            <div className="card" style={{ background: 'rgba(76, 217, 100, 0.05)', border: '1px solid rgba(76, 217, 100, 0.2)' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 800, color: 'var(--wa-green-dark)' }}>
                {t('replacements.replacement_policy')}
              </h3>
              <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5, color: 'var(--text-base)' }}>
                {order.shops.replacement_policy}
              </p>
            </div>
          )}

          <button 
            type="submit" 
            className="submit-btn"
            disabled={submitting || Object.keys(selectedItems).length === 0}
          >
            {submitting ? (
              <>
                <span className="spinner" style={{ width: 16, height: 16 }} />
                <span>{t('replacements.submitting')}</span>
              </>
            ) : (
              <span>{t('replacements.submit_request')}</span>
            )}
          </button>
        </form>
      </div>
    </>
  )
}
