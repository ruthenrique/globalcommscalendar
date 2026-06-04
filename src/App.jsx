import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Toaster } from '@/components/layout/Toaster'
import Sidebar from '@/components/layout/Sidebar'
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
const PAGE_ICONS = { cal: '📅', map: '📊', data: '🗃', admin: '⚙️' }

function Shell() {
  const [tab, setTab] = useState('cal')
  const { t } = useTranslation()

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar activeTab={tab} onTabChange={setTab} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center gap-2 px-5 py-2.5 border-b border-gray-100 bg-white flex-shrink-0">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
            CommOS
          </span>
          <span className="text-gray-300 text-xs">/</span>
          <span className="text-[13px] font-semibold text-gray-700">
            {PAGE_ICONS[tab]} {t(`page.${tab}`)}
          </span>
        </header>

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
          <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center">
            <span className="text-white text-sm font-bold">C</span>
          </div>
          <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
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
