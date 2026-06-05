import { useMemo, useEffect, useRef } from 'react'
import { X, CalendarDays, ChevronRight } from 'lucide-react'
import { useApp }  from '@/contexts/AppContext'
import { useAuth } from '@/contexts/AuthContext'
import { arr, todayStr, cn } from '@/lib/utils'
import { COUNTRY_META, STATUS_META, CHANNEL_META } from '@/lib/constants'

// ── Helpers ───────────────────────────────────────────────
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DAYS_ES   = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const DAYS_SH   = ['Do','Lu','Ma','Mi','Ju','Vi','Sá']

function formatDay(ds, opts = {}) {
  const d = new Date(ds + 'T00:00:00')
  if (opts.short) return `${DAYS_SH[d.getDay()]} ${d.getDate()}`
  return `${DAYS_ES[d.getDay()]} ${d.getDate()} de ${MONTHS_ES[d.getMonth()]}`
}

function addDays(ds, n) {
  const d = new Date(ds + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

// ── Single comm row ───────────────────────────────────────
function CommRow({ c }) {
  const paises = arr(c.pais).slice(0, 4)
  const status = arr(c.estado)[0]
  const meta   = STATUS_META[status] ?? {}
  const isWarning = status === 'Borrador' || status === 'En revisión'
  return (
    <div className="flex items-center gap-2.5 py-1.5 px-3 rounded-lg hover:bg-gray-50 transition-colors">
      <span className="text-sm leading-none flex-shrink-0 min-w-[24px]">
        {paises.map(p => COUNTRY_META[p]?.flag ?? '').join('') || '🌐'}
      </span>
      <span className="flex-1 text-xs text-gray-800 truncate">{c.titulo}</span>
      <span
        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 flex items-center gap-1"
        style={{ background: meta.bg ?? '#f5f5f5', color: meta.color ?? '#666' }}
      >
        {isWarning && <span>⚠️</span>}
        {status}
      </span>
    </div>
  )
}

// ── Channel group ─────────────────────────────────────────
function ChannelGroup({ canal, comms }) {
  const meta = CHANNEL_META[canal] ?? {}
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 px-3 mb-1">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: meta.color ?? '#ccc' }} />
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{canal}</span>
        <span className="text-[10px] text-gray-300 ml-auto">{comms.length}</span>
      </div>
      {comms.map(c => <CommRow key={c.id} c={c} />)}
    </div>
  )
}

// ── Day section ───────────────────────────────────────────
function DaySection({ ds, comms, isToday }) {
  // group by canal
  const byCanal = {}
  comms.forEach(c => {
    const ch = arr(c.canal)[0] ?? 'Sin canal'
    if (!byCanal[ch]) byCanal[ch] = []
    byCanal[ch].push(c)
  })

  return (
    <div className="mb-5">
      {/* Day header */}
      <div className={cn(
        'flex items-center gap-2 px-3 py-2 mb-2 rounded-xl',
        isToday ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-700'
      )}>
        <CalendarDays className={cn('h-3.5 w-3.5 flex-shrink-0', isToday ? 'text-white/70' : 'text-gray-400')} />
        <span className={cn('text-xs font-bold', isToday ? 'text-white' : 'text-gray-800')}>
          {isToday ? `HOY — ${formatDay(ds)}` : formatDay(ds)}
        </span>
        <span className={cn(
          'ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full',
          isToday ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
        )}>
          {comms.length}
        </span>
      </div>

      {/* Groups by channel */}
      {Object.entries(byCanal).map(([canal, evs]) => (
        <ChannelGroup key={canal} canal={canal} comms={evs} />
      ))}
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────
export default function BriefingPanel({ open, onClose }) {
  const { communications } = useApp()
  const { role, myCountries } = useAuth()
  const ref = useRef(null)

  // Filter to user's countries
  const mine = useMemo(() => {
    const isRestricted = role !== 'super_admin' && myCountries.length > 0
    return isRestricted
      ? communications.filter(c => arr(c.pais).some(p => myCountries.includes(p) || p === 'GL'))
      : communications
  }, [communications, role, myCountries])

  // Build days: today + next 6 days
  const days = useMemo(() => {
    const today = todayStr()
    const result = []
    for (let i = 0; i < 7; i++) {
      const ds    = addDays(today, i)
      const comms = mine.filter(c => c.date === ds && arr(c.estado)[0] !== 'Cancelado')
      if (i === 0 || comms.length > 0) result.push({ ds, comms, isToday: i === 0 })
    }
    return result
  }, [mine])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open, onClose])

  if (!open) return null

  const today     = todayStr()
  const todayDate = new Date(today + 'T00:00:00')

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]" onClick={onClose} />

      <div
        ref={ref}
        className="fixed inset-y-0 right-0 z-50 w-80 sm:w-96 bg-white shadow-2xl border-l border-gray-100 flex flex-col animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base">📋</span>
              <span className="text-sm font-black text-gray-900 tracking-tight">Briefing</span>
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-widest">
              {DAYS_ES[todayDate.getDay()]} {todayDate.getDate()} de {MONTHS_ES[todayDate.getMonth()]} {todayDate.getFullYear()}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-2 py-4">
          {days.every(d => d.comms.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="text-4xl mb-3">🎉</span>
              <p className="text-sm font-semibold text-gray-500">Sin comms esta semana</p>
              <p className="text-xs text-gray-300 mt-1">Disfrutá el silencio</p>
            </div>
          ) : (
            days.map(({ ds, comms, isToday }) => (
              comms.length > 0 || isToday ? (
                <DaySection key={ds} ds={ds} comms={comms} isToday={isToday} />
              ) : null
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0">
          <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest">
            Próximos 7 días · {mine.filter(c => {
              const t = todayStr(); const end = addDays(t, 6)
              return c.date >= t && c.date <= end && arr(c.estado)[0] !== 'Cancelado'
            }).length} comms planificadas
          </p>
        </div>
      </div>
    </>
  )
}
