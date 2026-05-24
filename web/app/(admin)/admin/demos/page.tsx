import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import DemoManagementClient from './DemoManagementClient'

export const metadata: Metadata = { title: 'Demo Templates' }

export default async function DemosPage() {
  const supabase = await createClient()
  const [{ data: demos }, { data: categories }, { data: units }] = await Promise.all([
    supabase.from('demo_items').select('id, name, sell_mode, default_image, category_id, unit_id').order('name'),
    supabase.from('categories').select('id, name').eq('is_active', true).order('name'),
    supabase.from('units').select('id, name, symbol').order('name'),
  ])

  return (
    <>
      <h1 className="panel-page-title">Demo Templates</h1>
      <DemoManagementClient
        demos={(demos ?? []) as any[]}
        categories={(categories ?? []) as any[]}
        units={(units ?? []) as any[]}
      />
    </>
  )
}
