'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, Package, Loader2, ImagePlus } from 'lucide-react'
import imageCompression from 'browser-image-compression'

type Props = {
  shopId: string
  images: string[]
  onChange: (urls: string[]) => void
  maxImages?: number
}

export default function ImageUploader({ shopId, images, onChange, maxImages = 1 }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    
    if (images.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} image(s) allowed.`)
      return
    }

    await uploadFiles(files)
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (files.length === 0) return

    if (images.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} image(s) allowed.`)
      return
    }

    await uploadFiles(files)
  }

  const uploadFiles = async (files: File[]) => {
    setUploading(true)
    setError(null)
    const newUrls: string[] = []

    try {
      const { uploadImageAction } = await import('./ImageUploaderActions')

      for (const file of files) {
        // Compress image before upload
        const options = {
          maxSizeMB: 1, // Max 1MB
          maxWidthOrHeight: 1024,
          useWebWorker: true,
        }
        
        const compressedFile = await imageCompression(file, options)
        const ext = file.name.split('.').pop() || 'jpg'
        const path = `items/${shopId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`
        
        const formData = new FormData()
        formData.append('file', compressedFile, file.name)
        
        const publicUrl = await uploadImageAction(formData, path)
        newUrls.push(publicUrl)
      }
      
      onChange([...images, ...newUrls])
    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message || 'Failed to upload image. Please try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeImage = (index: number) => {
    const newImages = [...images]
    newImages.splice(index, 1)
    onChange(newImages)
  }

  return (
    <div className="vp-form-group">
      <label className="vp-label">Item Images {images.length}/{maxImages}</label>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Error message */}
        {error && (
          <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {/* Upload Zone */}
        {images.length < maxImages && (
          <div 
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{ 
              border: '2px dashed rgba(255,255,255,0.2)', 
              borderRadius: '16px', 
              padding: '2rem', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              cursor: 'pointer',
              background: 'rgba(0,0,0,0.1)',
              transition: 'all 0.2s',
              minHeight: '150px'
            }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
          >
            {uploading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: '#64748b' }}>
                <Loader2 size={32} className="vp-spin" />
                <span>Compressing & Uploading...</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: '#64748b' }}>
                <ImagePlus size={32} />
                <span>Click or drag and drop to upload</span>
                <span style={{ fontSize: '0.8rem' }}>Supports JPG, PNG, WEBP up to 5MB</span>
              </div>
            )}
            <input 
              type="file" 
              accept="image/*" 
              multiple={maxImages > 1}
              ref={fileInputRef} 
              style={{ display: 'none' }}
              onChange={handleFileChange} 
              disabled={uploading}
            />
          </div>
        )}

        {/* Image Previews */}
        {images.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem' }}>
            {images.map((url, i) => (
              <div key={i} style={{ position: 'relative', width: '100%', aspectRatio: '1/1', borderRadius: '12px', overflow: 'hidden', background: '#334155', border: '1px solid rgba(255,255,255,0.1)' }}>
                <img src={url} alt={`Preview ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button 
                  type="button" 
                  onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                  style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}
                >
                  <X size={14} />
                </button>
                {i === 0 && maxImages > 1 && (
                  <span style={{ position: 'absolute', bottom: 4, left: 4, background: '#3b82f6', color: '#fff', fontSize: '0.6rem', padding: '0.2rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>PRIMARY</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
