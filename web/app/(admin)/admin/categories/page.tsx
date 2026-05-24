import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import CategoriesClient from './CategoriesClient'
import type { Category } from '@/types'

export const metadata: Metadata = { title: 'Category Management' }

export default async function CategoriesPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('categories').select('*').order('name')

  return (
    <>
      <h1 className="panel-page-title">Category Management</h1>
      <CategoriesClient categories={(data ?? []) as Category[]} />
    </>
  )
}
