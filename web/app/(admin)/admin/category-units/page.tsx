import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import CategoryUnitMappingClient from './CategoryUnitMappingClient'

export const metadata: Metadata = { title: 'Category-Unit Group Mapping' }

export default async function CategoryUnitsPage() {
  const supabase = await createClient()
  const [{ data: categories }, { data: unitGroups }, { data: mappings }] = await Promise.all([
    supabase.from('categories').select('id, name').eq('is_active', true).order('name'),
    supabase.from('unit_groups').select('id, name').order('name'),
    supabase.from('category_unit_groups').select('id, category_id, unit_group_id'),
  ])

  return (
    <>
      <h1 className="panel-page-title">Category → Unit Group Mapping</h1>
      <CategoryUnitMappingClient
        categories={(categories ?? []) as any[]}
        unitGroups={(unitGroups ?? []) as any[]}
        mappings={(mappings ?? []) as any[]}
      />
    </>
  )
}
