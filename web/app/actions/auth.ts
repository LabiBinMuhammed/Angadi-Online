'use server'

import { createClient } from '@supabase/supabase-js'

export async function confirmNewUser(userId: string) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email_confirm: true,
      phone_confirm: true
    })
    if (error) {
      return { success: false, error: error.message }
    }
    return { success: true, user: data.user }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
