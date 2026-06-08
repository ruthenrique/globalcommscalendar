import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './AuthContext'

export const AppContext = createContext(null)

export function AppProvider({ children }) {
  const { user, profile } = useAuth()
  const [communications, setCommunications] = useState([])
  const [countries,      setCountries]      = useState([])
  const [channels,       setChannels]       = useState([])
  const [categories,     setCategories]     = useState([])
  const [segments,       setSegments]       = useState([])
  const [settings,       setSettings]       = useState({})
  const [appLists,       setAppLists]       = useState({})
  const [loading,        setLoading]        = useState(true)

  const loadAll = useCallback(async () => {
    setLoading(true)
    const [comms, ctrs, chs, cats, segs, sets, lists] = await Promise.all([
      supabase.from('communications').select('*').order('date'),
      supabase.from('countries').select('*').order('sort_order'),
      supabase.from('channels').select('*').order('sort_order'),
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('segments').select('*').order('sort_order'),
      supabase.from('app_settings').select('*'),
      supabase.from('app_lists').select('*'),
    ])
    if (comms.data) setCommunications(comms.data)
    if (ctrs.data)  setCountries(ctrs.data)
    if (chs.data)   setChannels(chs.data)
    if (cats.data)  setCategories(cats.data)
    if (segs.data)  setSegments(segs.data)
    if (sets.data) {
      const obj = {}
      sets.data.forEach(r => { obj[r.key] = r.value })
      setSettings(obj)
    }
    if (lists.data) {
      const obj = {}
      lists.data.forEach(r => { obj[r.list_key] = r.values })
      setAppLists(obj)
    }
    setLoading(false)
  }, [])

  useEffect(() => { if (user) loadAll() }, [user, loadAll])

  // ── Communications CRUD ──────────────────────────
  async function createComm(entry) {
    const { data, error } = await supabase
      .from('communications')
      .insert({ ...entry })
      .select()
      .single()
    if (!error) {
      setCommunications(prev => [...prev, data].sort((a, b) => a.date.localeCompare(b.date)))
      await writeAudit('communications', data.id, 'INSERT', null, data)
    }
    return { data, error }
  }

  async function updateComm(id, patch) {
    const prev = communications.find(c => c.id === id)
    const { data, error } = await supabase
      .from('communications')
      .update({ ...patch })
      .eq('id', id)
      .select()
      .single()
    if (!error) {
      setCommunications(prev => prev.map(c => c.id === id ? data : c))
      await writeAudit('communications', id, 'UPDATE', prev, data)
    }
    return { data, error }
  }

  async function deleteComm(id) {
    const prev = communications.find(c => c.id === id)
    const { error } = await supabase.from('communications').delete().eq('id', id)
    if (!error) {
      setCommunications(prev => prev.filter(c => c.id !== id))
      await writeAudit('communications', id, 'DELETE', prev, null)
    }
    return { error }
  }

  async function writeAudit(table, recordId, action, oldData, newData) {
    if (!user) return
    await supabase.from('audit_log').insert({
      table_name: table,
      record_id: String(recordId),
      action,
      old_data: oldData,
      new_data: newData,
      user_id: user.id,
      user_name: profile?.name ?? user.email,
    })
  }

  // ── Lookup maps dinámicos desde DB ───────────────
  const countryMeta = useMemo(() => {
    const m = {}
    countries.forEach(c => { m[c.code] = { name: c.name, flag: c.flag, color: c.color } })
    return m
  }, [countries])

  const channelMeta = useMemo(() => {
    const m = {}
    channels.forEach(c => { m[c.name] = { color: c.color, type: c.type } })
    return m
  }, [channels])

  const internalChannels = useMemo(() =>
    channels.filter(c => c.active !== false && c.type === 'internal').map(c => c.name),
    [channels]
  )

  const externalChannels = useMemo(() =>
    channels.filter(c => c.active !== false && c.type === 'external').map(c => c.name),
    [channels]
  )

  return (
    <AppContext.Provider value={{
      communications, countries, channels,
      categories, segments, settings, appLists, loading,
      countryMeta, channelMeta, internalChannels, externalChannels,
      createComm, updateComm, deleteComm,
      reload: loadAll,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be inside AppProvider')
  return ctx
}
