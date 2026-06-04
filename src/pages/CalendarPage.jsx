import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useApp } from '@/contexts/AppContext'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from '@/components/layout/Toaster'
import CommModal from '@/components/CommModal'
import { dateStr, todayStr, arr, intersects, cn } from '@/lib/utils'
import {
  COUNTRY_META, CHANNEL_META, STATUS_META, FORMAT_ICON,
  INTERNAL_CHANNELS, EXTERNAL_CHANNELS,
} from '@/lib/constants'

// ── i18n labels ───────────────────────────────────────
const DOW_ES    = ['Do','Lu','Ma','Mi','Ju','Vi','Sá']
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DOW_EN    = ['Su','Mo','Tu','We','Th','Fr','Sa']
const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DOW_PT    = ['Do','Se','Te','Qu','Qu','Se','Sá']
const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function getDowLabels(lang) {
  if (lang.startsWith('en')) return DOW_EN
  if (lang.startsWith('pt')) return DOW_PT
  return DOW_ES
}
function getMonthNames(lang) {
  if (lang.startsWith('en')) return MONTHS_EN
  if (lang.startsWith('pt')) return MONTHS_PT
  return MONTHS_ES
}
// Mon-first order: [Mon…Sun]
function getMonFirstLabels(lang) {
  const l = getDowLabels(lang)
  return [...l.slice(1), l[0]]
}

// ── Date helpers ──────────────────────────────────────
function getMonday(d = new Date()) {
  const r = new Date(d)
  const day = r.getDay()
  r.setDate(r.getDate() - (day === 0 ? 6 : day - 1))
  r.setHours(0, 0, 0, 0)
  return r
}
function addDays(d, n) {
  const r = new Date(d); r.setDate(r.getDate() + n); return r
}
function weekLabel(monday, lang) {
  const sunday = addDays(monday, 6)
  const months = getMonthNames(lang)
  const ms = months[monday.getMonth()]
  const ss = months[sunday.getMonth()]
  const y  = sunday.getFullYear()
  if (ms === ss) return `${monday.getDate()}–${sunday.getDate()} de ${ms} ${y}`
  return `${monday.getDate()} ${ms} – ${sunday.getDate()} ${ss} ${y}`
}

// ── Filters ───────────────────────────────────────────
const FILTER_KEYS = [
  { key: 'pais',     tKey: 'filter.country' },
  { key: 'canal',    tKey: 'filter.channel' },
  { key: 'topico',   tKey: 'filter.topic'   },
  { key: 'segmento', tKey: 'filter.segment' },
  { key: 'estado',   tKey: 'filter.status'  },
]

