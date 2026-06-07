import { useMemo, useEffect, useRef, useState, useCallback } from 'react'
import { Bell, X, ChevronRight, Pencil, CalendarDays } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useApp }  from '@/contexts/AppContext'
import { useAuth } from '@/contexts/AuthContext'
import { arr, todayStr, cn } from '@/lib/utils'
import { COUNTRY_META, CHANNEL_META, STATUS_META } from '@/lib/constants'
import CommModal from '@/components/CommModal'

// ── Helpers ──────────────────────────────────────────────
function addDay(ds) {
  const d = new Date(ds + 'T00:00:00')
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}
function fmtDate(ds) {
  if (!ds) return ''
  const [y, m, d] = ds.split('-')
  return `${d}/${m}/${y}`
}

// ── Hook: compute notifications ──────────────────────────
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

    const overdue = mine
      .filter(c => c.date < today && !['Publicado','Cancelado'].includes(arr(c.estado)[0]))
      .sort((a, b) => b.date.localeCompare(a.date))
    if (overdue.length) groups.push({
      id: 'overdue', labelKey: 'notif.overdue', icon: '⏰',
      color: 'text-red-600', badgeBg: 'bg-red-500', rowBg: 'hover:bg-red-50',
      count: overdue.length, comms: overdue,
    })

    const tomorrowDraft = mine.filter(c => c.date === tomorrow && arr(c.estado)[0] === 'Borrador')
    if (tomorrowDraft.length) groups.push({
      id: 'tomorrow', labelKey: 'notif.tomorrow', icon: '⚠️',
      color: 'text-amber-600', badgeBg: 'bg-amber-500', rowBg: 'hover:bg-amber-50',
      count: tomorrowDraft.length, comms: tomorrowDraft,
    })

    const todayComms = mine.filter(c => c.date === today && arr(c.estado)[0] !== 'Cancelado')
    if (todayComms.length) groups.push({
      id: 'today', labelKey: 'notif.today', icon: '📅',
      color: 'text-sky-600', badgeBg: 'bg-sky-500', rowBg: 'hover:bg-sky-50',
      count: todayComms.length, comms: todayComms,
    })

    const review = mine.filter(c => arr(c.estado)[0] === 'En revisión')
    if (review.length) groups.push({
      id: 'review', labelKey: 'notif.review', icon: '📋',
      color: 'text-purple-600', badgeBg: 'bg-purple-500', rowBg: 'hover:bg-purple-50',
      count: review.length, comms: review,
    })

    return groups
  }, [communications, role, myCountries])
}

// ── Hover Preview Card ────────────────────────────────────
function CommPreview({ comm, top, onEdit }) {
  const { t } = useTranslation()
  const paises  = arr(comm.pais)
  const canales = arr(comm.canal)
  const estado  = arr(comm.estado)[0]
  const formato = arr(comm.formato)[0]
  const sMeta   = STATUS_META[estado] ?? {}
  const cMeta   = CHANNEL_META[canales[0]] ?? {}

  // clamp vertically so card doesn't go off screen
  const clampedTop = Math.min(Math.max(top - 20, 60), window.innerHeight - 280)

  return (
    <div
      className="fixed z-[60] w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-right-2 duration-150"
      style={{ top: clampedTop, right: 'calc(20rem + 1.25rem)' }}
      // keep visible when mouse moves onto this card
      onMouseEnter={() => {}}
    >
      {/* Status bar top */}
      <div className="h-1" style={{ background: sMeta.dot ?? '#ccc' }} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-gray-900 leading-snug mb-1">{comm.titulo}</div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: sMeta.bg, color: sMeta.color }}
              >
                {estado}
              </span>
              {formato && (
                <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                  {formato}
                </span>
              )}
            </div>
          </div>
          <div className="text-xl leading-none flex-shrink-0 mt-0.5">
            {paises.slice(0, 3).map(p => COUNTRY_META[p]?.flag ?? '').join('') || '🌐'}
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 mb-3 text-[11px] text-gray-400">
          <div className="flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            <span>{fmtDate(comm.date)}</span>
          </div>
          {canales[0] && (
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: cMeta.color ?? '#ccc' }} />
              <span>{canales.join(', ')}</span>
            </div>
          )}
        </div>

        {/* Países */}
        {paises.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {paises.map(p => (
              <span key={p} className="text-[10px] bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded-full border border-gray-100">
                {COUNTRY_META[p]?.flag ?? ''} {COUNTRY_META[p]?.name ?? p}
              </span>
            ))}
          </div>
        )}

        {/* Body snippet */}
        {comm.body && (
          <p className="text-[11px] text-gray-400 leading-relaxed mb-3 line-clamp-3 bg-gray-50 rounded-lg px-3 py-2">
            {comm.body}
          </p>
        )}

        {/* Action */}
        <button
          onClick={() => onEdit(comm)}
          className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-gray-900 hover:bg-gray-700 rounded-xl py-2 transition-colors"
        >
          <Pencil className="h-3 w-3" />
          {t('notif.openEdit')}
        </button>
      </div>
    </div>
  )
}

