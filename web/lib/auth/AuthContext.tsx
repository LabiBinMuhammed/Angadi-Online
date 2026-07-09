'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'
import { confirmNewUser } from '@/app/actions/auth'

export type UserRole = 'customer' | 'shop_owner' | 'admin'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  role: UserRole
  signUp: (params: { email?: string; phone?: string; password: string; name: string; role: string; language: string }) => Promise<{ data: any; error: any }>
  signInWithOtp: (phone: string) => Promise<{ error: any }>
  verifyOtp: (phone: string, token: string) => Promise<{ data: any; error: any }>
  signInWithPassword: (phoneOrEmail: string, password: string) => Promise<{ data: any; error: any }>
  completeRegistration: (fullName: string, language: string, role: string, password?: string) => Promise<{ error: any }>
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
        .select('role')
        .eq('id', userId)
        .maybeSingle()
      
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
    return { data, error }
  }

  // Sign up with Email or Phone and Password (MVP)
  async function signUp({ email, phone, password, name, role, language }: { email?: string; phone?: string; password: string; name: string; role: string; language: string }) {
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
    const identifier = email ? email.trim() : normalizePhone(phone!)
    if (email) {
      signUpParams.email = email.trim()
      if (phone) {
        signUpParams.options.data.phone = normalizePhone(phone)
      }
    } else if (phone) {
      signUpParams.phone = normalizePhone(phone)
      if (email) {
        signUpParams.options.data.email = email.trim()
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
      
      await resolveUserRole(data.user.id)
    }
    return { data, error }
  }

  // Phone/Email + Password login
  async function signInWithPassword(phoneOrEmail: string, password: string) {
    const isEmail = phoneOrEmail.includes('@')
    const credentials = isEmail
      ? { email: phoneOrEmail.trim(), password }
      : { phone: normalizePhone(phoneOrEmail), password }

    const { data, error } = await supabase.auth.signInWithPassword(credentials)
    return { data, error }
  }

  // Complete new registration
  async function completeRegistration(fullName: string, language: string, registrationRole: string, password?: string) {
    if (!user) return { error: new Error('User session not found') }
    
    // 1. Update Supabase Auth user metadata & password
    const updates: any = {
      data: {
        name: fullName,
        full_name: fullName,
        role: registrationRole
      }
    }
    if (password) {
      updates.password = password
    }

    const { error: authErr } = await supabase.auth.updateUser(updates)
    if (authErr) return { error: authErr }

    // 2. Update public.users record
    const { error: usersErr } = await supabase
      .from('users')
      .update({
        name: fullName,
        role: registrationRole,
        phone_verified: true,
        last_login_at: new Date().toISOString()
      })
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
      await supabase.auth.signOut()
    } catch (e) {
      console.error("Signout error:", e)
    }
    setUser(null)
    setSession(null)
    setRole('customer')
    try {
      document.cookie = 'sb-access-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;'
      document.cookie = 'sb-refresh-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;'
      if (typeof window !== 'undefined') {
        const keys = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.includes('supabase') || key.includes('sb-'))) {
            keys.push(key)
          }
        }
        keys.forEach(k => localStorage.removeItem(k))
      }
    } catch (_) {}
    return { error: null }
  }

  // Sign out from all devices
  async function signOutAll() {
    try {
      await supabase.auth.signOut({ scope: 'global' })
    } catch (e) {
      console.error("Signout all error:", e)
    }
    setUser(null)
    setSession(null)
    setRole('customer')
    try {
      document.cookie = 'sb-access-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;'
      document.cookie = 'sb-refresh-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;'
      if (typeof window !== 'undefined') {
        const keys = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.includes('supabase') || key.includes('sb-'))) {
            keys.push(key)
          }
        }
        keys.forEach(k => localStorage.removeItem(k))
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
