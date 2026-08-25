import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  adminToggleUserActiveAction,
  adminDeleteUserAction,
  adminToggleShopActiveAction,
  adminDeleteShopAction,
  updateUserRoleAction
} from '@/app/actions/admin'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader ? authHeader.replace('Bearer ', '') : null

    // Verify requesting user is admin
    const supabase = getAdminClient()
    if (token) {
      const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
      if (authErr || !user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      }
      const { data: dbUser } = await supabase.from('users').select('role, is_active').eq('id', user.id).single()
      if (dbUser?.role !== 'admin' || dbUser?.is_active === false) {
        return NextResponse.json({ success: false, error: 'Forbidden: Admin access required' }, { status: 403 })
      }
    }

    const body = await req.json()
    const { action, userId, shopId, isActive, role } = body

    switch (action) {
      case 'toggle_user_active': {
        if (!userId || typeof isActive !== 'boolean') {
          return NextResponse.json({ success: false, error: 'Missing userId or isActive' }, { status: 400 })
        }
        const res = await adminToggleUserActiveAction(userId, isActive)
        return NextResponse.json(res)
      }

      case 'delete_user': {
        if (!userId) {
          return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 })
        }
        const res = await adminDeleteUserAction(userId)
        return NextResponse.json(res)
      }

      case 'toggle_shop_active': {
        if (!shopId || typeof isActive !== 'boolean') {
          return NextResponse.json({ success: false, error: 'Missing shopId or isActive' }, { status: 400 })
        }
        const res = await adminToggleShopActiveAction(shopId, isActive)
        return NextResponse.json(res)
      }

      case 'delete_shop': {
        if (!shopId) {
          return NextResponse.json({ success: false, error: 'Missing shopId' }, { status: 400 })
        }
        const res = await adminDeleteShopAction(shopId)
        return NextResponse.json(res)
      }

      case 'update_user_role': {
        if (!userId || !role) {
          return NextResponse.json({ success: false, error: 'Missing userId or role' }, { status: 400 })
        }
        const res = await updateUserRoleAction(userId, role)
        return NextResponse.json(res)
      }

      default:
        return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
