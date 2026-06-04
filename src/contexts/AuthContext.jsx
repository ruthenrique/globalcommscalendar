import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ROLE_META } from '@/lib/constants'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(userId) {
    const { data, error } = await supabase.rpc('get_my_profile')

    if (data) {
      setProfile(data)
      return
    }

    if (error) {
      console.error('[loadProfile] rpc error', error)
      return
    }

    // Profile missing — create it
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return
    const name = authUser.user_metadata?.full_name ?? authUser.email?.split('@')[0] ?? 'Usuario'
    const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        name,
        email: authUser.email,
        role: 'viewer',
        countries: [],
        color: '#534AB7',
        initials,
      })
      .select()
      .maybeSingle()

    if (insertError) {
      console.error('[loadProfile] insert error', insertError)
      // Profile may already exist — retry select
      const { data: retry } = await supabase
        .from('profiles').select('*').eq('id', userId).maybeSingle()
      if (retry) setProfile(retry)
    } else {
      setProfile(newProfile)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id).finally(() => setLoading(false))
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
      else setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error
  }

  async function signUp(email, password, name) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (!error && data.user) {
      const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
      await supabase.from('profiles').insert({
        id: data.user.id,
        name,
        email,
        role: 'viewer',
        countries: [],
        color: '#534AB7',
        initials,
      })
    }
    return error
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const role = profile?.role ?? 'viewer'
  const perms = ROLE_META[role] ?? ROLE_META.viewer
  const myCountries = profile?.countries ?? []

  function canEditCountry(pais = []) {
    if (!perms.canEdit) return false
    if (role === 'super_admin' || myCountries.length === 0) return true
    return pais.some(p => myCountries.includes(p))
  }

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      role, perms, myCountries,
      canEditCountry,
      signIn, signUp, signOut,
      refreshProfile: () => user && loadProfile(user.id),
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
