'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function uploadImageAction(formData: FormData, path: string, targetBucket?: string) {
  const file = formData.get('file') as File
  if (!file) throw new Error('No file provided')

  const supabase = createAdminClient()
  const arrayBuffer = await file.arrayBuffer()

  const bucket = targetBucket || (path.startsWith('replacements/') ? 'replacements' : 'item-images')

  let { error: upErr } = await supabase.storage.from(bucket).upload(path, arrayBuffer, {
    cacheControl: '3600',
    upsert: true,
    contentType: file.type || 'image/jpeg'
  })

  // Fallback to item-images if primary bucket fails
  if (upErr && bucket === 'replacements') {
    const fallbackRes = await supabase.storage.from('item-images').upload(path, arrayBuffer, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || 'image/jpeg'
    })
    if (!fallbackRes.error) {
      const { data } = supabase.storage.from('item-images').getPublicUrl(path)
      return data.publicUrl
    }
  }

  if (upErr) throw upErr

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}
