'use server'

import { createClient } from '@supabase/supabase-js'

export async function updateUserRoleAction(userId: string, newRole: string) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Update public.users table
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)

    if (dbError) {
      return { success: false, error: dbError.message }
    }

    // 2. Update auth.users metadata if user exists in auth schema
    try {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { role: newRole }
      })
    } catch (_) {}

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
