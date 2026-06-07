import { useMemo, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { useApp }  from '@/contexts/AppContext'
import { useAuth } from '@/contexts/AuthContext'
import { arr, todayStr } from '@/lib/utils'
import { COUNTRY_META, STATUS_META, CHANNEL_META } from '@/lib/constants'
import CommModal from '@/components/CommModal'

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DAYS_ES   = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const DAYS_SH   = ['Do','Lu','Ma','Mi','Ju','Vi','Sá']

function addDays(ds, n) {
  const d = new Date(ds + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function CommCard({ c, onOpen }) {
  const paises = arr(c.pais)
  const status = arr(c.estado)[0]
  const canal  = arr(c.canal)[0]
  const meta   = STATUS_META[status] ?? {}
  const chMeta = CHANNEL_META[canal] ?? {}
  return (
    <div
      onClick={() => onOpen(c)}
      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-colors cursor-pointer group"
    >
      <div className="flex-shrink-0 text-base leading-none w-8 text-center">
        {paises.slice(0, 2).map(p => COUNTRY_META[p]?.flag ?? '').join('') || '🌐'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-800 truncate">{c.titulo}</div>
        <div className="flex items-center gap-2 mt-0.5">
          {canal && (
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: chMeta.color ?? '#ccc' }} />
              <span className="text-[11px] text-gray-400">{canal}</span>
            </div>
          )}
          {arr(c.segmento)[0] && (
            <span className="text-[11px] text-gray-300">· {arr(c.segmento)[0]}</span>
          )}
        </div>
      </div>
      <span
        className="text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
        style={{ background: meta.bg ?? '#f5f5f5', color: meta.color ?? '#666' }}
      >
        {status}
      </span>
      <span className="text-gray-200 group-hover:text-gray-400 transition-colors flex-shrink-0 text-base leading-none">›</span>
    </div>
  )
}

function DayBlock({ ds, comms, isToday, onOpen }) {
  const d = new Date(ds + 'T00:00:00')
  const label = isToday
    ? `HOY — ${DAYS_ES[d.getDay()]} ${d.getDate()} de ${MONTHS_ES[d.getMonth()]}`
    : `${DAYS_ES[d.getDay()]} ${d.getDate()} de ${MONTHS_ES[d.getMonth()]}`

  // group by canal
  const byCanal = {}
  comms.forEach(c => {
    const ch = arr(c.canal)[0] ?? 'Sin canal'
    if (!byCanal[ch]) byCanal[ch] = []
    byCanal[ch].push(c)
  })

  return (
    <div className="mb-8">
      <div className={`flex items-center gap-3 mb-3 px-1 ${isToday ? '' : ''}`}>
        <div className={`flex items-center justify-center rounded-xl px-3 py-1.5 ${isToday ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
          <CalendarDays className="h-3.5 w-3.5 mr-2 opacity-70" />
          <span className={`text-xs font-bold ${isToday ? 'text-white' : 'text-gray-700'}`}>{label}</span>
          <span className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isToday ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'}`}>
            {comms.length}
          </span>
        </div>
      </div>

      {comms.length === 0 ? (
        <p className="text-sm text-gray-300 px-4 py-2">Sin comunicaciones</p>
      ) : (
        <div className="space-y-2">
          {Object.entries(byCanal).map(([canal, evs]) => (
            <div key={canal}>
              <div className="flex items-center gap-2 px-1 mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: CHANNEL_META[canal]?.color ?? '#ccc' }} />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{canal}</span>
              </div>
              <div className="space-y-1.5">
                {evs.map(c => <CommCard key={c.id} c={c} onOpen={onOpen} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function BriefingPage() {
  const { communications } = useApp()
  const { role, myCountries } = useAuth()
  const [editComm, setEditComm] = useState(null)

  const mine = useMemo(() => {
    const isRestricted = role !== 'super_admin' && myCountries.length > 0
    return isRestricted
      ? communications.filter(c => arr(c.pais).some(p => myCountries.includes(p) || p === 'GL'))
      : communications
  }, [communications, role, myCountries])

  const today = todayStr()
  const todayDate = new Date(today + 'T00:00:00')

  const days = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const ds    = addDays(today, i)
      const comms = mine.filter(c => c.date === ds && arr(c.estado)[0] !== 'Cancelado')
      return { ds, comms, isToday: i === 0 }
    })
  }, [mine, today])

  const totalThisWeek = days.slice(0, 7).reduce((n, d) => n + d.comms.length, 0)

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-5 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xl">📋</span>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">Briefing</h1>
            </div>
            <p className="text-sm text-gray-400">
              {DAYS_ES[todayDate.getDay()]}, {todayDate.getDate()} de {MONTHS_ES[todayDate.getMonth()]} {todayDate.getFullYear()}
              <span className="ml-3 text-gray-300">·</span>
              <span className="ml-3 text-sky-600 font-medium">{totalThisWeek} comms esta semana</span>
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-6">
          {days.map(({ ds, comms, isToday }) => (
            (comms.length > 0 || isToday) && (
              <DayBlock key={ds} ds={ds} comms={comms} isToday={isToday} onOpen={setEditComm} />
            )
          ))}
          {days.every(d => d.comms.length === 0) && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <span className="text-5xl mb-4">🎉</span>
              <p className="text-lg font-bold text-gray-700">Sin comms los próximos 14 días</p>
              <p className="text-sm text-gray-400 mt-1">Disfrutá el silencio o planificá algo nuevo</p>
            </div>
          )}
        </div>
      </div>

      <CommModal
        open={!!editComm}
        onClose={() => setEditComm(null)}
        initial={editComm}
      />
    </div>
  )
}
