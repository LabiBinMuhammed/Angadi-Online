import type { Metadata } from 'next'
import AddressFormClient from '../AddressFormClient'

export const metadata: Metadata = { title: 'Add Address' }

export default async function AddAddressPage() {
  return (
    <>
      <h1 className="text-2xl font-bold" style={{ marginBottom: '1.5rem' }}>Add Address</h1>
      <AddressFormClient address={null} />
    </>
  )
}
