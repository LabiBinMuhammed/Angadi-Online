'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function uploadImageAction(formData: FormData, path: string) {
  const file = formData.get('file') as File
  if (!file) throw new Error('No file provided')

  const supabase = createAdminClient()

  const arrayBuffer = await file.arrayBuffer()

  const { error: upErr } = await supabase.storage.from('item-images').upload(path, arrayBuffer, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type
  })

  if (upErr) throw upErr

  const { data } = supabase.storage.from('item-images').getPublicUrl(path)
  return data.publicUrl
}
