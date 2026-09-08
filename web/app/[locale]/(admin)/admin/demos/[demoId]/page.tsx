import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import DemoDetailClient from './DemoDetailClient'
import type { DemoItem, DemoSellConfig, DemoVariant, Unit } from '@/types'

export const metadata: Metadata = { title: 'Manage Master Catalog Template | Angadi Admin' }

export default async function DemoDetailPage({ params }: { params: Promise<{ demoId: string }> }) {
  const supabase = await createClient()
  
  const { demoId } = await params
  const [demoRes, configRes, variantsRes, unitsRes, catRes, transRes] = await Promise.all([
    supabase.from('demo_items').select('*').eq('id', demoId).single(),
    supabase.from('demo_sell_config').select('*').eq('demo_item_id', demoId).maybeSingle(),
    supabase.from('demo_variants').select('*').eq('demo_item_id', demoId).order('price', { ascending: true }),
    supabase.from('units').select('id, name, symbol, base_multiplier').order('name', { ascending: true }),
    supabase.from('categories').select('id, name, display_order').order('display_order', { ascending: true }),
    supabase.from('demo_item_translations').select('*').eq('demo_item_id', demoId).eq('language_code', 'ml').maybeSingle()
  ])

  if (demoRes.error || !demoRes.data) return notFound()

  const demo = demoRes.data as DemoItem
  const sellConfig = (configRes.data || null) as DemoSellConfig | null
  const variants = (variantsRes.data || []) as DemoVariant[]
  const units = (unitsRes.data || []) as Unit[]
  const categories = (catRes.data || []) as Array<{ id: string; name: string }>
  const initialMalayalam = transRes.data?.name || ''

  return (
    <div className="admin-container" style={{ padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <Link 
          href="/admin/demos" 
          style={{ 
            marginBottom: '1rem', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            color: 'var(--text-muted, #94a3b8)',
            fontSize: '0.875rem',
            textDecoration: 'none',
            padding: '0.4rem 0.8rem',
            borderRadius: '8px',
            background: 'var(--bg-muted, rgba(255, 255, 255, 0.04))',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            fontWeight: 600
          }}
        >
          <ArrowLeft size={16} /> Back to Master Templates
        </Link>
      </div>

      <DemoDetailClient 
        demo={demo} 
        initialConfig={sellConfig} 
        initialVariants={variants} 
        units={units} 
        categories={categories}
        initialMalayalam={initialMalayalam}
      />
    </div>
  )
}
