// Demo mode — inyecta los mismos contextos (AuthContext / AppContext)
// con datos locales. No requiere Supabase auth.
import { useState } from 'react'
import { COUNTRY_META, CHANNEL_META, INTERNAL_CHANNELS, EXTERNAL_CHANNELS, ROLE_META } from '@/lib/constants'
import { SEED } from './seed'

// Importamos los contextos internos directamente para wrappearlos
import { AuthContext } from '@/contexts/AuthContext'
import { AppContext }  from '@/contexts/AppContext'

const MOCK_PROFILE = {
  id: 'demo', name: 'Admin Global', email: 'admin@bsg.com',
  role: 'super_admin', countries: [], color: '#534AB7', initials: 'AG',
}

const COUNTRIES = Object.entries(COUNTRY_META).map(([code, m], i) => ({
  id: code, code, ...m,
  timezone: 'America/Argentina/Buenos_Aires', active: true, sort_order: i + 1,
}))

const CHANNELS = [
  ...INTERNAL_CHANNELS.map((name, i) => ({
    id: name, name, color: CHANNEL_META[name].color, type: 'internal', active: true, sort_order: i + 1,
  })),
  ...EXTERNAL_CHANNELS.map((name, i) => ({
    id: name, name, color: CHANNEL_META[name].color, type: 'external', active: true, sort_order: i + 4,
  })),
]

const CATEGORIES = [
  'Cultura','Bienestar','Innovación','DEI','Campaña','Org','Beneficios',
  'Talento','Escucha','Formación','Marca','Operaciones','Gestión',
].map((name, i) => ({ id: name, name, color: '#534AB7', bg_color: '#EEEDFE', active: true, sort_order: i + 1 }))

const SEGMENTS = [
  'Staff','Tiendas Isadora','TM','Atelier','TMB','Logística','Producción','Staff Retail',
].map((name, i) => ({ id: name, name, sort_order: i + 1 }))

const DEMO_SETTINGS = {
  idiomas: ['Español','Portugués','Inglés'],
  alcances: ['Global','Local'],
  ubicaciones: ['Oficina','Operaciones'],
  formatos: ['Email','Post','Video','Encuesta','Carrusel'],
}

export function DemoProvider({ children }) {
  const [comms, setComms] = useState(SEED)

  const authValue = {
    user: { id: 'demo', email: 'admin@bsg.com' },
    profile: MOCK_PROFILE,
    loading: false,
    role: 'super_admin',
    perms: ROLE_META.super_admin,
    myCountries: [],
    canEditCountry: () => true,
    signIn: () => {}, signUp: () => {}, signOut: () => {},
    refreshProfile: () => {},
  }

  async function createComm(entry) {
    const id = Date.now()
    const row = { ...entry, id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    setComms(p => [...p, row].sort((a, b) => a.date.localeCompare(b.date)))
    return { data: row, error: null }
  }
  async function updateComm(id, patch) {
    const row = { ...patch, id, updated_at: new Date().toISOString() }
    setComms(p => p.map(c => c.id === id ? row : c))
    return { data: row, error: null }
  }
  async function deleteComm(id) {
    setComms(p => p.filter(c => c.id !== id))
    return { error: null }
  }

  const appValue = {
    communications: comms,
    countries: COUNTRIES,
    channels: CHANNELS,
    categories: CATEGORIES,
    segments: SEGMENTS,
    settings: DEMO_SETTINGS,
    loading: false,
    createComm, updateComm, deleteComm,
    reload: () => {},
  }

  return (
    <AuthContext.Provider value={authValue}>
      <AppContext.Provider value={appValue}>
        {children}
      </AppContext.Provider>
    </AuthContext.Provider>
  )
}
