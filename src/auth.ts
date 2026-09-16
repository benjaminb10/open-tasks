import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabase, syncEnabled } from './supabase'

interface AuthState {
  session: Session | null
  ready: boolean // initial session check done
  signInEmail: (email: string) => Promise<{ error?: string }>
  signInPassword: (email: string, password: string) => Promise<{ error?: string }>
  verifyCode: (email: string, token: string) => Promise<{ error?: string }>
  setPassword: (password: string) => Promise<{ error?: string }>
  signInGoogle: () => Promise<{ error?: string }>
  signOut: () => Promise<void>
}

export const useAuth = create<AuthState>(() => ({
  session: null,
  ready: !syncEnabled, // if sync off, we're "ready" immediately (local-only mode)

  signInEmail: async (email) => {
    if (!supabase) return { error: 'Sync not configured' }
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    return error ? { error: error.message } : {}
  },

  signInPassword: async (email, password) => {
    if (!supabase) return { error: 'Sync not configured' }
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    return error ? { error: error.message } : {}
  },

  verifyCode: async (email, token) => {
    if (!supabase) return { error: 'Sync not configured' }
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: token.trim(),
      type: 'email',
    })
    return error ? { error: error.message } : {}
  },

  setPassword: async (password) => {
    if (!supabase) return { error: 'Sync not configured' }
    const { error } = await supabase.auth.updateUser({ password })
    return error ? { error: error.message } : {}
  },

  signInGoogle: async () => {
    if (!supabase) return { error: 'Sync not configured' }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    return error ? { error: error.message } : {}
  },

  signOut: async () => {
    await supabase?.auth.signOut()
  },
}))

/** Wire Supabase auth events into the store. Call once at startup. */
export function initAuth() {
  if (!supabase) return
  supabase.auth.getSession().then(({ data }) => {
    useAuth.setState({ session: data.session, ready: true })
  })
  supabase.auth.onAuthStateChange((_event, session) => {
    useAuth.setState({ session, ready: true })
  })
}
