import { useState } from 'react'
import {
  Calendar, BarChart2, Table2, Globe2, Settings,
  ChevronLeft, ChevronRight, ClipboardList, Info,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { NAV_ITEMS } from '@/lib/constants'

const ICON_MAP = { Calendar, BarChart2, Table2, Globe2, Settings, ClipboardList, Info }
const LANGS = ['es', 'en', 'pt']

export default function Sidebar({ activeTab, onTabChange }) {
  const [collapsed, setCollapsed] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640)

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
  const { perms, role } = useAuth()
  const { t }           = useTranslation()

  const navItems = NAV_ITEMS.filter(item => {
    if (item.id === 'admin') return perms?.canManage
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


    </aside>
  )
}
