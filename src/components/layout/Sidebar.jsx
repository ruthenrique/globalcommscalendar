import { useState } from 'react'
import {
  Calendar, BarChart2, Table2, Globe2, Settings,
  ChevronLeft, ChevronRight, LogOut, KeyRound, Bell,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/layout/Toaster'
import { ROLE_META, NAV_ITEMS } from '@/lib/constants'
import NotificationPanel, { NotifBadge } from '@/components/layout/NotificationPanel'
import BriefingPanel from '@/components/layout/BriefingPanel'

const ICON_MAP = { Calendar, BarChart2, Table2, Globe2, Settings }
const LANGS = ['es', 'en', 'pt']

export default function Sidebar({ activeTab, onTabChange }) {
  const [collapsed,  setCollapsed]  = useState(() => typeof window !== 'undefined' && window.innerWidth < 640)
  const [changePw,   setChangePw]   = useState(false)
  const [pwForm,     setPwForm]     = useState({ pw: '', pw2: '' })
  const [notifOpen,    setNotifOpen]    = useState(false)
  const [briefingOpen, setBriefingOpen] = useState(false)

  async function handleChangePw() {
    if (pwForm.pw.length < 6) return toast({ title: 'Mínimo 6 caracteres', variant: 'destructive' })
    if (pwForm.pw !== pwForm.pw2) return toast({ title: 'Las contraseñas no coinciden', variant: 'destructive' })
    const { error } = await supabase.auth.updateUser({ password: pwForm.pw })
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' })
    else {
      toast({ title: 'Contraseña actualizada ✓', variant: 'success' })
      setChangePw(false)
      setPwForm({ pw: '', pw2: '' })
    }
  }
  const { profile, role, signOut }  = useAuth()
  const { t, i18n }                 = useTranslation()
  const perms = ROLE_META[role] ?? ROLE_META.viewer

  const navItems = NAV_ITEMS.filter(item => {
    if (item.id === 'admin') return perms.canManage
    if (item.id === 'data')  return role !== 'viewer'
    return true
  })

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-200 flex-shrink-0',
        collapsed ? 'w-14' : 'w-52'
      )}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-3 py-4 border-b border-sidebar-border">
        <div className="w-7 h-7 rounded-sm bg-sidebar-foreground flex items-center justify-center flex-shrink-0">
          <span className="text-sidebar-background text-[10px] font-black tracking-tight">GCH</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="text-sm font-bold text-sidebar-foreground tracking-tight truncate">Global Comms Hub</div>
            <div className="text-[10px] text-sidebar-foreground/40 uppercase tracking-widest truncate">{t('sidebar.subtitle')}</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="ml-auto text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors flex-shrink-0"
        >
          {collapsed
            ? <ChevronRight className="h-4 w-4" />
            : <ChevronLeft  className="h-4 w-4" />
          }
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-1.5 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const Icon   = ICON_MAP[item.icon]
          const active = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-all relative',
                active
                  ? 'bg-sidebar-accent text-sidebar-foreground font-semibold'
                  : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground font-normal'
              )}
              title={collapsed ? t(`nav.${item.id}`) : undefined}
            >
              {active && (
                <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-sidebar-primary" />
              )}
              <Icon className={cn('h-4 w-4 flex-shrink-0', active ? 'text-sidebar-primary' : 'text-sidebar-foreground/50')} />
              {!collapsed && <span className="truncate">{t(`nav.${item.id}`)}</span>}
            </button>
          )
        })}
      </nav>

      {/* Briefing */}
      <div className="px-1.5 pt-1 border-t border-sidebar-border">
        <button
          onClick={() => setBriefingOpen(o => !o)}
          className={cn(
            'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-colors',
            briefingOpen
              ? 'bg-sidebar-accent text-sidebar-foreground'
              : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground',
            collapsed && 'justify-center'
          )}
          title="Briefing diario"
        >
          <span className="text-sm leading-none flex-shrink-0">📋</span>
          {!collapsed && <span className="text-sm truncate">Briefing</span>}
        </button>
      </div>

      {/* Notification bell */}
      <div className="px-1.5 pt-1">
        <button
          onClick={() => setNotifOpen(o => !o)}
          className={cn(
            'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-colors relative',
            notifOpen
              ? 'bg-sidebar-accent text-sidebar-foreground'
              : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground',
            collapsed && 'justify-center'
          )}
          title="Notificaciones"
        >
          <div className="relative flex-shrink-0">
            <Bell className="h-4 w-4" />
            <NotifBadge />
          </div>
          {!collapsed && <span className="text-sm truncate">Notificaciones</span>}
        </button>
      </div>

      {/* Language switcher */}
      {!collapsed && (
        <div className="px-3 pb-1 pt-2 border-t border-sidebar-border">
          <div className="flex items-center gap-1">
            {LANGS.map(lang => (
              <button
                key={lang}
                onClick={() => i18n.changeLanguage(lang)}
                className={cn(
                  'flex-1 text-[10px] font-bold rounded-md py-1 uppercase tracking-wide transition-colors',
                  i18n.language.startsWith(lang)
                    ? 'bg-sidebar-primary text-white'
                    : 'text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                )}
              >
                {t(`lang.${lang}`)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* User */}
      <div className="px-1.5 pb-3 pt-2 space-y-1">
        <div className={cn(
          'flex items-center gap-2 px-2.5 py-2 rounded-md',
          collapsed ? 'justify-center' : ''
        )}>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: profile?.color ?? '#0EA5E9' }}
          >
            {profile?.initials ?? 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <div className="text-xs font-medium text-sidebar-foreground truncate">{profile?.name ?? 'Usuario'}</div>
              <div className="text-[10px] text-sidebar-foreground/50 truncate">
                {ROLE_META[role]?.label ?? 'Viewer'}
              </div>
            </div>
          )}
        </div>
        {changePw && !collapsed && (
          <div className="px-2.5 py-2 space-y-1.5">
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={pwForm.pw}
              onChange={e => setPwForm(f => ({ ...f, pw: e.target.value }))}
              className="w-full text-xs border rounded px-2 py-1 h-7"
            />
            <input
              type="password"
              placeholder="Repetir contraseña"
              value={pwForm.pw2}
              onChange={e => setPwForm(f => ({ ...f, pw2: e.target.value }))}
              className="w-full text-xs border rounded px-2 py-1 h-7"
            />
            <div className="flex gap-1">
              <button onClick={handleChangePw} className="flex-1 text-[10px] bg-primary text-white rounded px-2 py-1">Guardar</button>
              <button onClick={() => { setChangePw(false); setPwForm({ pw: '', pw2: '' }) }} className="flex-1 text-[10px] border rounded px-2 py-1">Cancelar</button>
            </div>
          </div>
        )}
        <button
          onClick={() => setChangePw(v => !v)}
          className={cn(
            'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors',
            collapsed && 'justify-center'
          )}
          title="Cambiar contraseña"
        >
          <KeyRound className="h-3.5 w-3.5 flex-shrink-0" />
          {!collapsed && 'Cambiar contraseña'}
        </button>
        <button
          onClick={signOut}
          className={cn(
            'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors',
            collapsed && 'justify-center'
          )}
          title={t('sidebar.signOut')}
        >
          <LogOut className="h-3.5 w-3.5 flex-shrink-0" />
          {!collapsed && t('sidebar.signOut')}
        </button>
      </div>

      {/* Notification panel */}
      <NotificationPanel
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        onGoToCalendar={() => onTabChange('cal')}
      />

      {/* Briefing panel */}
      <BriefingPanel
        open={briefingOpen}
        onClose={() => setBriefingOpen(false)}
      />
    </aside>
  )
}
