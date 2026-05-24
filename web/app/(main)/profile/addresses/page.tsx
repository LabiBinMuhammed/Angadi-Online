import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { UserAddress } from '@/types'

export const metadata: Metadata = { title: 'My Addresses' }

export default async function AddressesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: addresses } = await supabase
    .from('user_addresses')
    .select('*')
    .eq('user_id', user!.id)
    .eq('is_active', true)
    .order('is_default', { ascending: false })

  const addressList = (addresses ?? []) as UserAddress[]

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          <Link href="/profile" className="btn btn-ghost btn-sm">← Profile</Link>
          <h1 className="text-2xl font-bold">My Addresses</h1>
        </div>
        <button className="btn btn-primary btn-sm" id="btn-add-address">
          + Add New
        </button>
      </div>

      {addressList.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 540 }}>
          {addressList.map((addr) => (
            <div key={addr.id} id={`address-${addr.id}`} className="card card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.4rem' }}>
                    <span className="font-semibold">{addr.label}</span>
                    {addr.is_default && <span className="badge badge-success">Default</span>}
                  </div>
                  <p>{addr.contact_name} · {addr.contact_phone}</p>
                  <p className="text-sm text-muted">{addr.address_line_1}</p>
                  {addr.address_line_2 && <p className="text-sm text-muted">{addr.address_line_2}</p>}
                  {addr.landmark && <p className="text-sm text-muted">Near: {addr.landmark}</p>}
                </div>
                <button className="btn btn-ghost btn-sm" id={`btn-edit-addr-${addr.id}`}>
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-state-icon">📍</span>
          <p className="font-semibold">No addresses saved</p>
          <button className="btn btn-primary" id="btn-add-first-address">
            Add Address
          </button>
        </div>
      )}
    </>
  )
}
