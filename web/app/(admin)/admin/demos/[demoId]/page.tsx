import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import DemoDetailClient from './DemoDetailClient'
import type { DemoItem, DemoSellConfig, DemoVariant, Unit } from '@/types'

export const metadata: Metadata = { title: 'Manage Demo Template' }

export default async function DemoDetailPage({ params }: { params: { demoId: string } }) {
  const supabase = await createClient()
  
  const { demoId } = await params
  const [demoRes, configRes, variantsRes, unitsRes] = await Promise.all([
    supabase.from('demo_items').select('*').eq('id', demoId).single(),
    supabase.from('demo_sell_config').select('*').eq('demo_item_id', demoId).maybeSingle(),
    supabase.from('demo_variants').select('*').eq('demo_item_id', demoId).order('price', { ascending: true }),
    supabase.from('units').select('id, name, symbol')
  ])

  if (demoRes.error || !demoRes.data) return notFound()

  const demo = demoRes.data as DemoItem
  const sellConfig = (configRes.data || null) as DemoSellConfig | null
  const variants = (variantsRes.data || []) as DemoVariant[]
  const units = (unitsRes.data || []) as Unit[]

  return (
    <div className="admin-container">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <Link href="/admin/demos" className="btn btn-outline btn-sm" style={{ marginBottom: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <ArrowLeft size={16} /> Back to Demo Items
        </Link>
        <h1 className="page-title">Manage Demo Template: {demo.name}</h1>
        <p className="text-muted" style={{ marginTop: '0.5rem' }}>Configure strict pricing and variant rules for this base item.</p>
      </div>

      <DemoDetailClient 
        demo={demo} 
        initialConfig={sellConfig} 
        initialVariants={variants} 
        units={units} 
      />
    </div>
  )
}
