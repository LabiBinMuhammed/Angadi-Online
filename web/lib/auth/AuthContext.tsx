'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'
import { confirmNewUser, signOutAction } from '@/app/actions/auth'

export type UserRole = 'customer' | 'shop_owner' | 'admin'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  role: UserRole
  signUp: (params: { email?: string; phone?: string; password: string; name: string; role: string; language: string; locationId?: string }) => Promise<{ data: any; error: any }>
  signInWithOtp: (phone: string) => Promise<{ error: any }>
  verifyOtp: (phone: string, token: string) => Promise<{ data: any; error: any }>
  signInWithPassword: (phoneOrEmail: string, password: string) => Promise<{ data: any; error: any }>
  completeRegistration: (fullName: string, language: string, role: string, phone?: string, locationId?: string) => Promise<{ error: any }>
  updatePassword: (password: string) => Promise<{ error: any }>
  updatePhone: (phone: string) => Promise<{ error: any }>
  verifyPhoneChange: (phone: string, token: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  signOutAll: () => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<UserRole>('customer')
  const supabase = createClient()

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession)
      setUser(initialSession?.user ?? null)
      if (initialSession?.user) {
        resolveUserRole(initialSession.user.id)
      } else {
        setLoading(false)
      }
    })

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      if (currentSession?.user) {
        await resolveUserRole(currentSession.user.id)
      } else {
        setRole('customer')
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function resolveUserRole(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role, is_active')
        .eq('id', userId)
        .maybeSingle()
      
      if (data && data.is_active === false) {
        await supabase.auth.signOut()
        setSession(null)
        setUser(null)
        setRole('customer')
        return
      }

      if (data && !error) {
        setRole(data.role as UserRole)
      } else {
        setRole('customer')
      }
    } catch (e) {
      setRole('customer')
    } finally {
      setLoading(false)
    }
  }

  const normalizePhone = (phone: string): string => {
    let cleaned = phone.replace(/[\s\-\(\)]/g, '')
    if (!cleaned) return ''
    if (cleaned.startsWith('+')) return cleaned
    if (cleaned.startsWith('00')) return '+' + cleaned.substring(2)
    if (cleaned.startsWith('0') && cleaned.length === 11) return '+91' + cleaned.substring(1)
    if (cleaned.length === 10) return '+91' + cleaned
    if (cleaned.startsWith('91') && cleaned.length === 12) return '+' + cleaned
    return '+' + cleaned
  }

  // OTP login start
  async function signInWithOtp(phone: string) {
    const { error } = await supabase.auth.signInWithOtp({ phone: normalizePhone(phone) })
    return { error }
  }

  // OTP verify
  async function verifyOtp(phone: string, token: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      phone: normalizePhone(phone),
      token,
      type: 'sms'
    })
    if (error) return { data, error }

    if (data?.user) {
      const { data: dbUser } = await supabase
        .from('users')
        .select('is_active')
        .eq('id', data.user.id)
        .maybeSingle()

      if (dbUser && dbUser.is_active === false) {
        await supabase.auth.signOut()
        return {
          data: null,
          error: new Error('Your account has been deactivated by an administrator. Please contact support.')
        }
      }
    }

    return { data, error }
  }

  // Sign up with Email or Phone and Password (MVP)
  async function signUp({ email, phone, password, name, role, language, locationId }: { email?: string; phone?: string; password: string; name: string; role: string; language: string; locationId?: string }) {
    const signUpParams: any = {
      password,
      options: {
        data: {
          name,
          full_name: name,
          role,
          preferred_language: language,
        }
      }
    }
    const identifier = email ? email.trim().toLowerCase() : normalizePhone(phone!)
    if (email) {
      signUpParams.email = email.trim().toLowerCase()
      if (phone) {
        signUpParams.options.data.phone = normalizePhone(phone)
      }
    } else if (phone) {
      signUpParams.phone = normalizePhone(phone)
      if (email) {
        signUpParams.options.data.email = email.trim().toLowerCase()
      }
    }

    const { data, error } = await supabase.auth.signUp(signUpParams)
    
    if (data?.user && !error) {
      // 1. Auto-confirm user via Server Action
      try {
        await confirmNewUser(data.user.id)
      } catch (e) {
        console.error("Auto-confirm failed:", e)
      }

      // 2. Auto-login using password
      try {
        const credentials = email 
          ? { email: identifier, password }
          : { phone: identifier, password }
        const loginRes = await supabase.auth.signInWithPassword(credentials)
        if (loginRes.data?.session) {
          data.session = loginRes.data.session
        }
      } catch (e) {
        console.error("Auto-login failed:", e)
      }

      // 3. Create user profile row
      try {
        await supabase
          .from('user_profiles')
          .update({ preferred_language: language, email: email || undefined })
          .eq('user_id', data.user.id)
      } catch (_) {}

      // 4. Create default address with location_id
      if (locationId) {
        try {
          await supabase
            .from('user_addresses')
            .insert({
              user_id: data.user.id,
              label: 'Home',
              contact_name: name,
              contact_phone: phone || '0000000000',
              address_line_1: 'Default Address',
              location_id: locationId,
              is_default: true,
              is_active: true
            })
        } catch (e) {
          console.error("Failed to create default address during signup:", e)
        }
      }
      
      await resolveUserRole(data.user.id)
    }
    return { data, error }
  }

  // Phone/Email + Password login
  async function signInWithPassword(phoneOrEmail: string, password: string) {
    const isEmail = phoneOrEmail.includes('@')
    const credentials = isEmail
      ? { email: phoneOrEmail.trim().toLowerCase(), password }
      : { phone: normalizePhone(phoneOrEmail), password }

    const { data, error } = await supabase.auth.signInWithPassword(credentials)
    if (error) return { data, error }

    if (data?.user) {
      const { data: dbUser } = await supabase
        .from('users')
        .select('is_active')
        .eq('id', data.user.id)
        .maybeSingle()

      if (dbUser && dbUser.is_active === false) {
        await supabase.auth.signOut()
        return {
          data: null,
          error: new Error('Your account has been deactivated by an administrator. Please contact support.')
        }
      }
    }

    return { data, error }
  }

  async function completeRegistration(fullName: string, language: string, registrationRole: string, phone?: string, locationId?: string) {
    if (!user) return { error: new Error('User session not found') }
    
    // 1. Update Supabase Auth user metadata
    const updates: any = {
      data: {
        name: fullName,
        full_name: fullName,
        role: registrationRole
      }
    }
    if (phone) {
      updates.phone = normalizePhone(phone)
      updates.data.phone = normalizePhone(phone)
    }

    try {
      await supabase.auth.updateUser(updates)
    } catch (e: any) {
      console.warn("Auth updateUser warning:", e.message)
    }

    // 2. Update public.users record
    const usersUpdate: any = {
      name: fullName,
      role: registrationRole,
      last_login_at: new Date().toISOString()
    }
    if (phone) {
      usersUpdate.phone = normalizePhone(phone)
      usersUpdate.phone_verified = true
    }

    const { error: usersErr } = await supabase
      .from('users')
      .update(usersUpdate)
      .eq('id', user.id)

    if (usersErr) return { error: usersErr }

    // 3. Update public.user_profiles record
    const { error: profileErr } = await supabase
      .from('user_profiles')
      .update({
        preferred_language: language
      })
      .eq('user_id', user.id)

    if (profileErr) return { error: profileErr }

    // 4. Create default address with location_id
    if (locationId) {
      const { data: existingAddr } = await supabase
        .from('user_addresses')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .maybeSingle()

      if (existingAddr) {
        await supabase
          .from('user_addresses')
          .update({ location_id: locationId })
          .eq('id', existingAddr.id)
      } else {
        await supabase
          .from('user_addresses')
          .insert({
            user_id: user.id,
            label: 'Home',
            contact_name: fullName,
            contact_phone: phone || user.phone || '0000000000',
            address_line_1: 'Default Address',
            location_id: locationId,
            is_default: true,
            is_active: true
          })
      }
    }

    await resolveUserRole(user.id)
    return { error: null }
  }

  // Update password (used for settings and forgot password reset)
  async function updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password })
    return { error }
  }

  // Update phone number (triggers OTP verify step)
  async function updatePhone(phone: string) {
    const { error } = await supabase.auth.updateUser({ phone: normalizePhone(phone) })
    return { error }
  }

  // Verify change phone number OTP
  async function verifyPhoneChange(phone: string, token: string) {
    const normalized = normalizePhone(phone)
    const { error } = await supabase.auth.verifyOtp({
      phone: normalized,
      token,
      type: 'phone_change'
    })
    if (!error && user) {
      // Sync verified status and new number to public.users table
      await supabase
        .from('users')
        .update({ phone: normalized, phone_verified: true })
        .eq('id', user.id)
    }
    return { error }
  }

  // Sign out (local session)
  async function signOut() {
    try {
      await signOutAction()
    } catch (_) {}
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.error("Signout error:", e)
    }
    setUser(null)
    setSession(null)
    setRole('customer')
    try {
      // Clear all cookies starting with sb- or containing auth-token
      if (typeof document !== 'undefined') {
        const cookiesList = document.cookie.split(';')
        for (let i = 0; i < cookiesList.length; i++) {
          const cookie = cookiesList[i].trim()
          const eqPos = cookie.indexOf('=')
          const name = eqPos > -1 ? cookie.slice(0, eqPos) : cookie
          if (name.startsWith('sb-') || name.startsWith('sb:') || name.includes('auth-token')) {
            document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax;`
            document.cookie = `${name}=; Path=/; Domain=${window.location.hostname}; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax;`
          }
        }
      }
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
    } catch (_) {}
    return { error: null }
  }

  // Sign out from all devices
  async function signOutAll() {
    try {
      await signOutAction()
    } catch (_) {}
    try {
      await supabase.auth.signOut({ scope: 'global' })
    } catch (e) {
      console.error("Signout all error:", e)
    }
    setUser(null)
    setSession(null)
    setRole('customer')
    try {
      if (typeof document !== 'undefined') {
        const cookiesList = document.cookie.split(';')
        for (let i = 0; i < cookiesList.length; i++) {
          const cookie = cookiesList[i].trim()
          const eqPos = cookie.indexOf('=')
          const name = eqPos > -1 ? cookie.slice(0, eqPos) : cookie
          if (name.startsWith('sb-') || name.startsWith('sb:') || name.includes('auth-token')) {
            document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax;`
            document.cookie = `${name}=; Path=/; Domain=${window.location.hostname}; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax;`
          }
        }
      }
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
    } catch (_) {}
    return { error: null }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        role,
        signUp,
        signInWithOtp,
        verifyOtp,
        signInWithPassword,
        completeRegistration,
        updatePassword,
        updatePhone,
        verifyPhoneChange,
        signOut,
        signOutAll
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