// ── Comm row ─────────────────────────────────────────────
function CommRow({ c, rowBg, onHover, onLeave }) {
  const paises = arr(c.pais).slice(0, 3)
  const canal  = arr(c.canal)[0]
  const [dd, mm] = (c.date ?? '').split('-').reverse()

  return (
    <div
      onMouseEnter={e => onHover(c, e.currentTarget.getBoundingClientRect().top)}
      onMouseLeave={onLeave}
      className={cn('flex items-center gap-2.5 py-1.5 px-3 rounded-lg mx-2 cursor-default transition-colors group', rowBg)}
    >
      <div className="text-sm leading-none flex-shrink-0">
        {paises.map(p => COUNTRY_META[p]?.flag ?? '').join('') || '🌐'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-800 truncate">{c.titulo}</div>
        <div className="text-[10px] text-gray-400 mt-px">
          {canal && <span>{canal} · </span>}
          <span>{dd}/{mm}</span>
        </div>
      </div>
      <ChevronRight className="h-3 w-3 text-gray-200 group-hover:text-gray-400 transition-colors flex-shrink-0" />
    </div>
  )
}

// ── Notification group ────────────────────────────────────
function NotifGroup({ group, onHover, onLeave }) {
  const { t } = useTranslation()
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
        <span className={cn('text-xs font-semibold flex-1 text-left', group.color)}>{t(group.labelKey)}</span>
        <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white min-w-[20px] text-center', group.badgeBg)}>
          {group.count}
        </span>
        <ChevronRight className={cn('h-3 w-3 text-gray-300 transition-transform flex-shrink-0', open && 'rotate-90')} />
      </button>

      {open && (
        <div className="pb-2 space-y-0.5">
          {visible.map(c => (
            <CommRow key={c.id} c={c} rowBg={group.rowBg} onHover={onHover} onLeave={onLeave} />
          ))}
          {extra > 0 && (
            <p className="text-[10px] text-gray-400 px-5 pt-1">+{extra} más</p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────
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
  const { t }    = useTranslation()
  const groups   = useNotifications()
  const total    = groups.reduce((n, g) => n + g.count, 0)
  const panelRef = useRef(null)
  const hideTimer = useRef(null)

  const [editComm,   setEditComm]   = useState(null)
  const [preview,    setPreview]    = useState(null) // { comm, top }

  // Hover handlers con delay para evitar flickering
  const handleHover = useCallback((c, top) => {
    clearTimeout(hideTimer.current)
    setPreview({ comm: c, top })
  }, [])

  const handleLeave = useCallback(() => {
    hideTimer.current = setTimeout(() => setPreview(null), 120)
  }, [])

  const handlePreviewEnter = useCallback(() => {
    clearTimeout(hideTimer.current)
  }, [])

  const handlePreviewLeave = useCallback(() => {
    hideTimer.current = setTimeout(() => setPreview(null), 120)
  }, [])

  function handleEdit(c) {
    setPreview(null)
    setEditComm(c)
    onClose()
  }

  // Close panel on outside click
  useEffect(() => {
    if (!open) return
    function handle(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setPreview(null)
        onClose()
      }
    }
    document.addEventListener('mousedown', handle)
    document.addEventListener('touchstart', handle, { passive: true })
    return () => {
      document.removeEventListener('mousedown', handle)
      document.removeEventListener('touchstart', handle)
    }
  }, [open, onClose])

  // clear timer on unmount
  useEffect(() => () => clearTimeout(hideTimer.current), [])

  return (
    <>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setPreview(null); onClose() }} aria-hidden />

          {/* Preview card — aparece a la izquierda del panel */}
          {preview && (
            <div
              onMouseEnter={handlePreviewEnter}
              onMouseLeave={handlePreviewLeave}
            >
              <CommPreview
                comm={preview.comm}
                top={preview.top}
                onEdit={handleEdit}
              />
            </div>
          )}

          {/* Panel principal */}
          <div
            ref={panelRef}
            className="fixed right-3 top-[52px] z-50 w-80 max-h-[calc(100vh-70px)] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-gray-700" />
                <span className="text-sm font-bold text-gray-900 tracking-tight">{t('notif.title')}</span>
                {total > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white leading-none">
                    {total}
                  </span>
                )}
              </div>
              <button
                onClick={() => { setPreview(null); onClose() }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-2 min-h-0">
              {groups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                    <Bell className="h-6 w-6 text-gray-200" />
                  </div>
                  <p className="text-sm font-semibold text-gray-500">{t('notif.empty')}</p>
                  <p className="text-xs text-gray-300 mt-1">{t('notif.emptyDesc')}</p>
                </div>
              ) : (
                groups.map(g => (
                  <NotifGroup key={g.id} group={g} onHover={handleHover} onLeave={handleLeave} />
                ))
              )}
            </div>

            {groups.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0">
                <button
                  onClick={() => { setPreview(null); onGoToCalendar(); onClose() }}
                  className="w-full text-xs text-sky-600 hover:text-sky-700 font-semibold text-center py-1.5 rounded-lg hover:bg-sky-50 transition-colors"
                >
                  {t('notif.goCalendar')}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* CommModal fuera del panel */}
      <CommModal
        open={!!editComm}
        onClose={() => setEditComm(null)}
        initial={editComm}
      />
    </>
  )
}