function FilterPill({ label, tClear, options, value, onChange }) {
  const [open, setOpen] = useState(false)
  const has = value.length > 0
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full border transition-colors ${
          has ? 'bg-sky-50 border-sky-200 text-sky-700 font-medium' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
        }`}
      >
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
        {has && <span className="font-bold">·{value.length}</span>}
        <span className="opacity-40 text-[10px]">▾</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 left-0 z-30 bg-white border border-gray-100 rounded-2xl shadow-xl min-w-[160px] overflow-hidden">
            <div className="max-h-52 overflow-y-auto py-1">
              {options.map(opt => {
                const sel = value.includes(opt)
                return (
                  <button
                    key={opt}
                    onClick={() => onChange(sel ? value.filter(v => v !== opt) : [...value, opt])}
                    className={`w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors ${sel ? 'bg-sky-50/60 text-sky-700 font-medium' : 'text-gray-700'}`}
                  >
                    <span className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center text-[8px] ${sel ? 'bg-sky-500 border-sky-500 text-white' : 'border-gray-300'}`}>
                      {sel ? '✓' : ''}
                    </span>
                    {COUNTRY_META[opt]?.flag ? `${COUNTRY_META[opt].flag} ` : ''}{opt}
                  </button>
                )
              })}
            </div>
            {has && (
              <div className="border-t px-3 py-1.5">
                <button onClick={() => onChange([])} className="text-xs text-gray-400 hover:text-gray-700">{tClear}</button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ── Event cards ───────────────────────────────────────
function EventCard({ ev, status_t, onClick, onDragStart }) {
  const paises   = arr(ev.pais)
  const canal    = arr(ev.canal)[0]
  const status   = arr(ev.estado)[0]
  const formato  = arr(ev.formato)[0]
  const chanMeta = CHANNEL_META[canal] ?? {}
  const stMeta   = STATUS_META[status] ?? {}

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      title={ev.titulo}
      className="comm-chip rounded-lg p-2 mb-1.5 cursor-pointer overflow-hidden"
      style={{
        background: stMeta.bg ?? '#f5f5f7',
        color:      stMeta.color ?? '#1a1a1a',
        borderLeft: `3px solid ${chanMeta.color ?? '#d1d5db'}`,
        opacity:    status === 'Cancelado' ? 0.45 : 1,
        boxShadow:  ev.destacado ? `0 0 0 1.5px ${chanMeta.color ?? '#e5e7eb'}60` : undefined,
      }}
    >
      {/* Flags + status */}
      <div className="flex items-center gap-0.5 mb-1">
        <div className="flex items-center">
          {paises.slice(0, 4).map(p => (
            <span key={p} className="text-[11px] leading-none -mr-0.5">{COUNTRY_META[p]?.flag ?? ''}</span>
          ))}
          {paises.length > 4 && <span className="text-[8px] text-current opacity-50 ml-1">+{paises.length - 4}</span>}
        </div>
        {ev.destacado && <span className="text-amber-400 text-[9px] ml-0.5">★</span>}
        <span
          className="ml-auto text-[8px] font-semibold px-1.5 py-0.5 rounded-full leading-none whitespace-nowrap flex-shrink-0"
          style={{ background: (stMeta.dot ?? '#888') + '22', color: stMeta.dot ?? '#888' }}
        >
          {status_t}
        </span>
      </div>

      {/* Title */}
      <div className="text-[11px] font-semibold leading-snug line-clamp-2 mb-1">
        {FORMAT_ICON[formato] ? <span className="mr-0.5">{FORMAT_ICON[formato]}</span> : null}
        {ev.titulo}
      </div>

      {/* Canal */}
      {canal && (
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: chanMeta.color ?? '#ccc' }} />
          <span className="text-[9px] opacity-55 truncate">{canal}</span>
        </div>
      )}
    </div>
  )
}

// Compact card for month view
function MiniCard({ ev, onClick, onDragStart }) {
  const country  = arr(ev.pais)[0]
  const canal    = arr(ev.canal)[0]
  const status   = arr(ev.estado)[0]
  const chanMeta = CHANNEL_META[canal] ?? {}
  const stMeta   = STATUS_META[status] ?? {}
  const flag     = COUNTRY_META[country]?.flag ?? ''

  return (
    <div
      draggable
      onDragStart={e => { e.stopPropagation(); onDragStart?.() }}
      onClick={e => { e.stopPropagation(); onClick() }}
      title={ev.titulo}
      className="text-[10px] font-medium px-1.5 py-0.5 rounded cursor-pointer flex items-center gap-1 mb-0.5 overflow-hidden"
      style={{
        background: stMeta.bg ?? '#f5f5f7',
        color:      stMeta.color ?? '#1a1a1a',
        borderLeft: `2px solid ${chanMeta.color ?? '#d1d5db'}`,
        opacity:    status === 'Cancelado' ? 0.6 : 1,
      }}
    >
      <span className="flex-shrink-0 leading-none">{flag}</span>
      <span className="truncate flex-1">{ev.titulo}</span>
      {ev.destacado && <span className="text-amber-400 flex-shrink-0 text-[9px]">★</span>}
    </div>
  )
}

// ── Country overload alert ────────────────────────────
const INT_SET = new Set(INTERNAL_CHANNELS)
const EXT_SET = new Set(EXTERNAL_CHANNELS)

function CountryAlert({ comms, dateStrs }) {
  const intCounts = {}
  const extCounts = {}

  comms
    .filter(ev => dateStrs.includes(ev.date))
    .forEach(ev => {
      const channels = arr(ev.canal)
      const hasInt = channels.some(c => INT_SET.has(c))
      const hasExt = channels.some(c => EXT_SET.has(c))
      arr(ev.pais).forEach(p => {
        const key = `${p}||${ev.date}`
        if (hasInt) intCounts[key] = (intCounts[key] ?? 0) + 1
        if (hasExt) extCounts[key] = (extCounts[key] ?? 0) + 1
      })
    })

  const alerts = []
  const allKeys = new Set([...Object.keys(intCounts), ...Object.keys(extCounts)])
  allKeys.forEach(key => {
    const [p, date] = key.split('||')
    const [, m, d] = date.split('-')
    const label = `${COUNTRY_META[p]?.flag ?? ''} ${COUNTRY_META[p]?.name ?? p}`
    const day = `${d}/${m}`
    if ((intCounts[key] ?? 0) > 3) alerts.push({ key: `${key}|int`, label, day, n: intCounts[key], type: 'int' })
    if ((extCounts[key] ?? 0) > 3) alerts.push({ key: `${key}|ext`, label, day, n: extCounts[key], type: 'ext' })
  })

  if (!alerts.length) return null

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-50 border-b border-amber-100 text-xs text-amber-700 flex-shrink-0 flex-wrap">
      <span className="font-semibold">⚠️ Más de 3 comms en un día:</span>
      {alerts.map(({ key, label, day, n, type }) => (
        <span key={key} className={cn(
          'font-medium px-2 py-0.5 rounded-full',
          type === 'int' ? 'bg-amber-100' : 'bg-sky-100 text-sky-700'
        )}>
          {label} el {day} · {n} {type === 'int' ? 'int' : 'ext'}
        </span>
      ))}
    </div>
  )
}

