import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bell } from 'lucide-react'
import { Toaster } from '@/components/layout/Toaster'
import Sidebar from '@/components/layout/Sidebar'
import NotificationPanel, { NotifBadge } from '@/components/layout/NotificationPanel'
import BriefingPanel from '@/components/layout/BriefingPanel'
import CalendarPage from '@/pages/CalendarPage'
import DataMasterPage from '@/pages/DataMasterPage'
import AdminGlobalPage from '@/pages/AdminGlobalPage'
import AdminPage from '@/pages/AdminPage'
import LoginPage from '@/pages/LoginPage'
import { DemoProvider } from '@/demo/DemoProvider'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { AppProvider } from '@/contexts/AppContext'

// ── Modo ───────────────────────────────────────────────────────────
// true  → demo en memoria (sin Supabase)
// false → producción con Supabase auth
const DEMO_MODE = false

// ── Shell (layout compartido) ──────────────────────────────────────
const PAGE_ICONS = { cal: '📅', map: '✦', data: '🗃', admin: '⚙️' }

function Shell() {
  const [tab,          setTab]          = useState('cal')
  const [notifOpen,    setNotifOpen]    = useState(false)
  const [briefingOpen, setBriefingOpen] = useState(false)
  const { t } = useTranslation()

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar activeTab={tab} onTabChange={setTab} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center gap-2 px-5 py-2.5 border-b border-gray-100 bg-white flex-shrink-0">
          <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">
            Global Comms Hub
          </span>
          <span className="text-gray-300 text-xs">/</span>
          <span className="text-[13px] font-semibold text-gray-700">
            {PAGE_ICONS[tab]} {t(`page.${tab}`)}
          </span>

          {/* Acciones rápidas — margen superior derecho */}
          <div className="ml-auto flex items-center gap-1">
            {/* Briefing */}
            <button
              onClick={() => setBriefingOpen(o => !o)}
              className={`p-2 rounded-lg transition-colors text-sm ${briefingOpen ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'}`}
              title="Briefing diario"
            >
              📋
            </button>
            {/* Notificaciones */}
            <button
              onClick={() => setNotifOpen(o => !o)}
              className={`relative p-2 rounded-lg transition-colors ${notifOpen ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'}`}
              title="Notificaciones"
            >
              <Bell className="h-4 w-4" />
              <NotifBadge />
            </button>
          </div>
        </header>

        {/* Panels */}
        <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} onGoToCalendar={() => { setTab('cal'); setNotifOpen(false) }} />
        <BriefingPanel open={briefingOpen} onClose={() => setBriefingOpen(false)} />

        <div key={tab} className="flex-1 overflow-hidden page-fade">
          {tab === 'cal'   && <CalendarPage    />}
          {tab === 'map'   && <AdminGlobalPage />}
          {tab === 'data'  && <DataMasterPage  />}
          {tab === 'admin' && <AdminPage       />}
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
