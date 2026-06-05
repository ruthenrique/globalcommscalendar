import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Bell, LogOut, KeyRound, Globe } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ROLE_META } from '@/lib/constants'
import { toast } from '@/components/layout/Toaster'
import { Toaster } from '@/components/layout/Toaster'
import Sidebar from '@/components/layout/Sidebar'
import NotificationPanel, { NotifBadge } from '@/components/layout/NotificationPanel'
import CalendarPage   from '@/pages/CalendarPage'
import DataMasterPage  from '@/pages/DataMasterPage'
import AdminGlobalPage from '@/pages/AdminGlobalPage'
import AdminPage       from '@/pages/AdminPage'
import BriefingPage    from '@/pages/BriefingPage'
import AboutPage       from '@/pages/AboutPage'
import LoginPage       from '@/pages/LoginPage'
import { DemoProvider } from '@/demo/DemoProvider'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { AppProvider } from '@/contexts/AppContext'

// ── Modo ───────────────────────────────────────────────────────────
// true  → demo en memoria (sin Supabase)
// false → producción con Supabase auth
const DEMO_MODE = false

// ── User menu dropdown ─────────────────────────────────────────────
const LANGS = ['es', 'en', 'pt']

function UserMenu() {
  const { profile, role, signOut } = useAuth()
  const { t, i18n }                = useTranslation()
  const [open,     setOpen]     = useState(false)
  const [changePw, setChangePw] = useState(false)
  const [pwForm,   setPwForm]   = useState({ pw: '', pw2: '' })
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  async function handleChangePw() {
    if (pwForm.pw.length < 6) return toast({ title: 'Mínimo 6 caracteres', variant: 'destructive' })
    if (pwForm.pw !== pwForm.pw2) return toast({ title: 'Las contraseñas no coinciden', variant: 'destructive' })
    const { error } = await supabase.auth.updateUser({ password: pwForm.pw })
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' })
    else { toast({ title: 'Contraseña actualizada ✓', variant: 'success' }); setChangePw(false); setPwForm({ pw: '', pw2: '' }); setOpen(false) }
  }

  const roleLabel = ROLE_META[role]?.label ?? 'Viewer'

  return (
    <div className="relative" ref={ref}>
      {/* Avatar button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-gray-100 transition-colors"
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
          style={{ background: profile?.color ?? '#0EA5E9' }}
        >
          {profile?.initials ?? 'U'}
        </div>
        <span className="text-xs font-medium text-gray-700 hidden sm:block max-w-[120px] truncate">
          {profile?.name ?? 'Usuario'}
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          {/* Profile header */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 bg-gray-50/60">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ background: profile?.color ?? '#0EA5E9' }}
            >
              {profile?.initials ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">{profile?.name ?? 'Usuario'}</div>
              <div className="text-[11px] text-gray-400">{roleLabel}</div>
            </div>
          </div>

          <div className="py-1.5">
            {/* Language */}
            <div className="px-4 py-2">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-xs text-gray-500">{t('filter.country') === 'País' ? 'Idioma' : 'Language'}</span>
              </div>
              <div className="flex gap-1">
                {LANGS.map(lang => (
                  <button
                    key={lang}
                    onClick={() => i18n.changeLanguage(lang)}
                    className={`flex-1 text-[11px] font-bold rounded-lg py-1.5 uppercase tracking-wide transition-colors ${
                      i18n.language.startsWith(lang)
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-500 border border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-gray-100 mx-3 my-1" />

            {/* Change password */}
            <button
              onClick={() => setChangePw(v => !v)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <KeyRound className="h-4 w-4 text-gray-400" />
              Cambiar contraseña
            </button>

            {changePw && (
              <div className="px-4 pb-2 space-y-2">
                <input type="password" placeholder="Nueva contraseña" value={pwForm.pw}
                  onChange={e => setPwForm(f => ({ ...f, pw: e.target.value }))}
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-gray-400" />
                <input type="password" placeholder="Repetir contraseña" value={pwForm.pw2}
                  onChange={e => setPwForm(f => ({ ...f, pw2: e.target.value }))}
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-gray-400" />
                <div className="flex gap-2">
                  <button onClick={handleChangePw} className="flex-1 text-xs bg-gray-900 text-white rounded-lg py-1.5 font-medium">Guardar</button>
                  <button onClick={() => { setChangePw(false); setPwForm({ pw: '', pw2: '' }) }} className="flex-1 text-xs border border-gray-200 rounded-lg py-1.5 text-gray-500">Cancelar</button>
                </div>
              </div>
            )}

            <div className="h-px bg-gray-100 mx-3 my-1" />

            {/* Sign out */}
            <button
              onClick={signOut}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              {t('sidebar.signOut')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Shell (layout compartido) ──────────────────────────────────────
const PAGE_ICONS = { cal: '📅', map: '✦', data: '🗃', admin: '⚙️' }

function Shell() {
  const [tab,       setTab]       = useState('cal')
  const [notifOpen, setNotifOpen] = useState(false)
  const { t } = useTranslation()

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar activeTab={tab} onTabChange={setTab} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 bg-white flex-shrink-0">
          <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest hidden sm:block">
            Global Comms Hub
          </span>
          <span className="text-gray-300 text-xs hidden sm:block">/</span>
          <span className="text-[13px] font-semibold text-gray-700">
            {PAGE_ICONS[tab]} {t(`page.${tab}`)}
          </span>

          <div className="ml-auto flex items-center gap-0.5">
            {/* Notificaciones */}
            <button
              onClick={() => setNotifOpen(o => !o)}
              className={`relative p-2 rounded-lg transition-colors ${notifOpen ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'}`}
              title="Notificaciones"
            >
              <Bell className="h-4 w-4" />
              <NotifBadge />
            </button>
            {/* Divider */}
            <div className="w-px h-5 bg-gray-200 mx-1.5" />
            {/* User */}
            <UserMenu />
          </div>
        </header>

        {/* Panels */}
        <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} onGoToCalendar={() => { setTab('cal'); setNotifOpen(false) }} />

        <div key={tab} className="flex-1 overflow-hidden page-fade">
          {tab === 'cal'   && <CalendarPage    />}
          {tab === 'brief' && <BriefingPage    />}
          {tab === 'map'   && <AdminGlobalPage />}
          {tab === 'data'  && <DataMasterPage  />}
          {tab === 'admin' && <AdminPage       />}
          {tab === 'about' && <AboutPage       />}
        </div>
      </main>
    </div>
  )
}

// ── Router de autenticación (solo modo producción) ─────────────────
function AuthRouter() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-gray-900 flex items-center justify-center">
            <span className="text-white text-[9px] font-black tracking-tight">GCH</span>
          </div>
          <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!user) return <LoginPage />

  return (
    <AppProvider>
      <Shell />
      <Toaster />
    </AppProvider>
  )
}

// ── App root ───────────────────────────────────────────────────────
export default function App() {
  if (DEMO_MODE) {
    return (
      <DemoProvider>
        <Shell />
        <Toaster />
      </DemoProvider>
    )
  }

  return (
    <AuthProvider>
      <AuthRouter />
    </AuthProvider>
  )
}