// ── Month view ────────────────────────────────────────
function MonthView({ year, month, communications, filters, today, lang, canEdit, onClickCard, onAdd, onDragStart, onDrop }) {
  const [dragOver, setDragOver] = useState(null)
  const dowLabels = getMonFirstLabels(lang)

  const weeks = useMemo(() => {
    const firstDay  = new Date(year, month, 1)
    const dayOfWeek = (firstDay.getDay() + 6) % 7
    const lastDay   = new Date(year, month + 1, 0)
    const result    = []
    let cur = new Date(year, month, 1 - dayOfWeek)
    while (cur <= lastDay && result.length < 6) {
      const week = []
      for (let i = 0; i < 7; i++) {
        week.push(new Date(cur))
        cur.setDate(cur.getDate() + 1)
      }
      result.push(week)
    }
    return result
  }, [year, month])

  const allDateSet = useMemo(() => {
    const s = new Set()
    weeks.forEach(w => w.forEach(d => s.add(dateStr(d))))
    return s
  }, [weeks])

  const filtered = useMemo(() =>
    communications.filter(ev =>
      allDateSet.has(ev.date) &&
      FILTER_KEYS.every(fd => intersects(ev[fd.key], filters[fd.key]))
    ),
    [communications, allDateSet, filters]
  )

  const byDate = useMemo(() => {
    const map = {}
    filtered.forEach(ev => {
      if (!map[ev.date]) map[ev.date] = []
      map[ev.date].push(ev)
    })
    return map
  }, [filtered])

  const MAX_SHOW = 4

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Column headers */}
      <div className="grid grid-cols-7 border-b border-gray-100 flex-shrink-0">
        {dowLabels.map((d, i) => (
          <div key={i} className="text-center py-2 text-[10px] uppercase tracking-widest text-gray-400 font-medium border-r border-gray-100 last:border-r-0">
            {d}
          </div>
        ))}
      </div>

      {/* Weeks */}
      <div className="flex-1" style={{ display: 'grid', gridTemplateRows: `repeat(${weeks.length}, minmax(100px, 1fr))` }}>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7" style={{ minHeight: 100 }}>
            {week.map(d => {
              const ds             = dateStr(d)
              const isCurrentMonth = d.getMonth() === month && d.getFullYear() === year
              const dow            = d.getDay()
              const isWE           = dow === 0 || dow === 6
              const isTod          = ds === today
              const isDO           = dragOver === ds
              const evs            = byDate[ds] ?? []

              return (
                <div
                  key={ds}
                  className={cn(
                    'border-r border-b border-gray-100 p-1 last:border-r-0 overflow-hidden',
                    !isCurrentMonth ? 'bg-gray-50/50' : isWE ? 'bg-gray-50/30' : 'bg-white',
                    isTod ? '!bg-sky-50/50' : '',
                    isDO  ? '!bg-sky-50 ring-1 ring-inset ring-sky-200' : '',
                    canEdit && isCurrentMonth ? 'cursor-pointer' : '',
                  )}
                  onClick={() => canEdit && isCurrentMonth && onAdd(ds)}
                  onDragOver={e => { e.preventDefault(); setDragOver(ds) }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={e => { e.preventDefault(); setDragOver(null); onDrop(ds) }}
                >
                  <div className={cn(
                    'text-[11px] font-semibold w-5 h-5 flex items-center justify-center rounded-full mb-0.5',
                    isTod           ? 'bg-sky-500 text-white'  :
                    !isCurrentMonth ? 'text-gray-300'          :
                    isWE            ? 'text-gray-400'          : 'text-gray-700',
                  )}>
                    {d.getDate()}
                  </div>
                  {evs.slice(0, MAX_SHOW).map(ev => (
                    <MiniCard
                      key={ev.id}
                      ev={ev}
                      onClick={() => onClickCard(ev)}
                      onDragStart={() => onDragStart(ev.id)}
                    />
                  ))}
                  {evs.length > MAX_SHOW && (
                    <div className="text-[9px] text-gray-400 font-medium pl-1 mt-0.5">
                      +{evs.length - MAX_SHOW} más
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main CalendarPage ─────────────────────────────────
export default function CalendarPage() {
  const { communications, channels, updateComm } = useApp()
  const { perms, canEditCountry }                = useAuth()
  const { t, i18n }                             = useTranslation()

  const [viewMode,      setViewMode]      = useState('week')
  const [weekStart,     setWeekStart]     = useState(() => getMonday())
  const [currentMonth,  setCurrentMonth]  = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  const [filters, setFilters] = useState({ pais:[], canal:[], topico:[], segmento:[], estado:[] })
  const [modal,   setModal]   = useState({ open: false, initial: null })
  const [dragId,  setDragId]  = useState(null)

  const today      = todayStr()
  const lang       = i18n.language
  const monthNames = getMonthNames(lang)
  const dowLabels  = getDowLabels(lang)

  const weekDays    = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])
  const weekDayStrs = useMemo(() => weekDays.map(d => dateStr(d)), [weekDays])
  const isThisWeek  = weekDayStrs.includes(today)

  // Filter option lists
  const paiOptions    = useMemo(() => [...new Set(communications.flatMap(c => arr(c.pais)))].sort(), [communications])
  const canalOptions  = useMemo(() => [...new Set(communications.flatMap(c => arr(c.canal)))].sort(), [communications])
  const topicoOptions = useMemo(() => [...new Set(communications.flatMap(c => arr(c.topico)))].sort(), [communications])
  const segOptions    = useMemo(() => [...new Set(communications.flatMap(c => arr(c.segmento)))].sort(), [communications])
  const estadoOptions = ['Aprobado','En revisión','Borrador','Publicado','Cancelado']
  const filterOptions = { pais: paiOptions, canal: canalOptions, topico: topicoOptions, segmento: segOptions, estado: estadoOptions }

  // Week-filtered comms
  const weekFiltered = useMemo(() =>
    communications.filter(ev =>
      weekDayStrs.includes(ev.date) &&
      FILTER_KEYS.every(fd => intersects(ev[fd.key], filters[fd.key]))
    ),
    [communications, weekDayStrs, filters]
  )

  const byDate = useMemo(() => {
    const map = {}
    weekFiltered.forEach(ev => {
      if (!map[ev.date]) map[ev.date] = []
      map[ev.date].push(ev)
    })
    return map
  }, [weekFiltered])

  const internalCh = channels.length > 0 ? channels.filter(c => c.type === 'internal').map(c => c.name) : INTERNAL_CHANNELS
  const externalCh = channels.length > 0 ? channels.filter(c => c.type === 'external').map(c => c.name) : EXTERNAL_CHANNELS
  const allChannels = [...internalCh, ...externalCh]
  const visChannels = allChannels.filter(ch => filters.canal.length === 0 || filters.canal.includes(ch))

  // Month navigation
  function prevMonth() {
    setCurrentMonth(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
    )
  }
  function nextMonth() {
    setCurrentMonth(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
    )
  }

  // Modal helpers
  function openNew(canal = '', date = '') {
    setModal({
      open: true,
      initial: {
        titulo:'', body:'', date, pais:[], canal: canal ? [canal] : [],
        segmento:[], ubicacion:[], topico:[], formato:[], idioma:[],
        alcance:['Local'], estado:['Borrador'], destacado:false,
      },
    })
  }
  function openEdit(ev) { setModal({ open: true, initial: ev }) }

  // Drag & drop
  async function handleWeekDrop(ds, ch) {
    if (!dragId || !perms.canEdit) return
    const ev = communications.find(c => c.id === dragId)
    if (!ev || !canEditCountry(arr(ev.pais))) return
    const newCanal = arr(ev.canal).includes(ch) ? ev.canal : [ch]
    await updateComm(ev.id, { ...ev, date: ds, canal: newCanal })
    toast({ title: t('toast.moved'), variant: 'success' })
    setDragId(null)
  }

  async function handleMonthDrop(ds) {
    if (!dragId || !perms.canEdit) return
    const ev = communications.find(c => c.id === dragId)
    if (!ev || !canEditCountry(arr(ev.pais))) return
    await updateComm(ev.id, { ...ev, date: ds })
    toast({ title: t('toast.moved'), variant: 'success' })
    setDragId(null)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-white flex-wrap flex-shrink-0">

        {/* Navigation */}
        <div className="flex items-center gap-0.5">
          {viewMode === 'week' ? (
            <>
              <button onClick={() => setWeekStart(w => addDays(w, -7))} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <ChevronLeft className="h-4 w-4 text-gray-400" />
              </button>
              <span className="text-sm font-semibold text-gray-800 px-2 min-w-[210px] text-center select-none">
                {weekLabel(weekStart, lang)}
              </span>
              <button onClick={() => setWeekStart(w => addDays(w, 7))} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>
            </>
          ) : (
            <>
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <ChevronLeft className="h-4 w-4 text-gray-400" />
              </button>
              <span className="text-sm font-semibold text-gray-800 px-2 min-w-[160px] text-center select-none">
                {monthNames[currentMonth.month]} {currentMonth.year}
              </span>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>
            </>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-1.5 flex-wrap">
          {FILTER_KEYS.map(fd => (
            <FilterPill
              key={fd.key}
              label={t(fd.tKey)}
              tClear={t('filter.clear')}
              options={filterOptions[fd.key]}
              value={filters[fd.key]}
              onChange={v => setFilters(f => ({ ...f, [fd.key]: v }))}
            />
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Week / Month toggle */}
          <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden text-xs">
            <button
              onClick={() => setViewMode('week')}
              className={cn('px-3 py-1.5 transition-colors', viewMode === 'week' ? 'bg-sky-50 text-sky-600 font-semibold' : 'text-gray-500 hover:bg-gray-50')}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={cn('px-3 py-1.5 transition-colors border-l border-gray-200', viewMode === 'month' ? 'bg-sky-50 text-sky-600 font-semibold' : 'text-gray-500 hover:bg-gray-50')}
            >
              Mes
            </button>
          </div>

          {viewMode === 'week' && !isThisWeek && (
            <Button size="sm" variant="outline" onClick={() => setWeekStart(getMonday())}>
              <CalendarDays className="h-3.5 w-3.5 mr-1" /> {t('calendar.today')}
            </Button>
          )}
          {perms.canEdit && (
            <Button size="sm" onClick={() => openNew()}>
              <Plus className="h-3.5 w-3.5 mr-1" /> {t('calendar.new')}
            </Button>
          )}
        </div>
      </div>

      {/* Country overload alert (week view) */}
      {viewMode === 'week' && (
        <CountryAlert comms={communications} dateStrs={weekDayStrs} />
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'week' ? (
          <div className="h-full overflow-auto">
            <table className="border-collapse" style={{ minWidth: 480, width: '100%', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: 80, minWidth: 80 }} />
                {weekDays.map((_, i) => <col key={i} />)}
              </colgroup>
              <thead className="sticky top-0 z-10 bg-white">
                <tr>
                  <th className="border-b border-r border-gray-100 bg-gray-50/40 px-2 py-2" />
                  {weekDays.map(d => {
                    const ds   = dateStr(d)
                    const dow  = d.getDay()
                    const isWE = dow === 0 || dow === 6
                    const isTod = ds === today
                    return (
                      <th
                        key={ds}
                        className={cn(
                          'border-b border-r border-gray-100 px-1 py-2 text-center font-normal',
                          isWE  ? 'bg-gray-50/60' : 'bg-white',
                          isTod ? '!bg-sky-50 !border-b-2 !border-b-sky-400' : '',
                        )}
                      >
                        <div className={`text-[10px] uppercase tracking-widest mb-0.5 ${isTod ? 'text-sky-500 font-bold' : 'text-gray-400'}`}>
                          {dowLabels[dow]}
                        </div>
                        <div className={cn(
                          'text-sm font-bold w-7 h-7 flex items-center justify-center mx-auto rounded-full',
                          isTod ? 'bg-sky-500 text-white' : isWE ? 'text-gray-300' : 'text-gray-800',
                        )}>
                          {d.getDate()}
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={8} className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-gray-400 bg-gray-50/70 border-y border-gray-100">
                    {t('calendar.internalChannels')}
                  </td>
                </tr>
                {internalCh.filter(ch => visChannels.includes(ch)).map(ch => (
                  <WeekChannelRow
                    key={ch}
                    channel={ch}
                    days={weekDays}
                    today={today}
                    byDate={byDate}
                    canEdit={perms.canEdit}
                    canEditCountry={canEditCountry}
                    onClickCard={openEdit}
                    onAdd={(ch, ds) => openNew(ch, ds)}
                    onDragStart={id => setDragId(id)}
                    onDrop={handleWeekDrop}
                    statusT={s => t(`status.${s}`, s)}
                  />
                ))}
                <tr>
                  <td colSpan={8} className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-gray-400 bg-gray-50/70 border-y border-gray-100">
                    {t('calendar.externalChannels')}
                  </td>
                </tr>
                {externalCh.filter(ch => visChannels.includes(ch)).map(ch => (
                  <WeekChannelRow
                    key={ch}
                    channel={ch}
                    days={weekDays}
                    today={today}
                    byDate={byDate}
                    canEdit={perms.canEdit}
                    canEditCountry={canEditCountry}
                    onClickCard={openEdit}
                    onAdd={(ch, ds) => openNew(ch, ds)}
                    onDragStart={id => setDragId(id)}
                    onDrop={handleWeekDrop}
                    statusT={s => t(`status.${s}`, s)}
                  />
                ))}
              </tbody>
            </table>
            {/* Legend */}
            <div className="flex flex-wrap gap-3 px-4 py-3 text-xs text-gray-400 border-t border-gray-100">
              {allChannels.map(ch => (
                <span key={ch} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: CHANNEL_META[ch]?.color ?? '#ccc' }} />
                  <span className="text-gray-500">{ch}</span>
                </span>
              ))}
            </div>
          </div>
        ) : (
          <MonthView
            year={currentMonth.year}
            month={currentMonth.month}
            communications={communications}
            filters={filters}
            today={today}
            lang={lang}
            canEdit={perms.canEdit}
            onClickCard={openEdit}
            onAdd={ds => openNew('', ds)}
            onDragStart={id => setDragId(id)}
            onDrop={handleMonthDrop}
            statusT={s => t(`status.${s}`, s)}
          />
        )}
      </div>

      <CommModal
        open={modal.open}
        initial={modal.initial}
        onClose={() => setModal({ open: false, initial: null })}
      />
    </div>
  )
}

// ── Week Channel Row ──────────────────────────────────
function WeekChannelRow({ channel, days, today, byDate, canEdit, canEditCountry, onClickCard, onAdd, onDragStart, onDrop, statusT }) {
  const chanMeta = CHANNEL_META[channel] ?? {}
  const [dragOver, setDragOver] = useState(null)

  return (
    <tr className="group">
      <td className="sticky left-0 z-[5] bg-white border-r border-b border-gray-100 px-2 py-2" style={{ width: 80, minWidth: 80 }}>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: chanMeta.color ?? '#d1d5db' }} />
          <span className="text-[10px] font-medium text-gray-600 truncate leading-tight">{channel}</span>
        </div>
      </td>
      {days.map(d => {
        const ds   = dateStr(d)
        const dow  = d.getDay()
        const isWE = dow === 0 || dow === 6
        const isTod = ds === today
        const evs  = (byDate[ds] ?? []).filter(ev => arr(ev.canal).includes(channel))
        const isDO = dragOver === ds

        return (
          <td
            key={ds}
            className={cn(
              'border-r border-b border-gray-100 align-top p-1.5',
              isWE  ? 'bg-gray-50/50' : 'bg-white',
              isTod ? '!bg-sky-50/30' : '',
              isDO  ? 'drag-over' : '',
            )}
            style={{ verticalAlign: 'top', height: 88 }}
            onDragOver={e => { if (!isWE && canEdit) { e.preventDefault(); setDragOver(ds) } }}
            onDragLeave={() => setDragOver(null)}
            onDrop={e => { e.preventDefault(); setDragOver(null); onDrop(ds, channel) }}
          >
            {!isWE && (
              <>
                {evs.map(ev => (
                  <EventCard
                    key={ev.id}
                    ev={ev}
                    status_t={statusT(arr(ev.estado)[0])}
                    onClick={() => onClickCard(ev)}
                    onDragStart={() => onDragStart(ev.id)}
                  />
                ))}
                {canEdit && (
                  <button
                    onClick={() => onAdd(channel, ds)}
                    className="w-full h-5 flex items-center justify-center rounded-lg border border-dashed border-gray-200 text-gray-300 hover:border-sky-300 hover:text-sky-400 transition-colors mt-0.5 opacity-0 group-hover:opacity-100"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                )}
              </>
            )}
          </td>
        )
      })}
    </tr>
  )
}
