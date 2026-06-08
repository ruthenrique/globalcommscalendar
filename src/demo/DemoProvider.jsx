// Demo mode — inyecta los mismos contextos (AuthContext / AppContext)
// con datos locales. No requiere Supabase auth.
import { useState } from 'react'
import { ROLE_META } from '@/lib/constants'
import { SEED } from './seed'

// Importamos los contextos internos directamente para wrappearlos
import { AuthContext } from '@/contexts/AuthContext'
import { AppContext }  from '@/contexts/AppContext'

const MOCK_PROFILE = {
  id: 'demo', name: 'Admin Global', email: 'admin@bsg.com',
  role: 'super_admin', countries: [], color: '#534AB7', initials: 'AG',
}

// Demo data: countries and channels hardcoded since DemoProvider doesn't use Supabase
const COUNTRIES = [
  { id: 'AR', code: 'AR', name: 'Argentina',  flag: '🇦🇷', color: '#74ACDF', timezone: 'America/Argentina/Buenos_Aires', active: true, sort_order: 1 },
  { id: 'BR', code: 'BR', name: 'Brasil',     flag: '🇧🇷', color: '#009739', timezone: 'America/Sao_Paulo',              active: true, sort_order: 2 },
  { id: 'CL', code: 'CL', name: 'Chile',      flag: '🇨🇱', color: '#D52B1E', timezone: 'America/Santiago',              active: true, sort_order: 3 },
  { id: 'MX', code: 'MX', name: 'México',     flag: '🇲🇽', color: '#006847', timezone: 'America/Mexico_City',           active: true, sort_order: 4 },
  { id: 'PE', code: 'PE', name: 'Perú',       flag: '🇵🇪', color: '#D91023', timezone: 'America/Lima',                  active: true, sort_order: 5 },
  { id: 'ES', code: 'ES', name: 'España',     flag: '🇪🇸', color: '#AA151B', timezone: 'Europe/Madrid',                 active: true, sort_order: 6 },
  { id: 'GL', code: 'GL', name: 'Global',     flag: '🌍',  color: '#378ADD', timezone: 'UTC',                           active: true, sort_order: 7 },
]

const CHANNELS = [
  { id: 'Intranet',     name: 'Intranet',     color: '#534AB7', type: 'internal', active: true, sort_order: 1 },
  { id: 'Newsletter',   name: 'Newsletter',   color: '#1D9E75', type: 'internal', active: true, sort_order: 2 },
  { id: 'TV Interna',   name: 'TV Interna',   color: '#D85A30', type: 'internal', active: true, sort_order: 3 },
  { id: 'Instagram',    name: 'Instagram',    color: '#C837AB', type: 'external', active: true, sort_order: 4 },
  { id: 'LinkedIn',     name: 'LinkedIn',     color: '#0A66C2', type: 'external', active: true, sort_order: 5 },
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
