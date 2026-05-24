import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import AddressFormClient from '../AddressFormClient'
import type { UserAddress } from '@/types'

export const metadata: Metadata = { title: 'Edit Address' }

export default async function EditAddressPage({ params }: { params: Promise<{ addressId: string }> }) {
  const { addressId } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('user_addresses')
    .select('*')
    .eq('id', addressId)
    .single()

  if (!data) notFound()

  return (
    <>
      <h1 className="text-2xl font-bold" style={{ marginBottom: '1.5rem' }}>Edit Address</h1>
      <AddressFormClient address={data as UserAddress} />
    </>
  )
}
