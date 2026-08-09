'use client'

import { useState, useRef } from 'react'
import { Upload, X, Loader2, ImagePlus, Link as LinkIcon } from 'lucide-react'
import imageCompression from 'browser-image-compression'

type Props = {
  label: string
  value: string
  onChange: (url: string) => void
  placeholder?: string
  aspectRatio?: 'square' | 'banner'
  helperText?: string
  id?: string
}

export default function FileUploadInput({
  label,
  value,
  onChange,
  placeholder = 'Click or drag image file here',
  aspectRatio = 'square',
  helperText,
  id
}: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadFile(file)
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = Array.from(e.dataTransfer.files).find(f => f.type.startsWith('image/'))
    if (!file) return
    await uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    setUploading(true)
    setError(null)
    try {
      const { uploadImageAction } = await import('./ImageUploaderActions')
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: aspectRatio === 'banner' ? 1200 : 800,
        useWebWorker: true,
      }
      const compressedFile = await imageCompression(file, options)
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `shops/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`

      const formData = new FormData()
      formData.append('file', compressedFile, file.name)

      const publicUrl = await uploadImageAction(formData, path)
      onChange(publicUrl)
    } catch (err: any) {
      console.error('File upload error:', err)
      setError(err.message || 'Failed to upload image file.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="vp-form-group">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
        <label className="vp-label" style={{ margin: 0 }}>{label}</label>
        {helperText && (
          <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            {helperText}
          </span>
        )}
      </div>

      {error && (
        <div style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', fontSize: '0.82rem', marginBottom: '0.5rem' }}>
          {error}
        </div>
      )}

      {value ? (
        /* Image Preview Box */
        <div style={{
          position: 'relative',
          width: '100%',
          height: aspectRatio === 'banner' ? '140px' : '130px',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1.5px solid rgba(255,255,255,0.15)',
          background: '#0f172a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <img src={value} alt={label} style={{ width: '100%', height: '100%', objectFit: aspectRatio === 'banner' ? 'cover' : 'contain' }} />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            padding: '0.75rem'
          }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: 'rgba(255,255,255,0.95)',
                color: '#0f172a',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}
            >
              <Upload size={14} /> Change File
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              style={{
                background: 'rgba(239,68,68,0.9)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}
            >
              <X size={14} /> Remove
            </button>
          </div>
        </div>
      ) : (
        /* Upload Drag & Drop Area */
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '2px dashed rgba(255,255,255,0.2)',
            borderRadius: '16px',
            padding: aspectRatio === 'banner' ? '1.5rem 1rem' : '1.75rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            background: 'rgba(0,0,0,0.15)',
            transition: 'all 0.15s ease',
            textAlign: 'center'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.borderColor = '#60a5fa';
            e.currentTarget.style.background = 'rgba(59,130,246,0.08)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
            e.currentTarget.style.background = 'rgba(0,0,0,0.15)';
          }}
        >
          {uploading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.9rem' }}>
              <Loader2 size={22} className="spinner" />
              <span>Uploading & compressing image file...</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'rgba(59,130,246,0.15)',
                color: '#60a5fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ImagePlus size={22} />
              </div>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>{placeholder}</span>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Supports JPG, PNG, WEBP files</span>
            </div>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        id={id}
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        disabled={uploading}
        style={{ display: 'none' }}
      />

      {/* Toggle Link Input Option */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.35rem' }}>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            fontSize: '0.78rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: 0,
            textDecoration: 'underline'
          }}
        >
          <LinkIcon size={12} /> {showUrlInput ? 'Hide link input' : 'Or paste URL link manually'}
        </button>
      </div>

      {showUrlInput && (
        <div style={{ marginTop: '0.4rem' }}>
          <input
            type="url"
            className="vp-input"
            style={{ fontSize: '0.85rem' }}
            placeholder="https://example.com/image.jpg"
            value={value}
            onChange={e => onChange(e.target.value)}
          />
        </div>
      )}
    </div>
  )
}
