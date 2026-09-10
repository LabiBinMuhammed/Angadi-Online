import { Suspense } from 'react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import DemoManagementClient from './DemoManagementClient'

export const metadata: Metadata = { title: 'Demo Templates | Angadi Admin' }

export default async function DemosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const [{ data: demos }, { data: categories }, { data: units }] = await Promise.all([
    supabase.from('demo_items').select('id, name, sell_mode, default_image, category_id, unit_id, code, display_order').order('name'),
    supabase.from('categories').select('id, name, is_active').order('display_order', { ascending: true }),
    supabase.from('units').select('id, name, symbol').order('name'),
  ])

  return (
    <>
      <h1 className="panel-page-title">Demo Templates</h1>
      <Suspense fallback={<div style={{ padding: '2rem', color: '#94a3b8' }}>Loading templates...</div>}>
        <DemoManagementClient
          demos={(demos ?? []) as any[]}
          categories={(categories ?? []) as any[]}
          units={(units ?? []) as any[]}
          locale={locale || 'en'}
        />
      </Suspense>
    </>
  )
}

