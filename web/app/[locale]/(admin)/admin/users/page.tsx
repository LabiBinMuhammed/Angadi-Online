import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import UserManagementClient from './UserManagementClient'
import type { User } from '@/types'

export const metadata: Metadata = { title: 'User Management' }

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <>
      <h1 className="panel-page-title">User Management</h1>
      <UserManagementClient users={(data ?? []) as User[]} />
    </>
  )
}
