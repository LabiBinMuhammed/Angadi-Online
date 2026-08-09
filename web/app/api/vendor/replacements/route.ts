import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey)

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { requestId, shopId, status, notes, sellerNotesMap } = await req.json()

    if (!requestId || !shopId || !status) {
      return NextResponse.json({ error: 'requestId, shopId, and status are required' }, { status: 400 })
    }

    // Verify vendor access to shop
    const { data: ownerRecord } = await supabaseAdmin
      .from('shop_owners')
      .select('shop_id')
      .eq('user_id', user.id)
      .eq('shop_id', shopId)
      .maybeSingle()

    if (!ownerRecord) {
      return NextResponse.json({ error: 'Unauthorized vendor access' }, { status: 403 })
    }

    // Update replacement_requests status and general notes
    const { error: updateErr } = await supabaseAdmin
      .from('replacement_requests')
      .update({
        status,
        notes: notes ? String(notes).trim() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)

    if (updateErr) throw updateErr

    // Update seller notes for items if provided
    if (sellerNotesMap && typeof sellerNotesMap === 'object') {
      for (const [itemId, sellerNotes] of Object.entries(sellerNotesMap)) {
        await supabaseAdmin
          .from('replacement_items')
          .update({ seller_notes: String(sellerNotes) })
          .eq('id', itemId)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Vendor replacement update error:', err)
    return NextResponse.json({ error: err.message || 'Failed to update replacement request' }, { status: 500 })
  }
}
