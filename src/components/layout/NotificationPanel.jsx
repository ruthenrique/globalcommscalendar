import { useMemo, useEffect, useRef, useState } from 'react'
import { Bell, X, ChevronRight } from 'lucide-react'
import { useApp }  from '@/contexts/AppContext'
import { useAuth } from '@/contexts/AuthContext'
import { arr, todayStr, cn } from '@/lib/utils'
import { COUNTRY_META, INTERNAL_CHANNELS } from '@/lib/constants'
import CommModal from '@/components/CommModal'

// ── Helpers ──────────────────────────────────────────────
function addDay(ds) {
  const d = new Date(ds + 'T00:00:00')
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

// ── Hook: compute notifications from existing data ────────
function useNotifications() {
  const { communications } = useApp()
  const { role, myCountries } = useAuth()

  return useMemo(() => {
    const today    = todayStr()
    const tomorrow = addDay(today)
    const isRestricted = role !== 'super_admin' && myCountries.length > 0
    const mine = isRestricted
      ? communications.filter(c => arr(c.pais).some(p => myCountries.includes(p) || p === 'GL'))
      : communications

    const groups = []

    // 1. Vencidas — fecha pasada, no Publicado ni Cancelado
    const overdue = mine
      .filter(c => c.date < today && !['Publicado', 'Cancelado'].includes(arr(c.estado)[0]))
      .sort((a, b) => b.date.localeCompare(a.date))
    if (overdue.length) groups.push({
      id: 'overdue', priority: 1,
      icon: '⏰', label: 'Vencidas sin publicar',
      color: 'text-red-600', badgeBg: 'bg-red-500', rowBg: 'hover:bg-red-50/50',
      count: overdue.length, comms: overdue,
    })

    // 2. Mañana en Borrador
    const tomorrowDraft = mine.filter(c =>
      c.date === tomorrow && arr(c.estado)[0] === 'Borrador'
    )
    if (tomorrowDraft.length) groups.push({
      id: 'tomorrow', priority: 2,
      icon: '⚠️', label: 'Mañana en Borrador',
      color: 'text-amber-600', badgeBg: 'bg-amber-500', rowBg: 'hover:bg-amber-50/50',
      count: tomorrowDraft.length, comms: tomorrowDraft,
    })

    // 3. Planificadas hoy
    const todayComms = mine.filter(c =>
      c.date === today && arr(c.estado)[0] !== 'Cancelado'
    )
    if (todayComms.length) groups.push({
      id: 'today', priority: 3,
      icon: '📅', label: 'Planificadas hoy',
      color: 'text-sky-600', badgeBg: 'bg-sky-500', rowBg: 'hover:bg-sky-50/50',
      count: todayComms.length, comms: todayComms,
    })

    // 4. En revisión
    const review = mine.filter(c => arr(c.estado)[0] === 'En revisión')
    if (review.length) groups.push({
      id: 'review', priority: 4,
      icon: '📋', label: 'Pendientes de aprobación',
      color: 'text-purple-600', badgeBg: 'bg-purple-500', rowBg: 'hover:bg-purple-50/50',
      count: review.length, comms: review,
    })

    return groups
  }, [communications, role, myCountries])
}

// ── Comm row ─────────────────────────────────────────────
function CommRow({ c, rowBg, onOpen }) {
  const paises = arr(c.pais).slice(0, 3)
  const canal  = arr(c.canal)[0]
  const [d, m] = (c.date ?? '').split('-').reverse()
  return (
    <div
      onClick={() => onOpen(c)}
      className={cn('flex items-center gap-2.5 py-1.5 px-3 rounded-lg mx-2 cursor-pointer transition-colors group', rowBg)}
    >
      <div className="text-sm leading-none flex-shrink-0">
        {paises.map(p => COUNTRY_META[p]?.flag ?? '').join('') || '🌐'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-800 truncate">{c.titulo}</div>
        <div className="text-[10px] text-gray-400 mt-px">
          {canal && <span>{canal} · </span>}
          <span>{d}/{m}</span>
        </div>
      </div>
      <span className="text-gray-300 group-hover:text-gray-500 transition-colors text-sm leading-none flex-shrink-0">›</span>
    </div>
  )
}

// ── Notification group ────────────────────────────────────
function NotifGroup({ group, onOpen }) {
  const [open, setOpen] = useState(true)
  const visible = group.comms.slice(0, 6)
  const extra   = group.comms.length - visible.length

  return (
    <div className="mb-0.5">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 transition-colors"
      >
        <span className="text-base leading-none">{group.icon}</span>
        <span className={cn('text-xs font-semibold flex-1 text-left', group.color)}>
          {group.label}
        </span>
        <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white min-w-[20px] text-center', group.badgeBg)}>
          {group.count}
        </span>
        <ChevronRight className={cn('h-3 w-3 text-gray-300 transition-transform flex-shrink-0', open && 'rotate-90')} />
      </button>

      {open && (
        <div className="pb-2 space-y-0.5">
          {visible.map(c => <CommRow key={c.id} c={c} rowBg={group.rowBg} onOpen={onOpen} />)}
          {extra > 0 && (
            <p className="text-[10px] text-gray-400 px-5 pt-1">+{extra} más</p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Badge (exported for Sidebar) ─────────────────────────
export function NotifBadge() {
  const groups = useNotifications()
  const total  = groups.reduce((n, g) => n + g.count, 0)
  if (!total) return null
  return (
    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
      {total > 99 ? '99+' : total}
    </span>
  )
}

// ── Main panel ────────────────────────────────────────────
export default function NotificationPanel({ open, onClose, onGoToCalendar }) {
  const groups    = useNotifications()
  const total     = groups.reduce((n, g) => n + g.count, 0)
  const panelRef  = useRef(null)
  const [editComm, setEditComm] = useState(null)

  function handleOpenComm(c) {
    setEditComm(c)
    onClose()   // cierra el panel mientras edita
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handle(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handle)
    document.addEventListener('touchstart', handle, { passive: true })
    return () => {
      document.removeEventListener('mousedown', handle)
      document.removeEventListener('touchstart', handle)
    }
  }, [open, onClose])

  return (
    <>
      {/* Panel — solo visible cuando open=true */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden />
          <div
            ref={panelRef}
            className="fixed right-3 top-[52px] z-50 w-80 max-h-[calc(100vh-70px)] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-gray-700" />
                <span className="text-sm font-bold text-gray-900 tracking-tight">Notificaciones</span>
                {total > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white leading-none">
                    {total}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto py-2 min-h-0">
              {groups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                    <Bell className="h-6 w-6 text-gray-200" />
                  </div>
                  <p className="text-sm font-semibold text-gray-500">Todo al día</p>
                  <p className="text-xs text-gray-300 mt-1">Sin alertas pendientes</p>
                </div>
              ) : (
                groups.map(g => <NotifGroup key={g.id} group={g} onOpen={handleOpenComm} />)
              )}
            </div>

            {/* Footer */}
            {groups.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0">
                <button
                  onClick={() => { onGoToCalendar(); onClose() }}
                  className="w-full text-xs text-sky-600 hover:text-sky-700 font-semibold text-center py-1.5 rounded-lg hover:bg-sky-50 transition-colors"
                >
                  Ver en calendario →
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* CommModal — vive fuera del panel para sobrevivir cuando panel se cierra */}
      <CommModal
        open={!!editComm}
        onClose={() => setEditComm(null)}
        initial={editComm}
      />
    </>
  )
}
