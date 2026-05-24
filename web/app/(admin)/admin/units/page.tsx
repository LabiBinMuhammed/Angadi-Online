import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import UnitsClient from './UnitsClient'
import type { Unit, UnitGroup } from '@/types'

export const metadata: Metadata = { title: 'Unit Management' }

export default async function UnitsPage() {
  const supabase = await createClient()
  const [{ data: units }, { data: groups }] = await Promise.all([
    supabase.from('units').select('*').order('name'),
    supabase.from('unit_groups').select('*').order('name'),
  ])

  return (
    <>
      <h1 className="panel-page-title">Unit Management</h1>
      <UnitsClient units={(units ?? []) as Unit[]} groups={(groups ?? []) as UnitGroup[]} />
    </>
  )
}
