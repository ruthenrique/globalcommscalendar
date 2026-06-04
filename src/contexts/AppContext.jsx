import { createContext, useContext, useEffect, useState, useCallback } from 'react'
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
  const [loading,        setLoading]        = useState(true)

  const loadAll = useCallback(async () => {
    setLoading(true)
    const [comms, ctrs, chs, cats, segs, sets] = await Promise.all([
      supabase.from('communications').select('*').order('date'),
      supabase.from('countries').select('*').order('sort_order'),
      supabase.from('channels').select('*').order('sort_order'),
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('segments').select('*').order('sort_order'),
      supabase.from('app_settings').select('*'),
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

  const countryList = countries.length > 0 ? countries : []
  const channelList = channels.length > 0 ? channels : []
  const categoryList = categories.length > 0 ? categories : []
  const segmentList = segments.length > 0 ? segments : []

  return (
    <AppContext.Provider value={{
      communications, countries: countryList, channels: channelList,
      categories: categoryList, segments: segmentList, settings, loading,
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
