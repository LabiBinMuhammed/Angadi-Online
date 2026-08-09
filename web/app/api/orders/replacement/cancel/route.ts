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

    const { requestId } = await req.json()
    if (!requestId) {
      return NextResponse.json({ error: 'requestId is required' }, { status: 400 })
    }

    const { data: request, error: fetchErr } = await supabaseAdmin
      .from('replacement_requests')
      .select('user_id, status')
      .eq('id', requestId)
      .single()

    if (fetchErr || !request) {
      return NextResponse.json({ error: 'Replacement request not found' }, { status: 404 })
    }

    if (request.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (request.status !== 'Pending') {
      return NextResponse.json({ error: 'Only pending requests can be cancelled.' }, { status: 400 })
    }

    const { error: updateErr } = await supabaseAdmin
      .from('replacement_requests')
      .update({ status: 'Cancelled', updated_at: new Date().toISOString() })
      .eq('id', requestId)

    if (updateErr) throw updateErr

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to cancel request' }, { status: 500 })
  }
}
