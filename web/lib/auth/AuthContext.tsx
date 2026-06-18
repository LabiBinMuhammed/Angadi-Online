'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

export type UserRole = 'customer' | 'shop_owner' | 'admin'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  role: UserRole
  signInWithOtp: (phone: string) => Promise<{ error: any }>
  verifyOtp: (phone: string, token: string) => Promise<{ data: any; error: any }>
  signInWithPassword: (phone: string, password: string) => Promise<{ data: any; error: any }>
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

  // Phone + Password login
  async function signInWithPassword(phone: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      phone: normalizePhone(phone),
      password
    })
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
    const { error } = await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setRole('customer')
    return { error }
  }

  // Sign out from all devices
  async function signOutAll() {
    const { error } = await supabase.auth.signOut({ scope: 'global' })
    setUser(null)
    setSession(null)
    setRole('customer')
    return { error }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        role,
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
